/**
 * React Router resource route for /api/setup-waitlist
 * Wraps the setup endpoint for Vercel deployment
 */
import type { LoaderFunctionArgs } from 'react-router';
import { GET as getHandler } from './api/setup-waitlist/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return getHandler(request);
}
