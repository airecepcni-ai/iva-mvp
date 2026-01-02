/**
 * POST /api/stripe/webhook - Handle Stripe webhook events
 * 
 * Important:
 * - Use the raw request body when validating the signature
 * - Deduplicate events via `stripe_events` table
 * - Map events back to a business via metadata/customer/subscription IDs
 */
import sql from "../../utils/sql.js";
import { getStripe, isStripeConfigured } from "../../utils/stripe-server.js";

const HANDLED_EVENTS = {
  "checkout.session.completed": handleCheckoutCompleted,
  "customer.subscription.created": handleSubscriptionUpdated,
  "customer.subscription.updated": handleSubscriptionUpdated,
  "customer.subscription.deleted": handleSubscriptionDeleted,
  "invoice.payment_succeeded": handleInvoicePaymentSucceeded,
  "invoice.payment_failed": handleInvoicePaymentFailed,
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "incomplete", "incomplete_expired"]);

export async function POST(request) {
  if (!isStripeConfigured()) {
    console.error("[stripe/webhook] Stripe not configured");
    return Response.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe/webhook] Missing stripe-signature header");
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err.message);
    return Response.json({ error: "Signature verification failed" }, { status: 400 });
  }

  console.log("[stripe/webhook] Event validated:", event.id, event.type);

  if (!(await persistStripeEvent(event))) {
    console.log("[stripe/webhook] Already processed event:", event.id);
    return Response.json({ received: true });
  }

  const handler = HANDLED_EVENTS[event.type];
  if (handler) {
    try {
      await handler(event.data.object);
    } catch (error) {
      console.error("[stripe/webhook] Event handler failed:", event.type, error);
    }
  } else {
    console.log("[stripe/webhook] Unhandled event type:", event.type);
  }

  return Response.json({ received: true });
}

