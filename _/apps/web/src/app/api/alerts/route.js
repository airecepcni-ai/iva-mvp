import sql from "../utils/sql.js";
import { auth } from "../../../auth.js";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${userId} LIMIT 1
    `;
    if (businesses.length === 0) {
      return Response.json([]);
    }

    const businessId = businesses[0].id;
    const rows = await sql`
      SELECT id, title, severity, created_at, status
      FROM alerts
      WHERE business_id = ${businessId}
        AND status != 'resolved'
      ORDER BY
        CASE
          WHEN severity ILIKE 'urgent' THEN 4
          WHEN severity ILIKE 'high' THEN 3
          WHEN severity ILIKE 'medium' THEN 2
          WHEN severity ILIKE 'low' THEN 1
          ELSE 0
        END DESC,
        created_at DESC
    `;

    return Response.json(rows);
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("relation") && message.includes("does not exist")) {
      return Response.json({ errorType: "table_missing", data: [] });
    }
    console.error("GET /api/alerts error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
