/**
 * React Router resource route for /api/waitlist
 * Wraps the existing route.js handler for Vercel deployment
 */
import type { ActionFunctionArgs } from 'react-router';
import { POST as postHandler } from './api/waitlist/route.js';

export async function action({ request }: ActionFunctionArgs) {
  return postHandler(request);
}
