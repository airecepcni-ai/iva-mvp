import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    const businessId = businesses[0].id;
    const rows = await sql`
      SELECT id, title, severity, created_at, status, body, type
      FROM alerts
      WHERE id = ${id} AND business_id = ${businessId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("relation") && message.includes("does not exist")) {
      return Response.json({ errorType: "table_missing" });
    }
    console.error("GET /api/alerts/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
