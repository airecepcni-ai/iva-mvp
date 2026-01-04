/**
 * Debug endpoint to check Auth.js configuration on Vercel
 */
// IMPORTANT: neon-setup MUST be imported first
import '../../__create/neon-setup';

import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const hasAuthSecret = !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length > 0;
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.length > 0;
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.length > 0;
  const hasDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;
  
  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      AUTH_SECRET: hasAuthSecret ? `SET (${process.env.AUTH_SECRET!.length} chars)` : 'MISSING',
      AUTH_URL: process.env.AUTH_URL ?? 'NOT_SET',
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? 'NOT_SET',
      GOOGLE_CLIENT_ID: hasGoogleClientId 
        ? `SET (ends with ...${process.env.GOOGLE_CLIENT_ID!.slice(-20)})` 
        : 'MISSING',
      GOOGLE_CLIENT_SECRET: hasGoogleClientSecret ? 'SET' : 'MISSING',
      DATABASE_URL: hasDatabaseUrl 
        ? `SET (${process.env.DATABASE_URL!.includes('neon') ? 'Neon' : 'other'})` 
        : 'MISSING',
      NODE_ENV: process.env.NODE_ENV ?? 'NOT_SET',
      VERCEL: process.env.VERCEL ?? 'NOT_SET',
    },
    request: {
      url: request.url,
      host: new URL(request.url).host,
    },
  });
}

