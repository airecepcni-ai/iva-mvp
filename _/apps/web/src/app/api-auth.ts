/**
 * Auth.js handler as a React Router resource route
 * This handles /api/auth/* requests on Vercel (where Hono doesn't run)
 */
import { Auth } from '@auth/core';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { createAuthConfig } from '../auth';

// Auth.js handler that works with Web Request/Response
async function handleAuthRequest(request: Request): Promise<Response> {
  const config = createAuthConfig();
  
  try {
    // Auth.js core accepts standard Web Request and returns Response
    const response = await Auth(request, config);
    return response;
  } catch (error) {
    console.error('[Auth] Error:', error);
    return new Response(JSON.stringify({ error: 'Auth error' }), {
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

