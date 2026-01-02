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
      return Response.json({ hours: [] });
    }

    const businessId = businesses[0].id;

    const hours = await sql`
      SELECT * FROM opening_hours
      WHERE business_id = ${businessId}
      ORDER BY day_of_week
    `;

    return Response.json({ hours });
  } catch (error) {
    console.error("GET /api/opening-hours error:", error);
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
    const { hours } = body;

    // Get user's business
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({ error: "No business found" }, { status: 404 });
    }

    const businessId = businesses[0].id;

    // Delete existing hours
    await sql`DELETE FROM opening_hours WHERE business_id = ${businessId}`;

    // Insert new hours
    if (hours && hours.length > 0) {
      for (const hour of hours) {
        await sql`
          INSERT INTO opening_hours (business_id, day_of_week, open_time, close_time, is_closed)
          VALUES (
            ${businessId},
            ${hour.day_of_week},
            ${hour.is_closed ? null : hour.open_time},
            ${hour.is_closed ? null : hour.close_time},
            ${hour.is_closed}
          )
        `;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/opening-hours error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
