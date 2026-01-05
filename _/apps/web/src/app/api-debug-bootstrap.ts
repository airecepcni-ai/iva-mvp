/**
 * React Router resource route for /api/debug/bootstrap
 * Wraps the debug bootstrap route.js handler for Vercel deployment
 */
import type { LoaderFunctionArgs } from 'react-router';
import { GET as getHandler } from './api/debug/bootstrap/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return getHandler(request);
}

