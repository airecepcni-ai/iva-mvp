/**
 * GET /api/businesses - List businesses for authenticated user
 * POST /api/businesses - Create a new business for authenticated user
 * 
 * IMPORTANT: GET auto-creates a default business if the user has none.
 * Uses PostgreSQL advisory lock to ensure idempotent, race-safe creation.
 */
import sql from "../utils/sql.js";
import { getSessionFromRequest } from "../../../auth.js";
import { computeIsSubscribed } from "../utils/subscription.js";
import { ensureDefaultBusinessForUser } from "../utils/defaultBusiness.js";

// Debug flag - set DEBUG_BUSINESSES=true to enable verbose logging
const DEBUG = process.env.DEBUG_BUSINESSES === 'true';
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function noStoreResponse(body, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function debugLog(...args) {
  if (DEBUG) {
    console.log('[api/businesses]', ...args);
  }
}

/**
 * Extract cookie names from request (for debugging)
 */
function getCookieNames(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
}

/**
 * Check required environment variables
 */
function checkEnvVars() {
  const missing = [];
  
  // Check for database connection (could be DATABASE_URL or DB_POOLER_URL)
  const hasDbUrl = process.env.DATABASE_URL || process.env.DB_POOLER_URL || process.env.AUTH_DB_POOLER_URL;
  if (!hasDbUrl) {
    missing.push('DATABASE_URL (or DB_POOLER_URL)');
  }
  
  return missing;
}

/**
 * Convert userId UUID string to a stable 32-bit integer for pg_advisory_xact_lock.
 * Uses a simple hash of the UUID.
 */
/**
 * Map business row from DB to response format (snake_case → camelCase)
 */
function mapBusiness(b, clientTimezone) {
  return {
    id: b.id,
    name: b.name || 'Můj Salon',
    authUserId: b.auth_user_id || b.owner_id,
    timezone: b.timezone || clientTimezone,
    phone: b.phone || null,
    vapiPhone: b.vapi_phone || null,
    isSubscribed: computeIsSubscribed(b),
    is_subscribed: b.is_subscribed === true,
    stripeCustomerId: b.stripe_customer_id || null,
    stripeSubscriptionId: b.stripe_subscription_id || null,
    stripePriceId: b.stripe_price_id || null,
    stripeStatus: b.stripe_status || null,
    stripeSubscriptionStatus: b.stripe_subscription_status || null,
    stripeCurrentPeriodEnd: b.stripe_current_period_end || null,
  };
}

export async function GET(request) {
  // ========== STEP 1: Check environment ==========
  const missingEnvVars = checkEnvVars();
  if (missingEnvVars.length > 0) {
    const errorMsg = `Missing required env vars: ${missingEnvVars.join(', ')}`;
    console.error('[api/businesses] ENV_ERROR:', errorMsg);
    return noStoreResponse({
      ok: false,
      error: 'server_misconfigured',
      message: errorMsg,
      businesses: [],
      userId: null,
    }, 500);
  }

  // ========== STEP 2: Resolve session/userId FIRST ==========
  let userId = null;
  let sessionError = null;
  
  try {
    debugLog('Resolving session...', {
      requestUrl: request.url,
      cookieNames: getCookieNames(request),
    });
    
    const session = await getSessionFromRequest(request);
    userId = session?.user?.id || null;
    
    debugLog('Session resolved:', { userId, hasSession: !!session, hasUser: !!session?.user });
  } catch (err) {
    sessionError = err;
    console.error('[api/businesses] SESSION_ERROR:', err.message, err.stack);
  }

  // If no userId, return 401 immediately (don't touch DB)
  if (!userId) {
    debugLog('No userId - returning 401', { sessionError: sessionError?.message });
    return noStoreResponse({
      ok: false,
      error: 'unauthorized',
      businesses: [],
      userId: null,
      ...(DEBUG ? { debug: { sessionError: sessionError?.message || 'No session token found' } } : {}),
    }, 401);
  }

  // ========== STEP 3: Database operations with advisory lock ==========
  const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';
  
  try {
    debugLog('Ensuring default business for userId:', userId, { clientTimezone });
    const result = await ensureDefaultBusinessForUser(userId, clientTimezone);

    // STEP 3d: Map and return businesses
    debugLog('Mapping businesses for response...');
    const mappedBusinesses = result.businesses.map((b) => mapBusiness(b, clientTimezone));

    debugLog('Response ready:', {
      userId,
      businessCount: mappedBusinesses.length,
      created: result.created,
      firstBusinessId: mappedBusinesses[0]?.id || null,
      firstBusinessIsSubscribed: mappedBusinesses[0]?.isSubscribed ?? null,
    });

    return noStoreResponse({
      ok: true,
      businesses: mappedBusinesses,
      userId,
      created: result.created,
    }, 200);

  } catch (dbError) {
    // ========== DB ERROR HANDLING ==========
    // Always log DB errors to help debug production issues
    console.error('[api/businesses] DB_ERROR:', {
      userId,
      errorName: dbError.name,
      message: dbError.message,
      code: dbError.code,
      stack: dbError.stack?.split('\n').slice(0, 5).join('\n'),
    });

    // Include helpful debug info in response (safe subset)
    return noStoreResponse({
      ok: false,
      error: 'internal_server_error',
      businesses: [],
      userId,
      debug: {
        errorType: dbError.name || 'Error',
        message: dbError.message || 'Unknown database error',
        code: dbError.code || null,
      },
    }, 500);
  }
}

export async function POST(request) {
  // ========== Check environment ==========
  const missingEnvVars = checkEnvVars();
  if (missingEnvVars.length > 0) {
    const errorMsg = `Missing required env vars: ${missingEnvVars.join(', ')}`;
    console.error('[api/businesses] POST ENV_ERROR:', errorMsg);
    return noStoreResponse({
      ok: false,
      error: 'server_misconfigured',
      message: errorMsg,
      userId: null,
    }, 500);
  }

  // ========== Resolve session/userId ==========
  let userId = null;
  
  try {
    debugLog('POST: Resolving session...');
    const session = await getSessionFromRequest(request);
    userId = session?.user?.id || null;
    debugLog('POST: Session resolved:', { userId });
  } catch (err) {
    console.error('[api/businesses] POST SESSION_ERROR:', err.message);
  }

  if (!userId) {
    return noStoreResponse({ ok: false, error: 'unauthorized', userId: null }, 401);
  }

  // ========== Parse body ==========
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

  try {
    // Check business limit
    debugLog('POST: Checking business count...');
    const existingCount = await sql`
      SELECT COUNT(*) as count FROM businesses WHERE auth_user_id = ${userId}
    `;
    
    const count = parseInt(existingCount[0]?.count || '0', 10);
    if (count >= 5) {
      return noStoreResponse({ 
        ok: false, 
        error: 'max_businesses_reached',
        userId 
      }, 400);
    }

    // Create new business
    debugLog('POST: Creating new business...');
    const result = await sql`
      INSERT INTO businesses (name, auth_user_id, timezone, is_subscribed, created_at)
      VALUES (${name}, ${userId}, ${clientTimezone}, false, NOW())
      RETURNING id, name, auth_user_id, timezone, phone, vapi_phone, is_subscribed
    `;

    const newBusiness = result[0];

    debugLog('POST: Created business:', { businessId: newBusiness.id, name: newBusiness.name });

    return noStoreResponse({
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
    }, 200);
  } catch (dbError) {
    console.error('[api/businesses] POST DB_ERROR:', {
      userId,
      message: dbError.message,
      stack: dbError.stack,
    });

    return noStoreResponse({
      ok: false,
      error: 'internal_server_error',
      userId,
      ...(DEBUG ? {
        debug: {
          message: dbError.message,
          stack: dbError.stack,
        }
      } : {}),
    }, 500);
  }
}
