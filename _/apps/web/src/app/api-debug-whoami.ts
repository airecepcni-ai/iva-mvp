/**
 * React Router resource route for /api/debug/whoami
 * Wraps the debug route.js handler for Vercel deployment
 */
import type { LoaderFunctionArgs } from 'react-router';
import { GET as getHandler } from './api/debug/whoami/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return getHandler(request);
}


