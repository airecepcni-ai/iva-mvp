import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's business
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({
        todayBookings: 0,
        weekBookings: 0,
        monthRevenue: 0,
        activeServices: 0,
      });
    }

    const businessId = businesses[0].id;

    // Today's bookings
    const todayBookings = await sql`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE business_id = ${businessId}
        AND booking_date = CURRENT_DATE
        AND status = 'confirmed'
    `;

    // This week's bookings
    const weekBookings = await sql`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE business_id = ${businessId}
        AND booking_date >= CURRENT_DATE - INTERVAL '7 days'
        AND booking_date <= CURRENT_DATE
        AND status IN ('confirmed', 'completed')
    `;

    // Month revenue (from completed bookings)
    const monthRevenue = await sql`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.business_id = ${businessId}
        AND b.status = 'completed'
        AND EXTRACT(MONTH FROM b.booking_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM b.booking_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    // Active services
    const activeServices = await sql`
      SELECT COUNT(*) as count
      FROM services
      WHERE business_id = ${businessId}
    `;

    return Response.json({
      todayBookings: parseInt(todayBookings[0].count),
      weekBookings: parseInt(weekBookings[0].count),
      monthRevenue: parseFloat(monthRevenue[0].total) || 0,
      activeServices: parseInt(activeServices[0].count),
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
