import sql from "../../../../utils/sql.js";
import { auth } from "../../../../../auth.js";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const status = body?.status;

    if (!status) {
      return Response.json({ error: "Missing status" }, { status: 400 });
    }

    const ownerId = session.user.id;
    const alertCheck = await sql`
      SELECT a.id
      FROM alerts a
      JOIN businesses b ON a.business_id = b.id
      WHERE a.id = ${id} AND b.owner_id = ${ownerId}
    `;

    if (alertCheck.length === 0) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    await sql`
      UPDATE alerts
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/alerts/[id]/status error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
