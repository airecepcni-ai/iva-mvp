/**
 * GET /api/businesses - List businesses for authenticated user
 * POST /api/businesses - Create a new business for authenticated user
 * 
 * IMPORTANT: GET auto-creates a default business if the user has none.
 * This is idempotent and uses advisory locks to prevent race conditions.
 */
import sql from "../utils/sql.js";
import { getSessionFromRequest } from "../../../auth.js";

// Debug logging helper - only logs when DEBUG_BUSINESSES=true
function debugLog(...args) {
  if (process.env.DEBUG_BUSINESSES === 'true') {
    console.log('[api/businesses]', ...args);
  }
}

/**
 * Extract auth debug info from request
 */
function getAuthDebugInfo(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const authorizationHeader = request.headers.get('authorization') || '';
  const origin = request.headers.get('origin') || '';
  
  // Parse cookie names only (no values for security)
  const cookieNames = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
  
  return {
    url: request.url,
    hasCookieHeader: cookieHeader.length > 0,
    hasAuthorizationHeader: authorizationHeader.length > 0,
    origin: origin || null,
    cookieNames,
  };
}

export async function GET(request) {
  // Always capture auth debug info first
  const authDebug = getAuthDebugInfo(request);
  
  try {
    debugLog('Auth debug:', authDebug);
    
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
      debugLog('No userId - returning 401 unauthorized', {
        sessionError: sessionError?.message || null,
        hasSession: !!session,
        hasUser: !!session?.user,
      });
      return Response.json({ 
        ok: false, 
        error: "unauthorized", 
        businesses: [], 
        userId: null,
        // Include debug info in non-production
        ...(process.env.DEBUG_BUSINESSES === 'true' ? {
          _debug: {
            ...authDebug,
            sessionError: sessionError?.message || null,
          }
        } : {})
      }, { status: 401 });
    }

    // Get client timezone from header (for auto-creating business with correct tz)
    const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';
    debugLog('clientTimezone:', clientTimezone);

    // Use a transaction with advisory lock to prevent race conditions during auto-create
    const result = await sql.transaction(async (tx) => {
      // Advisory lock based on user ID hash to prevent concurrent auto-create for same user
      // Using pg_advisory_xact_lock which auto-releases on transaction end
      const lockKey = hashUserId(userId);
      await tx`SELECT pg_advisory_xact_lock(${lockKey})`;

      // Get all businesses owned by this user (via auth_user_id column)
      let businesses = await tx`
        SELECT 
          id,
          name,
          auth_user_id,
          timezone,
          phone,
          vapi_phone,
          is_subscribed,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          created_at,
          updated_at
        FROM businesses
        WHERE auth_user_id = ${userId}
        ORDER BY created_at ASC
      `;

      debugLog('businesses count (auth_user_id):', businesses.length);

      // If no businesses found, also check legacy owner_id column for backwards compatibility
      if (businesses.length === 0) {
        businesses = await tx`
          SELECT 
            id,
            name,
            owner_id,
            timezone,
            phone,
            vapi_phone,
            is_subscribed,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_price_id,
            created_at,
            updated_at
          FROM businesses
          WHERE owner_id = ${userId}
          ORDER BY created_at ASC
        `;

        debugLog('businesses count (legacy owner_id):', businesses.length);

        // If found via owner_id, migrate them to auth_user_id
        if (businesses.length > 0) {
          for (const biz of businesses) {
            await tx`
              UPDATE businesses 
              SET auth_user_id = ${userId}
              WHERE id = ${biz.id} AND auth_user_id IS NULL
            `;
          }
          debugLog('migrated', businesses.length, 'businesses from owner_id to auth_user_id');
        }
      }

      // If still no businesses, auto-create a default one
      let created = false;
      if (businesses.length === 0) {
        debugLog('No businesses found - auto-creating default business');
        
        // Use SAVEPOINT for the insert to handle potential unique constraint violations gracefully
        await tx`SAVEPOINT create_default_business`;
        
        try {
          // Insert default business with owner_id = NULL (new auth model uses auth_user_id)
          const insertResult = await tx`
            INSERT INTO public.businesses (owner_id, auth_user_id, name, timezone, is_subscribed, created_at, updated_at)
            VALUES (NULL, ${userId}, ${'Můj nový salon'}, ${clientTimezone}, false, NOW(), NOW())
            RETURNING id
          `;
          
          await tx`RELEASE SAVEPOINT create_default_business`;
          
          if (insertResult.length > 0) {
            created = true;
            debugLog('Created default business with id:', insertResult[0].id);
          }
        } catch (insertError) {
          // Rollback to savepoint on error (e.g., race condition where another request created it)
          await tx`ROLLBACK TO SAVEPOINT create_default_business`;
          debugLog('Insert failed (likely race condition), will re-select:', insertError.message);
        }

        // Re-select to get the (possibly just-created) businesses
        businesses = await tx`
          SELECT 
            id,
            name,
            auth_user_id,
            timezone,
            phone,
            vapi_phone,
            is_subscribed,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_price_id,
            created_at,
            updated_at
          FROM businesses
          WHERE auth_user_id = ${userId}
          ORDER BY created_at ASC
        `;
        
        debugLog('businesses count after auto-create:', businesses.length);
      }

      return { businesses, created };
    });

    const { businesses, created } = result;

    // Log summary for debugging
    const selectedBusinessId = businesses.length > 0 ? businesses[0].id : null;
    const firstBusinessIsSubscribed = businesses.length > 0 ? businesses[0].is_subscribed : null;
    debugLog('Summary:', {
      userId,
      businessCount: businesses.length,
      selectedBusinessId,
      is_subscribed: firstBusinessIsSubscribed,
      created,
    });

    // Return mapped businesses with consistent camelCase
    const mappedBusinesses = businesses.map((b) => ({
      id: b.id,
      name: b.name || 'Můj Salon',
      authUserId: b.auth_user_id || b.owner_id,
      timezone: b.timezone || clientTimezone,
      phone: b.phone || null,
      vapiPhone: b.vapi_phone || null,
      isSubscribed: b.is_subscribed === true,
      stripeCustomerId: b.stripe_customer_id || null,
    }));

    return Response.json({
      ok: true,
      businesses: mappedBusinesses,
      userId,
      created,
    });
  } catch (error) {
    console.error("GET /api/businesses error:", error);
    debugLog('Caught error:', error.message, error.stack);
    return Response.json({ 
      ok: false, 
      error: "internal_server_error", 
      message: process.env.DEBUG_BUSINESSES === 'true' ? error.message : undefined,
      businesses: [], 
      userId: null 
    }, { status: 500 });
  }
}

