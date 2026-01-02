const LOCAL_PORT = process.env.PORT || 3000;
const LOCAL_ORIGIN = `http://localhost:${LOCAL_PORT}`;

function trimHeader(value) {
  if (!value) return null;
  return value.split(',')[0].trim();
}

/**
 * Determine the origin to use for redirects and absolute URLs.
 * Prefers forwarded headers (Vercel / proxies), then the request URL, then localhost fallback.
 */
export function getRequestOrigin(request) {
  const headers = request?.headers;
  const forwardedProto = trimHeader(headers?.get('x-forwarded-proto'));
  const forwardedHost = trimHeader(headers?.get('x-forwarded-host'));

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (forwardedHost) {
    const scheme = forwardedProto || (forwardedHost.startsWith('localhost') ? 'http' : 'https');
    return `${scheme}://${forwardedHost}`;
  }

  try {
    const parsed = new URL(request?.url ?? '');
    if (parsed.origin) {
      return parsed.origin;
    }
  } catch (error) {
    console.warn('[url.utils] Failed to parse request URL origin', error);
  }

  return LOCAL_ORIGIN;
}

/**
 * Build an absolute URL using the current request origin.
 */
export function absUrl(request, path) {
  const origin = getRequestOrigin(request);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

