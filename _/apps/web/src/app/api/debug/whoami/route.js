/**
 * GET /api/debug/whoami - Debug endpoint to check auth cookie status
 * 
 * Returns:
 * - ok: true
 * - userId: string | null
 * - hasCookieHeader / hasAuthorizationHeader
 * - cookieNames: list of cookie names (no values for security)
 * - sessionTokenFound: boolean
 */
import { getSessionFromRequest } from "../../../../auth.js";

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const authorizationHeader = request.headers.get('authorization') || '';
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  
  // Parse cookie names only (no values for security)
  const cookieNames = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
  
  // Check for Auth.js session token specifically
  const isSecure = request.url?.startsWith('https://') || process.env.NODE_ENV === 'production';
  const cookiePrefix = isSecure ? '__Secure-' : '';
  const sessionTokenName = `${cookiePrefix}authjs.session-token`;
  const sessionTokenFound = cookieNames.includes(sessionTokenName) || cookieNames.includes('authjs.session-token');
  
  // Try to resolve session
  let userId = null;
  let sessionError = null;
  let sessionExpires = null;
  
  try {
    const session = await getSessionFromRequest(request);
    userId = session?.user?.id || null;
    sessionExpires = session?.expires || null;
  } catch (err) {
    sessionError = err.message;
  }
  
  return Response.json({
    ok: true,
    userId,
    hasCookieHeader: cookieHeader.length > 0,
    hasAuthorizationHeader: authorizationHeader.length > 0,
    cookieNames,
    sessionTokenName,
    sessionTokenFound,
    sessionError,
    sessionExpires,
    // Request metadata
    requestUrl: request.url,
    origin: origin || null,
    host: host || null,
    referer: referer || null,
    isSecure,
    nodeEnv: process.env.NODE_ENV || 'unknown',
  });
}

