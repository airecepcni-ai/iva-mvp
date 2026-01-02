/**
 * GET /api/subscription - Get subscription status for authenticated user
 */
import sql from "../utils/sql.js";
import { auth } from "../../../auth.js";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all businesses for this user
    const businesses = await sql`
      SELECT 
        id,
        name,
        is_subscribed,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        stripe_subscription_status
      FROM businesses
      WHERE auth_user_id = ${userId}
      ORDER BY created_at ASC
    `;

    // Also check legacy owner_id
    let allBusinesses = businesses;
    if (businesses.length === 0) {
      allBusinesses = await sql`
        SELECT 
          id,
          name,
          is_subscribed,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          stripe_subscription_status
        FROM businesses
        WHERE owner_id = ${userId}
        ORDER BY created_at ASC
      `;
    }

    const mappedBusinesses = allBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      isSubscribed: b.is_subscribed === true,
      stripeCustomerId: b.stripe_customer_id || null,
      stripeSubscriptionId: b.stripe_subscription_id || null,
      stripePriceId: b.stripe_price_id || null,
      stripeSubscriptionStatus: b.stripe_subscription_status || null,
    }));

    // User is subscribed if ANY of their businesses has an active subscription
    const isSubscribed = mappedBusinesses.some((b) => b.isSubscribed);

    return Response.json({
      userId,
      isSubscribed,
      businesses: mappedBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        isSubscribed: b.isSubscribed,
      })),
    });
  } catch (error) {
    console.error("GET /api/subscription error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
