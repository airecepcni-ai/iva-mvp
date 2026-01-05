/**
 * GET /api/debug/whoami - Debug endpoint to check auth cookie status
 * 
 * Returns:
 * - ok: true
 * - userId: string | null
 * - hasCookieHeader / hasAuthorizationHeader
 * - cookieNames: list of cookie names (no values for security)
 * - sessionTokenFound: boolean
 * - jwtDecodeAttempted: boolean
 * - jwtDecodeError: string | null
 */
import { getSessionFromRequest } from "../../../../auth.js";

/**
 * Derive encryption key using HKDF (matches Auth.js implementation)
 */
async function deriveEncryptionKey(secret, salt = '') {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const saltBytes = encoder.encode(salt);
  const info = encoder.encode(salt ? `Auth.js Generated Encryption Key (${salt})` : 'Auth.js Generated Encryption Key');
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  // Derive 64 bytes (512 bits) for A256CBC-HS512 using SHA-512
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-512', // Auth.js uses SHA-512
      salt: saltBytes,
      info: info,
    },
    baseKey,
    512
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Try to decode JWT token manually for debugging
 */
async function debugJwtDecode(token) {
  if (!token) {
    return { attempted: false, error: 'no_token' };
  }
  
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { attempted: true, error: 'AUTH_SECRET not set' };
  }
  
  try {
    // Check token format (JWE has 5 parts)
    const parts = token.split('.');
    if (parts.length !== 5) {
      return { 
        attempted: true, 
        error: `Invalid JWE format: expected 5 parts, got ${parts.length}`,
        tokenPreview: token.substring(0, 50) + '...',
      };
    }
    
    // Parse JWE header to see the algorithm
    let header;
    try {
      header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      header = { parseError: true };
    }
    
    // Try to import jose dynamically
    let jose;
    try {
      jose = await import('jose');
    } catch (e) {
      return { attempted: true, error: 'jose library not available: ' + e.message, header };
    }
    
    // Derive encryption key
    let encryptionKey;
    try {
      encryptionKey = await deriveEncryptionKey(secret);
    } catch (e) {
      return { attempted: true, error: 'Key derivation failed: ' + e.message, header };
    }
    
    // Try to decrypt using jwtDecrypt
    try {
      const { payload } = await jose.jwtDecrypt(token, encryptionKey, {
        clockTolerance: 15,
      });
      
      return { 
        attempted: true, 
        success: true,
        header,
        payload: {
          userId: payload.userId || payload.sub,
          email: payload.email,
          name: payload.name,
          exp: payload.exp,
          iat: payload.iat,
        },
      };
    } catch (e) {
      return { 
        attempted: true, 
        error: 'Decrypt failed: ' + e.message,
        header,
        tokenPreview: token.substring(0, 50) + '...',
      };
    }
  } catch (e) {
    return { attempted: true, error: 'Unexpected error: ' + e.message };
  }
}

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const authorizationHeader = request.headers.get('authorization') || '';
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  
  // Parse cookies
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...vals] = c.trim().split('=');
      return [key, vals.join('=')];
    }).filter(([k]) => k)
  );
  
  // Cookie names only (no values for security)
  const cookieNames = Object.keys(cookies);
  
  // Check for Auth.js session token specifically
  const isSecure = request.url?.startsWith('https://') || process.env.NODE_ENV === 'production';
  const cookiePrefix = isSecure ? '__Secure-' : '';
  const sessionTokenName = `${cookiePrefix}authjs.session-token`;
  const sessionTokenFound = cookieNames.includes(sessionTokenName) || cookieNames.includes('authjs.session-token');
  
  // Get the actual session token for JWT debugging
  const sessionToken = cookies[sessionTokenName] || cookies['authjs.session-token'] || null;
  
  // Debug JWT decode
  const jwtDebug = await debugJwtDecode(sessionToken);
  
  // Try to resolve session using the main function
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
    // JWT debugging
    jwtDebug,
    // Request metadata
    requestUrl: request.url,
    origin: origin || null,
    host: host || null,
    referer: referer || null,
    isSecure,
    nodeEnv: process.env.NODE_ENV || 'unknown',
    authSecretSet: !!process.env.AUTH_SECRET,
  });
}
