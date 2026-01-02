/**
 * POST /api/stripe/checkout - Create a Stripe Checkout session
 * 
 * Required body:
 * - priceId: Stripe price ID for the subscription
 * - businessId: Business to subscribe (optional, uses first business if not provided)
 * 
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Creates/retrieves a Stripe customer for the business
 * 3. Creates a Checkout session with the selected price
 * 4. Returns the checkout URL
 */
import sql from "../../utils/sql.js";
import { auth } from "../../../../auth.js";
import { getStripe, isStripeConfigured } from "../../utils/stripe-server.js";
import { absUrl } from "../../utils/url.js";
import { ALLOWED_PRICE_IDS } from "../../../../data/pricingTiers.js";

export async function POST(request) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      console.error('[stripe/checkout] Stripe not configured');
      return Response.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { priceId, businessId } = body;

    // Validate priceId
    if (!priceId || typeof priceId !== 'string') {
      return Response.json({ error: "Missing or invalid priceId" }, { status: 400 });
    }

    if (!ALLOWED_PRICE_IDS.has(priceId)) {
      console.warn("[stripe/checkout] Invalid priceId:", priceId);
      return Response.json({ error: "Invalid priceId" }, { status: 400 });
    }

    // Get business to subscribe
    let business;
    if (businessId) {
      // Verify user owns this business
      const businesses = await sql`
        SELECT id, name, stripe_customer_id, auth_user_id
        FROM businesses
        WHERE id = ${businessId} AND (auth_user_id = ${userId} OR owner_id = ${userId})
        LIMIT 1
      `;
      if (businesses.length === 0) {
        return Response.json({ error: "Business not found or not owned by user" }, { status: 404 });
      }
      business = businesses[0];
    } else {
      // Use first business owned by user
      const businesses = await sql`
        SELECT id, name, stripe_customer_id, auth_user_id
        FROM businesses
        WHERE auth_user_id = ${userId} OR owner_id = ${userId}
        ORDER BY created_at ASC
        LIMIT 1
      `;
      if (businesses.length === 0) {
        return Response.json({ error: "No business found. Please create a business first." }, { status: 404 });
      }
      business = businesses[0];
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let stripeCustomerId = business.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      console.log('[stripe/checkout] Creating Stripe customer for business:', business.id);
      const customer = await stripe.customers.create({
        email: userEmail,
        name: business.name || "IVA Customer",
        metadata: {
          auth_user_id: userId,
          business_id: business.id,
          environment: process.env.NODE_ENV || "development",
        },
      });

      stripeCustomerId = customer.id;

      // Store customer ID in database
      await sql`
        UPDATE businesses 
        SET stripe_customer_id = ${stripeCustomerId}, updated_at = NOW()
        WHERE id = ${business.id}
      `;

      console.log('[stripe/checkout] Created Stripe customer:', stripeCustomerId);
    }

    // Create Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: absUrl(request, `/dashboard/platby?success=true&session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: absUrl(request, `/dashboard/platby?canceled=true`),
      metadata: {
        auth_user_id: userId,
        business_id: business.id,
        price_id: priceId,
        environment: process.env.NODE_ENV || "development",
      },
      subscription_data: {
        metadata: {
          auth_user_id: userId,
          business_id: business.id,
          price_id: priceId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },
    });

    console.log('[stripe/checkout] Created checkout session:', checkoutSession.id);

    return Response.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[stripe/checkout] Error:', error);
    return Response.json({ 
      error: error.message || "Failed to create checkout session" 
    }, { status: 500 });
  }
}
