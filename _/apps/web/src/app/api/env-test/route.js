export async function GET() {
  // Completely block in production - return empty 404
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const databaseUrl = process.env.DATABASE_URL;
  let databaseUrlProtocol = null;
  try {
    if (databaseUrl) {
      databaseUrlProtocol = new URL(databaseUrl).protocol;
    }
  } catch {
    databaseUrlProtocol = 'invalid';
  }

  const sslRejectUnauthorizedEnv = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  const sslRejectUnauthorized =
    sslRejectUnauthorizedEnv === undefined
      ? process.env.NODE_ENV === 'production'
      : !['false', '0', 'no'].includes(String(sslRejectUnauthorizedEnv).toLowerCase());
  const primaryRejectUnauthorized =
    process.env.NODE_ENV === 'production' ? sslRejectUnauthorized : false;

  const envKeys = Object.keys(process.env).filter((key) => {
    if (['AUTH_', 'NEXTAUTH_', 'GOOGLE_', 'DATABASE_'].some((p) => key.startsWith(p))) {
      return true;
    }
    return key === 'DATABASE_URL';
  });

  return Response.json({
    hasAuthSecret: Boolean(authSecret),
    authSecretLength: authSecret?.length ?? 0,
    hasDatabaseUrl: Boolean(databaseUrl),
    databaseUrlLength: databaseUrl?.length ?? 0,
    databaseUrlProtocol,
    nodeEnv: process.env.NODE_ENV ?? null,
    databaseSslRejectUnauthorizedEnv: sslRejectUnauthorizedEnv ?? null,
    databaseSslRejectUnauthorizedEffective: primaryRejectUnauthorized,
    envKeys,
    loadedEnvFiles: globalThis.__IVA_ENV_FILES__ ?? null,
  });
}


