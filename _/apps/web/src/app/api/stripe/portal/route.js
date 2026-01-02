/**
 * POST /api/stripe/portal - Create a Stripe Billing Portal session
 * 
 * Optional body:
 * - businessId: Business to manage billing for (uses first business if not provided)
 * 
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Gets the business's Stripe customer ID
 * 3. Creates a Billing Portal session
 * 4. Returns the portal URL
 */
import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";
import { getStripe, isStripeConfigured } from "../../utils/stripe-server.js";
import { absUrl } from "../../utils/url.js";

export async function POST(request) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      console.error('[stripe/portal] Stripe not configured');
      return Response.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body (optional)
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const { businessId } = body;

    // Get business to manage
    let business;
    if (businessId) {
      // Verify user owns this business
      const businesses = await sql`
        SELECT id, name, stripe_customer_id
        FROM businesses
        WHERE id = ${businessId} AND (auth_user_id = ${userId} OR owner_id = ${userId})
        LIMIT 1
      `;
      if (businesses.length === 0) {
        return Response.json({ error: "Business not found or not owned by user" }, { status: 404 });
      }
      business = businesses[0];
    } else {
      const businesses = await sql`
        SELECT id, name, stripe_customer_id
        FROM businesses
        WHERE (auth_user_id = ${userId} OR owner_id = ${userId})
          AND stripe_customer_id IS NOT NULL
        ORDER BY created_at ASC
        LIMIT 1
      `;
      if (businesses.length === 0) {
        return Response.json({
          error: "Stripe customer not found. Please start a subscription first.",
          code: "no_customer"
        }, { status: 400 });
      }
      business = businesses[0];
    }

    // Check if business has a Stripe customer ID
    if (!business.stripe_customer_id) {
      return Response.json({
        error: "Stripe customer not found. Please start a subscription first.",
        code: "no_customer"
      }, { status: 400 });
    }

    const stripe = getStripe();

    // Create Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: business.stripe_customer_id,
      return_url: absUrl(request, '/dashboard/platby'),
    });

    console.log('[stripe/portal] Created portal session for business:', business.id);

    return Response.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('[stripe/portal] Error:', error);
    return Response.json({ 
      error: error.message || "Failed to create portal session" 
    }, { status: 500 });
  }
}
