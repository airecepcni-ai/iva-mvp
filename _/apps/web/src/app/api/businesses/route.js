/**
 * GET /api/businesses - List businesses for authenticated user
 * POST /api/businesses - Create a new business for authenticated user
 * 
 * IMPORTANT: GET auto-creates a default business if the user has none.
 * Uses simple idempotent pattern (no transactions/advisory locks).
 */
import sql from "../utils/sql.js";
import { getSessionFromRequest } from "../../../auth.js";

// Debug flag - set DEBUG_BUSINESSES=true to enable verbose logging
const DEBUG = process.env.DEBUG_BUSINESSES === 'true';

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

export async function GET(request) {
  // ========== STEP 1: Check environment ==========
  const missingEnvVars = checkEnvVars();
  if (missingEnvVars.length > 0) {
    const errorMsg = `Missing required env vars: ${missingEnvVars.join(', ')}`;
    console.error('[api/businesses] ENV_ERROR:', errorMsg);
    return Response.json({
      ok: false,
      error: 'server_misconfigured',
      message: errorMsg,
      businesses: [],
      userId: null,
    }, { status: 500 });
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
    return Response.json({
      ok: false,
      error: 'unauthorized',
      businesses: [],
      userId: null,
      ...(DEBUG ? { debug: { sessionError: sessionError?.message || 'No session token found' } } : {}),
    }, { status: 401 });
  }

  // ========== STEP 3: Database operations ==========
  const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';
  
  try {
    // STEP 3a: Select businesses for this user
    debugLog('Selecting businesses for userId:', userId);
    
    let businesses = await sql`
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
        created_at
      FROM businesses
      WHERE auth_user_id = ${userId}
      ORDER BY created_at ASC
    `;

    debugLog('Found businesses (auth_user_id):', businesses.length);

    // STEP 3b: Check legacy owner_id if none found
    if (businesses.length === 0) {
      debugLog('Checking legacy owner_id...');
      
      businesses = await sql`
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
          created_at
        FROM businesses
        WHERE owner_id = ${userId}
        ORDER BY created_at ASC
      `;

      debugLog('Found businesses (owner_id):', businesses.length);

      // Migrate to auth_user_id if found via owner_id
      if (businesses.length > 0) {
        debugLog('Migrating businesses to auth_user_id...');
        for (const biz of businesses) {
          await sql`
            UPDATE businesses 
            SET auth_user_id = ${userId}
            WHERE id = ${biz.id} AND auth_user_id IS NULL
          `;
        }
        debugLog('Migration complete');
      }
    }

    // STEP 3c: Auto-create default business if none exist
    let created = false;
    if (businesses.length === 0) {
      debugLog('No businesses found - auto-creating default business...');
      
      try {
        const insertResult = await sql`
          INSERT INTO businesses (owner_id, auth_user_id, name, timezone, is_subscribed, created_at)
          VALUES (NULL, ${userId}, ${'Můj nový salon'}, ${clientTimezone}, false, NOW())
          RETURNING id, name, auth_user_id, timezone, phone, vapi_phone, is_subscribed, created_at
        `;
        
        if (insertResult.length > 0) {
          created = true;
          businesses = insertResult;
          debugLog('Created default business:', insertResult[0].id);
        }
      } catch (insertErr) {
        // Insert might fail due to race condition - re-select to check
        debugLog('Insert failed (possibly race condition):', insertErr.message);
        
        businesses = await sql`
          SELECT 
            id, name, auth_user_id, timezone, phone, vapi_phone, is_subscribed,
            stripe_customer_id, stripe_subscription_id, stripe_price_id, created_at
          FROM businesses
          WHERE auth_user_id = ${userId}
          ORDER BY created_at ASC
        `;
        
        debugLog('Re-selected businesses after failed insert:', businesses.length);
      }
    }

    // STEP 3d: Map and return businesses
    debugLog('Mapping businesses for response...');
    
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

    debugLog('Response ready:', {
      userId,
      businessCount: mappedBusinesses.length,
      created,
      firstBusinessId: mappedBusinesses[0]?.id || null,
      firstBusinessIsSubscribed: mappedBusinesses[0]?.isSubscribed ?? null,
    });

    return Response.json({
      ok: true,
      businesses: mappedBusinesses,
      userId,
      created,
    });

  } catch (dbError) {
    // ========== DB ERROR HANDLING ==========
    console.error('[api/businesses] DB_ERROR:', {
      userId,
      message: dbError.message,
      stack: dbError.stack,
    });

    return Response.json({
      ok: false,
      error: 'internal_server_error',
      businesses: [],
      userId,
      ...(DEBUG ? {
        debug: {
          message: dbError.message,
          stack: dbError.stack,
        }
      } : {}),
    }, { status: 500 });
  }
}

export async function POST(request) {
  // ========== Check environment ==========
  const missingEnvVars = checkEnvVars();
  if (missingEnvVars.length > 0) {
    const errorMsg = `Missing required env vars: ${missingEnvVars.join(', ')}`;
    console.error('[api/businesses] POST ENV_ERROR:', errorMsg);
    return Response.json({
      ok: false,
      error: 'server_misconfigured',
      message: errorMsg,
      userId: null,
    }, { status: 500 });
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
    return Response.json({ ok: false, error: 'unauthorized', userId: null }, { status: 401 });
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
      return Response.json({ 
        ok: false, 
        error: 'max_businesses_reached',
        userId 
      }, { status: 400 });
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
  } catch (dbError) {
    console.error('[api/businesses] POST DB_ERROR:', {
      userId,
      message: dbError.message,
      stack: dbError.stack,
    });

    return Response.json({
      ok: false,
      error: 'internal_server_error',
      userId,
      ...(DEBUG ? {
        debug: {
          message: dbError.message,
          stack: dbError.stack,
        }
      } : {}),
    }, { status: 500 });
  }
}
