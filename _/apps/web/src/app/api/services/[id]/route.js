import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;
    const body = await request.json();

    // Verify service belongs to user's business
    const serviceCheck = await sql`
      SELECT s.id
      FROM services s
      JOIN businesses b ON s.business_id = b.id
      WHERE s.id = ${id} AND b.owner_id = ${userId}
    `;

    if (serviceCheck.length === 0) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    const { name, price, duration, description } = body;

    const setClauses = [];
    const values = [];

    if (name) {
      setClauses.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (price !== undefined) {
      setClauses.push(`price = $${values.length + 1}`);
      values.push(price);
    }
    if (duration !== undefined) {
      setClauses.push(`duration = $${values.length + 1}`);
      values.push(duration);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${values.length + 1}`);
      values.push(description || null);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `UPDATE services SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await sql(query, values);

    return Response.json({ service: result[0] });
  } catch (error) {
    console.error("PUT /api/services/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;

    // Verify service belongs to user's business
    const serviceCheck = await sql`
      SELECT s.id
      FROM services s
      JOIN businesses b ON s.business_id = b.id
      WHERE s.id = ${id} AND b.owner_id = ${userId}
    `;

    if (serviceCheck.length === 0) {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    await sql`DELETE FROM services WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/services/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
