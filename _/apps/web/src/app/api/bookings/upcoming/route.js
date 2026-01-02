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
      return Response.json({ bookings: [] });
    }

    const businessId = businesses[0].id;

    // Get upcoming bookings (today and future, confirmed status only)
    const bookings = await sql`
      SELECT 
        b.id,
        b.customer_name,
        b.customer_phone,
        b.service_id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.notes,
        s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.business_id = ${businessId}
        AND b.status = 'confirmed'
        AND b.booking_date >= CURRENT_DATE
      ORDER BY b.booking_date ASC, b.booking_time ASC
      LIMIT 10
    `;

    return Response.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings/upcoming error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
