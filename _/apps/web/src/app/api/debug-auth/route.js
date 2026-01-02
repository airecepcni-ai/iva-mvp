/**
 * GET /api/debug-auth
 * 
 * Debug endpoint to inspect Auth.js configuration and cookie state.
 * DEV ONLY - should be disabled in production.
 */

import { getToken } from '@auth/core/jwt';

export async function GET(request) {
  // Completely block in production - return empty 404
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);
  
  // Look for auth cookies
  const authCookies = cookies.filter(c => 
    c.startsWith('authjs.') || 
    c.startsWith('__Secure-authjs.') ||
    c.startsWith('next-auth.') ||
    c.startsWith('__Secure-next-auth.')
  );

  // Try to get token
  let token = null;
  let tokenError = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: (process.env.AUTH_URL ?? '').startsWith('https'),
    });
  } catch (e) {
    tokenError = e.message;
  }

  return Response.json({
    env: {
      AUTH_URL: process.env.AUTH_URL ? `${process.env.AUTH_URL.substring(0, 30)}...` : null,
      AUTH_URL_length: process.env.AUTH_URL?.length ?? 0,
      AUTH_SECRET_set: !!process.env.AUTH_SECRET,
      AUTH_SECRET_length: process.env.AUTH_SECRET?.length ?? 0,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      NODE_ENV: process.env.NODE_ENV,
    },
    cookies: {
      hasCookieHeader: !!cookieHeader,
      totalCookies: cookies.length,
      authCookies: authCookies.map(c => {
        const [name] = c.split('=');
        return name; // Only show cookie names, not values
      }),
    },
    token: token ? {
      hasToken: true,
      sub: token.sub,
      email: token.email,
      name: token.name,
      exp: token.exp,
    } : null,
    tokenError,
    hint: !token && authCookies.length === 0 
      ? 'No auth cookies found. User may not be logged in, or cookies not being sent.'
      : !token && authCookies.length > 0
      ? 'Auth cookies present but token extraction failed. Check AUTH_SECRET or cookie name mismatch.'
      : null,
  });
}







