import sql from "../../utils/sql.js";
import { getSessionFromRequest } from "../../../../auth.js";
import { computeIsSubscribed } from "../../utils/subscription.js";

const DEBUG = process.env.DEBUG_SUBSCRIPTION === "true";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function debugLog(...args) {
  if (DEBUG) {
    console.log("[api/debug/subscription-snapshot]", ...args);
  }
}

function noStoreResponse(body, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function getAuthDebug(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const authorizationHeader = request.headers.get("authorization") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
  return {
    hasCookieHeader: cookieHeader.length > 0,
    hasAuthorizationHeader: authorizationHeader.length > 0,
    cookieNames,
  };
}

export async function GET(request) {
  const url = new URL(request.url);
  const authDebug = getAuthDebug(request);
  const headerSelected = request.headers.get("x-selected-business-id") || null;
  const tenantHeader = request.headers.get("x-tenant-id") || null;
  const queryBusinessId = url.searchParams.get("businessId") || null;
  const querySelected = url.searchParams.get("selectedBusinessId") || null;

  let session = null;
  try {
    session = await getSessionFromRequest(request);
  } catch (err) {
    debugLog("session_error", err?.message || err);
  }

  const userId = session?.user?.id || null;
  if (!userId) {
    debugLog("unauthorized", authDebug);
    return noStoreResponse(
      {
        ok: false,
        error: "unauthorized",
        ...(DEBUG
          ? {
              debug: {
                authDebug,
                sessionError: "No active session",
              },
            }
          : {}),
      },
      401
    );
  }

  let businesses = await sql`
    SELECT
      id,
      name,
      auth_user_id,
      owner_id,
      is_subscribed,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      stripe_status,
      stripe_subscription_status,
      stripe_current_period_end
    FROM businesses
    WHERE auth_user_id = ${userId}
    ORDER BY created_at ASC
  `;

  if (!businesses || businesses.length === 0) {
    businesses = await sql`
      SELECT
        id,
        name,
        auth_user_id,
        owner_id,
        is_subscribed,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        stripe_status,
        stripe_subscription_status,
        stripe_current_period_end
      FROM businesses
      WHERE owner_id = ${userId}
      ORDER BY created_at ASC
    `;
  }

  const mappedBusinesses = (businesses || []).map((row) => ({
    id: row.id,
    name: row.name,
    isSubscribed: computeIsSubscribed(row),
    is_subscribed: row.is_subscribed === true,
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    stripePriceId: row.stripe_price_id || null,
    stripeStatus: row.stripe_status || null,
    stripeSubscriptionStatus: row.stripe_subscription_status || null,
    stripeCurrentPeriodEnd: row.stripe_current_period_end || null,
  }));

  const chosenBusinessId =
    querySelected || headerSelected || tenantHeader || queryBusinessId || mappedBusinesses[0]?.id || null;

  let businessProfileSubscription = null;
  if (chosenBusinessId) {
    const profileRows = await sql`
      SELECT id, business_id
      FROM business_profile
      WHERE business_id = ${chosenBusinessId}
      LIMIT 1
    `;
    const matchedBusiness = mappedBusinesses.find((b) => b.id === chosenBusinessId);
    businessProfileSubscription = {
      businessId: chosenBusinessId,
      hasProfile: profileRows && profileRows.length > 0,
      isSubscribed: matchedBusiness?.isSubscribed ?? false,
      is_subscribed: matchedBusiness?.is_subscribed ?? false,
      stripeStatus: matchedBusiness?.stripeStatus || null,
      stripeSubscriptionStatus: matchedBusiness?.stripeSubscriptionStatus || null,
      stripeCurrentPeriodEnd: matchedBusiness?.stripeCurrentPeriodEnd || null,
    };
  }

  debugLog("snapshot", {
    userId,
    selectedBusinessId: chosenBusinessId,
    businessCount: mappedBusinesses.length,
  });

  return noStoreResponse(
    {
      ok: true,
      userId,
      selectedBusinessId: chosenBusinessId,
      businesses: mappedBusinesses,
      businessProfileSubscription,
      authDebug,
    },
    200
  );
}

