/**
 * React Router resource route for /api/subscription
 * Wraps the existing route.js handler for Vercel deployment
 */
import type { LoaderFunctionArgs } from 'react-router';
import { GET as getHandler } from './api/subscription/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return getHandler();
}

