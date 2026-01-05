/**
 * GET /api/debug/bootstrap - Debug endpoint to verify business auto-creation flow
 * 
 * Returns:
 * - ok: true
 * - userId: string | null
 * - businessCount: number
 * - created: boolean (whether a business was just auto-created)
 * - firstBusinessId: string | null
 * - firstBusinessName: string | null
 * - firstBusinessIsSubscribed: boolean | null
 * 
 * This endpoint internally calls the same "ensure default business" logic
 * used by /api/businesses, so you can use it to verify the flow works.
 */
import sql from "../../utils/sql.js";
import { getSessionFromRequest } from "../../../../auth.js";

/**
 * Convert userId UUID string to a stable 32-bit integer for pg_advisory_xact_lock.
 */
function userIdToLockKey(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieNames = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
  
  const hasCookieHeader = cookieHeader.length > 0;
  const hasAuthorizationHeader = !!request.headers.get('authorization');
  
  // Get session token name for Auth.js
  const isSecure = request.url.startsWith('https://');
  const sessionTokenName = isSecure 
    ? '__Secure-authjs.session-token' 
    : 'authjs.session-token';
  const sessionTokenFound = cookieNames.includes(sessionTokenName);

  // Resolve session
  let userId = null;
  let sessionError = null;
  
  try {
    const session = await getSessionFromRequest(request);
    userId = session?.user?.id || null;
  } catch (err) {
    sessionError = err.message;
  }

  // If no session, return auth info only
  if (!userId) {
    return Response.json({
      ok: true,
      userId: null,
      businessCount: 0,
      created: false,
      firstBusinessId: null,
      firstBusinessName: null,
      firstBusinessIsSubscribed: null,
      authInfo: {
        hasCookieHeader,
        hasAuthorizationHeader,
        cookieNames,
        sessionTokenName,
        sessionTokenFound,
        sessionError,
      },
    });
  }

  // Ensure default business exists (same logic as /api/businesses)
  const clientTimezone = request.headers.get('x-client-timezone') || 'Europe/Prague';
  
  try {
    const result = await sql.transaction(async (tx) => {
      const lockKey = userIdToLockKey(userId);
      await tx`SELECT pg_advisory_xact_lock(${lockKey})`;
      
      // Select existing businesses
      let businesses = await tx`
        SELECT id, name, auth_user_id, is_subscribed, created_at
        FROM businesses
        WHERE auth_user_id = ${userId}
        ORDER BY created_at ASC
      `;

      // Check legacy owner_id
      if (businesses.length === 0) {
        businesses = await tx`
          SELECT id, name, owner_id, is_subscribed, created_at
          FROM businesses
          WHERE owner_id = ${userId}
          ORDER BY created_at ASC
        `;
        
        // Migrate if found
        if (businesses.length > 0) {
          for (const biz of businesses) {
            await tx`
              UPDATE businesses 
              SET auth_user_id = ${userId}
              WHERE id = ${biz.id} AND auth_user_id IS NULL
            `;
          }
        }
      }

      // Auto-create if none
      let created = false;
      if (businesses.length === 0) {
        const insertResult = await tx`
          INSERT INTO businesses (owner_id, auth_user_id, name, timezone, is_subscribed, created_at)
          VALUES (NULL, ${userId}, ${'Můj nový salon'}, ${clientTimezone}, false, NOW())
          RETURNING id, name, auth_user_id, is_subscribed, created_at
        `;
        
        if (insertResult.length > 0) {
          created = true;
          businesses = insertResult;
        }
      }

      return { businesses, created };
    });

    const firstBusiness = result.businesses[0] || null;

    return Response.json({
      ok: true,
      userId,
      businessCount: result.businesses.length,
      created: result.created,
      firstBusinessId: firstBusiness?.id || null,
      firstBusinessName: firstBusiness?.name || null,
      firstBusinessIsSubscribed: firstBusiness?.is_subscribed === true,
      authInfo: {
        hasCookieHeader,
        hasAuthorizationHeader,
        sessionTokenFound,
      },
    });

  } catch (dbError) {
    console.error('[api/debug/bootstrap] DB_ERROR:', {
      userId,
      message: dbError.message,
      stack: dbError.stack,
    });

    return Response.json({
      ok: false,
      error: 'db_error',
      userId,
      businessCount: 0,
      created: false,
      debug: {
        message: dbError.message,
        stack: dbError.stack,
      },
    }, { status: 500 });
  }
}

