import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";
import { AVERAGE_JOB_VALUE } from "../../utils/constants.js";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({
        revenue: 0,
        bookingsCount: 0,
        callsCount: 0,
        afterHoursBookings: 0,
        revenueTrend: null,
      });
    }

    const businessId = businesses[0].id;

    const services = await sql`
      SELECT slug, price_from
      FROM services
      WHERE business_id = ${businessId}
    `;
    const serviceMap = new Map(services.map((service) => [service.slug, service.price_from]));

    const bookings = await sql`
      SELECT created_at, raw_booking_json, service_slug, status
      FROM bookings
      WHERE business_id = ${businessId}
        AND created_at >= NOW() - INTERVAL '60 days'
        AND status != 'cancelled'
    `;

    const now = new Date();
    const last30Start = new Date(now);
    last30Start.setDate(now.getDate() - 30);
    const prior30Start = new Date(now);
    prior30Start.setDate(now.getDate() - 60);

    const valueForBooking = (booking) => {
      const raw = booking.raw_booking_json || {};
      const rawValue = raw.job_value ?? raw.price ?? raw.total ?? raw.amount ?? null;
      if (typeof rawValue === "number") return rawValue;
      const serviceValue = serviceMap.get(booking.service_slug);
      if (typeof serviceValue === "number") return serviceValue;
      return AVERAGE_JOB_VALUE;
    };

    let currentRevenue = 0;
    let priorRevenue = 0;
    let bookingsCount = 0;
    let afterHoursBookings = 0;

    for (const booking of bookings) {
      const created = new Date(booking.created_at);
      const value = valueForBooking(booking);
      if (created >= last30Start) {
        currentRevenue += value;
        bookingsCount += 1;
        const hour = created.getHours();
        if (hour >= 17 || hour < 8) afterHoursBookings += 1;
      } else if (created >= prior30Start) {
        priorRevenue += value;
      }
    }

    const revenueTrend =
      priorRevenue > 0 ? Math.round(((currentRevenue - priorRevenue) / priorRevenue) * 100) : null;

    const callsCountResult = await sql`
      SELECT COUNT(*)::int AS count
      FROM contacts
      WHERE business_id = ${businessId}
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    return Response.json({
      revenue: currentRevenue,
      bookingsCount,
      callsCount: callsCountResult[0]?.count ?? 0,
      afterHoursBookings,
      revenueTrend,
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
