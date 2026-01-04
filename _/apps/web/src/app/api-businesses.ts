/**
 * React Router resource route for /api/businesses
 * Wraps the existing route.js handler for Vercel deployment
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { GET as getHandler, POST as postHandler } from './api/businesses/route.js';

export async function loader({ request }: LoaderFunctionArgs) {
  return getHandler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return postHandler(request);
}