async function persistStripeEvent(event) {
  try {
    const inserted = await sql`
      INSERT INTO stripe_events (event_id, type)
      VALUES (${event.id}, ${event.type})
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;
    return inserted.length > 0;
  } catch (error) {
    console.error("[stripe/webhook] Failed to persist event", event.id);
    return true;
  }
}

function extractMetadata(metadata = {}) {
  if (!metadata) return {};
  return {
    authUserId: metadata.auth_user_id || metadata.userId || metadata.user_id || null,
    businessId: metadata.business_id || metadata.businessId || metadata.business_id || null,
    priceId:
      metadata.price_id || metadata.priceId || metadata.plan || metadata.line_item_price_id || null,
  };
}

// Webhook requests are unauthenticated; never rely on session/cookies.
async function resolveBusinessForEvent({ businessId, authUserId, customerId, subscriptionId }) {
  if (businessId) {
    const rows = await sql`
      SELECT id, name
      FROM businesses
      WHERE id = ${businessId}
      LIMIT 1
    `;
    if (rows.length) return rows[0];
  }

  if (customerId) {
    const rows = await sql`
      SELECT id, name
      FROM businesses
      WHERE stripe_customer_id = ${customerId}
      LIMIT 1
    `;
    if (rows.length) return rows[0];
  }

  if (subscriptionId) {
    const rows = await sql`
      SELECT id, name
      FROM businesses
      WHERE stripe_subscription_id = ${subscriptionId}
      LIMIT 1
    `;
    if (rows.length) return rows[0];
  }

  if (authUserId) {
    const rows = await sql`
      SELECT id, name
      FROM businesses
      WHERE auth_user_id = ${authUserId} OR owner_id = ${authUserId}
      ORDER BY created_at ASC
      LIMIT 1
    `;
    if (rows.length) return rows[0];
  }

  return null;
}

async function updateBusinessSubscriptionState({
  businessId,
  customerId,
  subscriptionId,
  status,
  priceId,
  isSubscribed,
}) {
  const customerIdValue = customerId ?? null;
  const subscriptionIdValue = subscriptionId ?? null;
  const priceIdValue = priceId ?? null;
  const statusValue = status ?? null;
  const subscribedValue = isSubscribed === undefined ? null : isSubscribed;

  const result = await sql`
    UPDATE businesses
    SET 
      stripe_customer_id = CASE WHEN ${customerIdValue} IS NOT NULL THEN ${customerIdValue} ELSE stripe_customer_id END,
      stripe_subscription_id = CASE WHEN ${subscriptionIdValue} IS NOT NULL THEN ${subscriptionIdValue} ELSE stripe_subscription_id END,
      stripe_price_id = CASE WHEN ${priceIdValue} IS NOT NULL THEN ${priceIdValue} ELSE stripe_price_id END,
      stripe_subscription_status = CASE WHEN ${statusValue} IS NOT NULL THEN ${statusValue} ELSE stripe_subscription_status END,
      is_subscribed = CASE WHEN ${subscribedValue} IS NOT NULL THEN ${subscribedValue} ELSE is_subscribed END,
      updated_at = NOW()
    WHERE id = ${businessId}
    RETURNING id, name
  `;

  if (result.length === 0) {
    console.warn("[stripe/webhook] Failed to update business row", businessId);
  }

  return result[0] || null;
}

async function handleCheckoutCompleted(session) {
  console.log("[stripe/webhook] checkout.session.completed", session.id);

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const metadata = extractMetadata(session.metadata);
  const priceId =
    metadata.priceId || session.metadata?.priceId || session.metadata?.price_id || null;

  if (!customerId) {
    console.warn("[stripe/webhook] checkout.session.completed missing customer", session.id);
    return;
  }

  const business = await resolveBusinessForEvent({
    businessId: metadata.businessId,
    authUserId: metadata.authUserId,
    customerId,
    subscriptionId,
  });

  if (!business) {
    console.warn("[stripe/webhook] checkout.session.completed could not map business", session.id);
    return;
  }

  await updateBusinessSubscriptionState({
    businessId: business.id,
    customerId,
    subscriptionId,
    status: "active",
    priceId,
    isSubscribed: true,
  });
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const subscriptionId = subscription.id;
  const metadata = extractMetadata(subscription.metadata);
  const priceId =
    subscription.items?.data?.[0]?.price?.id || metadata.priceId || null;
  const status = subscription.status;

  if (!customerId || !subscriptionId) {
    console.warn("[stripe/webhook] subscription.updated missing identifiers", subscription.id);
    return;
  }

  const business = await resolveBusinessForEvent({
    businessId: metadata.businessId,
    authUserId: metadata.authUserId,
    customerId,
    subscriptionId,
  });

  if (!business) {
    console.warn("[stripe/webhook] subscription.updated could not map business", subscription.id);
    return;
  }

  const isSubscribed = ACTIVE_STATUSES.has(status);

  await updateBusinessSubscriptionState({
    businessId: business.id,
    customerId,
    subscriptionId,
    priceId,
    status,
    isSubscribed,
  });
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const subscriptionId = subscription.id;

  if (!customerId && !subscriptionId) {
    console.warn("[stripe/webhook] subscription.deleted missing identifiers", subscription.id);
    return;
  }

  const business = await resolveBusinessForEvent({
    customerId,
    subscriptionId,
  });

  if (!business) {
    console.warn("[stripe/webhook] subscription.deleted could not map business", subscription.id);
    return;
  }

  await updateBusinessSubscriptionState({
    businessId: business.id,
    customerId,
    subscriptionId,
    status: "canceled",
    isSubscribed: false,
  });
}

async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId = invoice.subscription;

  if (!customerId || !subscriptionId) {
    console.log("[stripe/webhook] invoice.payment_succeeded missing subscription", invoice.id);
    return;
  }

  const priceId = invoice.lines?.data?.[0]?.price?.id || null;

  const business = await resolveBusinessForEvent({
    customerId,
    subscriptionId,
  });

  if (!business) {
    console.warn("[stripe/webhook] invoice.payment_succeeded could not map business", invoice.id);
    return;
  }

  await updateBusinessSubscriptionState({
    businessId: business.id,
    customerId,
    subscriptionId,
    status: "active",
    priceId,
    isSubscribed: true,
  });
}

async function handleInvoicePaymentFailed(invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId = invoice.subscription;

  if (!customerId || !subscriptionId) {
    console.log("[stripe/webhook] invoice.payment_failed missing subscription", invoice.id);
    return;
  }

  const business = await resolveBusinessForEvent({
    customerId,
    subscriptionId,
  });

  if (!business) {
    console.warn("[stripe/webhook] invoice.payment_failed could not map business", invoice.id);
    return;
  }

  await updateBusinessSubscriptionState({
    businessId: business.id,
    status: "past_due",
    isSubscribed: true,
  });
}
