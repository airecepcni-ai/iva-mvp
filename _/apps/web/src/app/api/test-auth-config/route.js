/**
 * GET /api/test-auth-config
 * Tests if the Auth.js configuration is valid.
 */

export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  
  try {
    // Dynamic import to get fresh module
    const { createAuthConfig } = await import('../../../auth.js');
    const config = createAuthConfig();

    const providers = config.providers?.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));

    return Response.json({
      ok: true,
      hasSecret: Boolean(config.secret),
      secretLength: config.secret?.length ?? 0,
      hasAdapter: Boolean(config.adapter),
      adapterMethods: config.adapter
        ? Object.keys(config.adapter).filter(
            (k) => typeof config.adapter[k] === 'function'
          )
        : [],
      providers,
      basePath: config.basePath,
      trustHost: config.trustHost,
      nodeTlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : null,
      },
      { status: 500 }
    );
  }
}









