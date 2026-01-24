import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT date, calls_count, bookings_count
      FROM daily_activity_summary
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date ASC
    `;

    if (!rows || rows.length === 0) {
      return Response.json({ errorType: "no_activity" });
    }

    return Response.json(rows);
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("relation") && message.includes("does not exist")) {
      return Response.json({ errorType: "view_missing" }, { status: 400 });
    }
    console.error("GET /api/dashboard/chart error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
