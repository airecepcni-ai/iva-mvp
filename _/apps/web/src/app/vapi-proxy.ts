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

const DEFAULT_BACKEND_BASE_URL = 'https://iva-backendmvp-production.up.railway.app';

function backendBaseUrl(requestUrl: URL): string {
  const raw =
    process.env.BACKEND_BASE_URL ||
    process.env.VITE_BACKEND_BASE_URL ||
    process.env.RAILWAY_BACKEND_URL ||
    DEFAULT_BACKEND_BASE_URL;
  const trimmed = raw.replace(/\/$/, '');
  // Allow a relative base like "/backend" (useful with Vercel rewrites).
  if (trimmed.startsWith('/')) return `${requestUrl.origin}${trimmed}`;
  return trimmed;
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
  const targetUrl = `${backendBaseUrl(url)}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  // Avoid leaking the edge host to the backend.
  headers.delete('host');
  // Don't set content-length manually (streaming request).
  headers.delete('content-length');

  const method = request.method.toUpperCase();
  const isBodyAllowed = method !== 'GET' && method !== 'HEAD';
  const hasBody = Boolean(request.headers.get('content-length')) || request.body != null;

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.log(`[vapi-proxy] ${method} ${url.pathname}${url.search} hasBody=${isBodyAllowed && hasBody}`);
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
  };

  // Forward the raw request stream (do not read/parse the body here).
  if (isBodyAllowed && request.body != null) {
    init.body = request.body;
    // Required by Node's fetch (undici) when streaming a request body.
    init.duplex = 'half';
  }

  const upstream = await fetch(targetUrl, init);
  if (isDev) {
    console.log(`[vapi-proxy] upstream status=${upstream.status} path=${url.pathname}`);
  }

  const resHeaders = new Headers(upstream.headers);
  filterHopByHopHeaders(resHeaders);

  // Stream the response back without buffering.
  return new Response(upstream.body, {
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


