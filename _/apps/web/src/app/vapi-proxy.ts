/**
 * React Router resource route proxy for Vapi endpoints on Vercel.
 *
 * Why: Vercel rewrites are not reliably taking effect with the React Router runtime,
 * so POSTs to /vapi/* and /api/vapi/* can fall through to the catch-all route and 405.
 *
 * This file is mounted for BOTH:
 * - /vapi/*      (Vapi Server URL webhook)
 * - /api/vapi/*  (Vapi tool endpoints)
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

const DEFAULT_BACKEND_ORIGIN = 'https://iva-backendmvp-production.up.railway.app';

function backendOrigin(): string {
  const raw =
    process.env.BACKEND_BASE_URL ||
    process.env.VITE_BACKEND_BASE_URL ||
    process.env.RAILWAY_BACKEND_URL ||
    DEFAULT_BACKEND_ORIGIN;
  return raw.replace(/\/$/, '');
}

function filterHopByHopHeaders(headers: Headers) {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#hbh
  const hopByHop = [
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
  ];
  hopByHop.forEach((h) => headers.delete(h));
  // Let the runtime compute it.
  headers.delete('content-length');
}

async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = new URL(`${backendOrigin()}${url.pathname}${url.search}`);

  const headers = new Headers(request.headers);
  // Avoid leaking the edge host to the backend.
  headers.delete('host');

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const resHeaders = new Headers(upstream.headers);
  filterHopByHopHeaders(resHeaders);

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  return proxy(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return proxy(request);
}