export async function POST(request) {
  const authDebug = getAuthDebugInfo(request);
  
  try {
    debugLog('POST Auth debug:', authDebug);
    
    let session = null;
    try {
      session = await getSessionFromRequest(request);
    } catch (err) {
      debugLog('POST Session resolution error:', err.message);
    }
    
    if (!session?.user?.id) {
      debugLog('POST No userId - returning 401');
      return Response.json({ ok: false, error: "unauthorized", userId: null }, { status: 401 });
    }

    const userId = session.user.id;
    
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const name = typeof body.name === 'string' && body.name.trim() 
      ? body.name.trim() 
      : 'Můj Salon';
    
    const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';

    // Check if user already has businesses (limit for free tier)
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM businesses WHERE auth_user_id = ${userId}
    `;
    
    const count = parseInt(existingCount[0]?.count || '0', 10);
    if (count >= 5) {
      return Response.json({ 
        ok: false, 
        error: "max_businesses_reached",
        userId 
      }, { status: 400 });
    }

    // Create new business
    const result = await sql`
      INSERT INTO businesses (name, auth_user_id, timezone, is_subscribed, created_at, updated_at)
      VALUES (${name}, ${userId}, ${clientTimezone}, false, NOW(), NOW())
      RETURNING id, name, auth_user_id, timezone, phone, vapi_phone, is_subscribed
    `;

    const newBusiness = result[0];

    debugLog('Created business via POST:', {
      userId,
      businessId: newBusiness.id,
      name: newBusiness.name,
    });

    return Response.json({
      ok: true,
      userId,
      business: {
        id: newBusiness.id,
        name: newBusiness.name,
        authUserId: newBusiness.auth_user_id,
        timezone: newBusiness.timezone,
        phone: newBusiness.phone,
        vapiPhone: newBusiness.vapi_phone,
        isSubscribed: newBusiness.is_subscribed === true,
      },
    });
  } catch (error) {
    console.error("POST /api/businesses error:", error);
    return Response.json({ ok: false, error: "internal_server_error", userId: null }, { status: 500 });
  }
}

/**
 * Hash user ID to a 32-bit integer for advisory lock.
 * Uses a simple but effective string hash.
 */
function hashUserId(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
