import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";

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
      return Response.json({ contacts: [], repeatMap: {} });
    }

    const businessId = businesses[0].id;
    const contacts = await sql`
      SELECT id, name, phone, created_at
      FROM contacts
      WHERE business_id = ${businessId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const phones = contacts.map((contact) => contact.phone).filter(Boolean);
    let repeatMap = {};
    if (phones.length > 0) {
      const counts = await sql`
        SELECT phone, COUNT(*)::int AS count
        FROM contacts
        WHERE business_id = ${businessId}
          AND phone = ANY(${phones})
        GROUP BY phone
      `;
      repeatMap = counts.reduce((acc, row) => {
        acc[row.phone] = row.count;
        return acc;
      }, {});
    }

    return Response.json({ contacts, repeatMap });
  } catch (error) {
    console.error("GET /api/contacts/recent error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
