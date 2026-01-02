import sql from "../utils/sql.js";
import { auth } from "../../../auth.js";

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

    // Get bookings with service names
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
        b.created_at,
        s.name as service_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.business_id = ${businessId}
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `;

    return Response.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Get user's business
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({ error: "No business found" }, { status: 404 });
    }

    const businessId = businesses[0].id;

    const {
      customer_name,
      customer_phone,
      service_id,
      booking_date,
      booking_time,
      notes,
    } = body;

    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO bookings (
        business_id,
        customer_name,
        customer_phone,
        service_id,
        booking_date,
        booking_time,
        notes,
        status
      ) VALUES (
        ${businessId},
        ${customer_name},
        ${customer_phone},
        ${service_id || null},
        ${booking_date},
        ${booking_time},
        ${notes || null},
        'confirmed'
      )
      RETURNING *
    `;

    return Response.json({ booking: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
