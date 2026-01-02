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
      return Response.json({ services: [] });
    }

    const businessId = businesses[0].id;

    const services = await sql`
      SELECT * FROM services
      WHERE business_id = ${businessId}
      ORDER BY created_at DESC
    `;

    return Response.json({ services });
  } catch (error) {
    console.error("GET /api/services error:", error);
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

    const { name, price, duration, description } = body;

    if (!name || !price || !duration) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO services (business_id, name, price, duration, description)
      VALUES (${businessId}, ${name}, ${price}, ${duration}, ${description || null})
      RETURNING *
    `;

    return Response.json({ service: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
