/**
 * GET /api/subscription - Get subscription status for authenticated user
 * 
 * Query params:
 * - businessId (optional): If provided, returns subscription for that specific business
 *   and enforces that the user owns that business.
 *   If not provided, returns subscription status across all user's businesses.
 */
import sql from "../utils/sql.js";
import { getSessionFromRequest } from "../../../auth.js";

// Debug logging helper - only logs when DEBUG_SUBSCRIPTION=true
function debugLog(...args) {
  if (process.env.DEBUG_SUBSCRIPTION === 'true') {
    console.log('[api/subscription]', ...args);
  }
}

/**
 * Extract auth debug info from request
 */
function getAuthDebugInfo(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const authorizationHeader = request.headers.get('authorization') || '';
  
  // Parse cookie names only (no values for security)
  const cookieNames = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
  
  return {
    hasCookieHeader: cookieHeader.length > 0,
    hasAuthorizationHeader: authorizationHeader.length > 0,
    cookieNames,
  };
}

export async function GET(request) {
  const authDebug = getAuthDebugInfo(request);
  const url = new URL(request.url);
  const businessId = url.searchParams.get('businessId');
  
  try {
    debugLog('Auth debug:', authDebug);
    debugLog('businessId param:', businessId);
    
    let session = null;
    let sessionError = null;
    
    try {
      session = await getSessionFromRequest(request);
    } catch (err) {
      sessionError = err;
      debugLog('Session resolution error:', err.message);
    }
    
    const userId = session?.user?.id || null;
    debugLog('Resolved userId:', userId);

    // If userId is null/undefined, return 401 (NOT 500)
    if (!userId) {
      debugLog('No userId - returning 401 unauthorized');
      return Response.json({ 
        ok: false, 
        error: "unauthorized",
        // Include debug info when DEBUG_SUBSCRIPTION=true
        ...(process.env.DEBUG_SUBSCRIPTION === 'true' ? {
          _debug: {
            ...authDebug,
            sessionError: sessionError?.message || null,
          }
        } : {})
      }, { status: 401 });
    }

    // If businessId is provided, check ownership and return subscription for that specific business
    if (businessId) {
      const businessRows = await sql`
        SELECT 
          id,
          name,
          auth_user_id,
          owner_id,
          is_subscribed,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          stripe_subscription_status
        FROM businesses
        WHERE id = ${businessId}
        LIMIT 1
      `;

      debugLog('Business lookup result:', businessRows.length > 0 ? 'found' : 'not found');

      if (businessRows.length === 0) {
        debugLog('Business not found:', businessId);
        return Response.json({ 
          ok: false, 
          error: "business_not_found" 
        }, { status: 404 });
      }

      const business = businessRows[0];
      const businessOwner = business.auth_user_id || business.owner_id;

      // Check ownership
      if (businessOwner !== userId) {
        debugLog('Ownership check failed - business owner:', businessOwner, 'session user:', userId);
        return Response.json({ 
          ok: false, 
          error: "forbidden",
          message: "You do not own this business"
        }, { status: 403 });
      }

      const isSubscribed = business.is_subscribed === true;
      
      debugLog('Business subscription check:', {
        businessId: business.id,
        businessName: business.name,
        isSubscribed,
        stripeStatus: business.stripe_subscription_status,
      });

      return Response.json({
        ok: true,
        userId,
        businessId: business.id,
        businessName: business.name,
        isSubscribed,
        stripeCustomerId: business.stripe_customer_id || null,
        stripeSubscriptionId: business.stripe_subscription_id || null,
        stripePriceId: business.stripe_price_id || null,
        stripeSubscriptionStatus: business.stripe_subscription_status || null,
      });
    }

    // No businessId provided - return subscription status across all user's businesses
    // Get all businesses for this user
    let businesses = await sql`
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
    if (businesses.length === 0) {
      businesses = await sql`
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

    debugLog('Found', businesses.length, 'businesses for user');

    const mappedBusinesses = businesses.map((b) => ({
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

    debugLog('Overall subscription status:', {
      userId,
      businessCount: mappedBusinesses.length,
      isSubscribed,
      subscribedBusinesses: mappedBusinesses.filter(b => b.isSubscribed).map(b => b.id),
    });

    return Response.json({
      ok: true,
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
    debugLog('Caught error:', error.message, error.stack);
    return Response.json({ 
      ok: false, 
      error: "internal_server_error",
      message: process.env.DEBUG_SUBSCRIPTION === 'true' ? error.message : undefined,
    }, { status: 500 });
  }
}
