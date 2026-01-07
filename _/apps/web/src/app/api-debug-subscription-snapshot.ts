/**
 * React Router resource route for /api/debug/subscription-snapshot
 * Wraps the existing handler for Vercel deployment.
 */
import type { LoaderFunctionArgs } from 'react-router';
import { GET as handler } from './api/debug/subscription-snapshot/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return handler(request);
}

