import sql from "../utils/sql.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    await sql`
      INSERT INTO waitlist_signups (email)
      VALUES (${email})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
