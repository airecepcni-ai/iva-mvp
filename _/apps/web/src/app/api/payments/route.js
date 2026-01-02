import { auth } from "../../../auth.js";
import sql from "../utils/sql.js";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's business
    const businesses = await sql`
      SELECT id FROM businesses WHERE owner_id = ${session.user.id} LIMIT 1
    `;

    if (businesses.length === 0) {
      return Response.json({ payments: [] });
    }

    const businessId = businesses[0].id;

    // Get all payments for this business
    const payments = await sql`
      SELECT 
        id,
        business_id,
        amount,
        currency,
        status,
        stripe_payment_id,
        payment_type,
        invoice_url,
        created_at
      FROM payments
      WHERE business_id = ${businessId}
      ORDER BY created_at DESC
    `;

    return Response.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return Response.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}
