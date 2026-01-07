/**
 * GET /api/debug/where-am-i
 *
 * Diagnostic endpoint to check if a request is served by Vercel or proxied elsewhere.
 * Returns non-sensitive request metadata only.
 */
export async function GET(request) {
  const url = new URL(request.url);

  return Response.json({
    ok: true,
    host: url.host,
    path: url.pathname,
    headers: {
      'x-vercel-id': request.headers.get('x-vercel-id') ?? null,
      'x-railway-edge': request.headers.get('x-railway-edge') ?? null,
      'x-forwarded-host': request.headers.get('x-forwarded-host') ?? null,
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') ?? null,
    },
    timestamp: new Date().toISOString(),
  });
}


