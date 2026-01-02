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
      SELECT * FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      // Create a default business if none exists
      const newBusiness = await sql`
        INSERT INTO businesses (owner_id, salon_name)
        VALUES (${userId}, 'Můj Salon')
        RETURNING *
      `;
      return Response.json({ business: newBusiness[0] });
    }

    return Response.json({ business: businesses[0] });
  } catch (error) {
    console.error("GET /api/business/settings error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { salon_name, address, phone_number } = body;

    // Get user's business
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    let business;

    if (businesses.length === 0) {
      // Create new business
      const newBusiness = await sql`
        INSERT INTO businesses (owner_id, salon_name, address, phone_number)
        VALUES (${userId}, ${salon_name}, ${address || null}, ${phone_number || null})
        RETURNING *
      `;
      business = newBusiness[0];
    } else {
      // Update existing business
      const businessId = businesses[0].id;

      const setClauses = [];
      const values = [];

      if (salon_name !== undefined) {
        setClauses.push(`salon_name = $${values.length + 1}`);
        values.push(salon_name);
      }
      if (address !== undefined) {
        setClauses.push(`address = $${values.length + 1}`);
        values.push(address || null);
      }
      if (phone_number !== undefined) {
        setClauses.push(`phone_number = $${values.length + 1}`);
        values.push(phone_number || null);
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      if (setClauses.length > 1) {
        const query = `UPDATE businesses SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
        values.push(businessId);
        const result = await sql(query, values);
        business = result[0];
      }
    }

    return Response.json({ business });
  } catch (error) {
    console.error("PUT /api/business/settings error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
