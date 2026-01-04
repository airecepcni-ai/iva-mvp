/**
 * Auth.js handler as a React Router resource route
 * This handles /api/auth/* requests on Vercel (where Hono doesn't run)
 */
// IMPORTANT: neon-setup MUST be imported first to configure WebSocket before any DB usage
import '../../__create/neon-setup';

import { Auth } from '@auth/core';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createAuthConfig } from '../auth';

// Auth.js handler that works with Web Request/Response
async function handleAuthRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log(`[Auth] ${request.method} ${url.pathname}`);
  
  const config = createAuthConfig();
  
  // Add callbacks for debugging
  const configWithCallbacks = {
    ...config,
    debug: true, // Enable Auth.js debug mode
    callbacks: {
      ...config.callbacks,
      async signIn({ user, account, profile }) {
        console.log('[Auth Callback] signIn:', { 
          userId: user?.id, 
          provider: account?.provider,
          hasProfile: !!profile 
        });
        return true; // Allow sign in
      },
      async redirect({ url, baseUrl }) {
        console.log('[Auth Callback] redirect:', { url, baseUrl });
        // Handle relative URLs
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        // Allow same-origin redirects
        if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      },
      async session({ session, user, token }) {
        console.log('[Auth Callback] session:', { 
          hasSession: !!session, 
          hasUser: !!user,
          hasToken: !!token 
        });
        return session;
      },
    },
  };
  
  try {
    // Auth.js core accepts standard Web Request and returns Response
    const response = await Auth(request, configWithCallbacks);
    console.log(`[Auth] Response status: ${response.status}`);
    return response;
  } catch (error) {
    console.error('[Auth] Error:', error);
    console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'no stack');
    return new Response(JSON.stringify({ error: 'Auth error', message: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// React Router loader (handles GET requests)
export async function loader({ request }: LoaderFunctionArgs) {
  return handleAuthRequest(request);
}

// React Router action (handles POST, PUT, DELETE requests)
export async function action({ request }: ActionFunctionArgs) {
  return handleAuthRequest(request);
}

