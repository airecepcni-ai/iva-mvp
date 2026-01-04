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
  
  // Enable debug mode and add proper redirect handling
  const configWithDebug = {
    ...config,
    debug: process.env.NODE_ENV !== 'production' || true, // Always debug for now
    callbacks: {
      // Redirect callback - ensure proper URL handling
      async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
        console.log('[Auth] redirect callback:', { url, baseUrl });
        // Handle relative URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allow same-origin redirects
        try {
          const urlOrigin = new URL(url).origin;
          if (urlOrigin === baseUrl) {
            return url;
          }
        } catch {
          // Invalid URL, use baseUrl
        }
        return `${baseUrl}/dashboard`;
      },
    },
  };
  
  try {
    const response = await Auth(request, configWithDebug);
    console.log(`[Auth] Response: ${response.status} ${response.headers.get('location') || ''}`);
    return response;
  } catch (error) {
    console.error('[Auth] Error:', error);
    console.error('[Auth] Stack:', error instanceof Error ? error.stack : 'no stack');
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

