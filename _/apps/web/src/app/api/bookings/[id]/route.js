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

    // Verify booking belongs to user's business
    const bookingCheck = await sql`
      SELECT b.id
      FROM bookings b
      JOIN businesses biz ON b.business_id = biz.id
      WHERE b.id = ${id} AND biz.owner_id = ${userId}
    `;

    if (bookingCheck.length === 0) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const {
      customer_name,
      customer_phone,
      service_id,
      booking_date,
      booking_time,
      notes,
      status,
    } = body;

    const setClauses = [];
    const values = [];

    if (customer_name) {
      setClauses.push(`customer_name = $${values.length + 1}`);
      values.push(customer_name);
    }
    if (customer_phone) {
      setClauses.push(`customer_phone = $${values.length + 1}`);
      values.push(customer_phone);
    }
    if (service_id !== undefined) {
      setClauses.push(`service_id = $${values.length + 1}`);
      values.push(service_id || null);
    }
    if (booking_date) {
      setClauses.push(`booking_date = $${values.length + 1}`);
      values.push(booking_date);
    }
    if (booking_time) {
      setClauses.push(`booking_time = $${values.length + 1}`);
      values.push(booking_time);
    }
    if (notes !== undefined) {
      setClauses.push(`notes = $${values.length + 1}`);
      values.push(notes || null);
    }
    if (status) {
      setClauses.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    setClauses.push(`updated_at = $${values.length + 1}`);
    values.push(new Date());

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `UPDATE bookings SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await sql(query, values);

    return Response.json({ booking: result[0] });
  } catch (error) {
    console.error("PUT /api/bookings/[id] error:", error);
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

    // Verify booking belongs to user's business
    const bookingCheck = await sql`
      SELECT b.id
      FROM bookings b
      JOIN businesses biz ON b.business_id = biz.id
      WHERE b.id = ${id} AND biz.owner_id = ${userId}
    `;

    if (bookingCheck.length === 0) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    await sql`DELETE FROM bookings WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bookings/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
