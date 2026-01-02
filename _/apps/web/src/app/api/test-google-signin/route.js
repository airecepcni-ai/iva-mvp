/**
 * GET /api/test-google-signin
 * Simulates what happens during Google sign-in to diagnose errors.
 */

import pg from 'pg';

const { Pool } = pg;

export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const databaseUrl =
    process.env.NODE_ENV !== 'production'
      ? process.env.DB_POOLER_URL ||
        process.env.AUTH_DB_POOLER_URL ||
        process.env.AUTH_DB_URL ||
        process.env.DATABASE_URL ||
        null
      : process.env.AUTH_DB_URL || process.env.DATABASE_URL || null;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const authSecret = process.env.AUTH_SECRET;

  const checks = {
    hasDatabaseUrl: Boolean(databaseUrl),
    hasGoogleClientId: Boolean(googleClientId),
    hasGoogleClientSecret: Boolean(googleClientSecret),
    hasAuthSecret: Boolean(authSecret),
    googleClientIdLength: googleClientId?.length ?? 0,
    googleClientSecretLength: googleClientSecret?.length ?? 0,
  };

  // Test DB connection with TLS fallback
  let dbStatus = { ok: false, error: null };
  try {
    // Try with NODE_TLS_REJECT_UNAUTHORIZED=0 from the start
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
    });

    const result = await pool.query('SELECT 1 as ok');
    dbStatus.ok = result.rows[0]?.ok === 1;
    await pool.end();

    if (prev === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  } catch (err) {
    dbStatus.error = err instanceof Error ? err.message : String(err);
    dbStatus.code = err?.code ?? null;
  }

  // Test adapter query (getUserByAccount style)
  let adapterStatus = { ok: false, error: null };
  try {
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
    });

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.email_verified as "emailVerified", u.image
       FROM auth_users u
       JOIN auth_accounts a ON u.id = a.user_id
       WHERE a.provider = $1 AND a.provider_account_id = $2`,
      ['google', 'test-account-id']
    );
    adapterStatus.ok = true;
    adapterStatus.rowCount = result.rowCount;
    await pool.end();

    if (prev === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  } catch (err) {
    adapterStatus.error = err instanceof Error ? err.message : String(err);
    adapterStatus.code = err?.code ?? null;
  }

  return Response.json({
    checks,
    dbStatus,
    adapterStatus,
    recommendation:
      !checks.hasGoogleClientId || !checks.hasGoogleClientSecret
        ? 'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        : !dbStatus.ok
          ? 'Database connection failed. Check DATABASE_URL and SSL settings.'
          : !adapterStatus.ok
            ? 'Adapter query failed. Check table schema.'
            : 'All checks passed. The issue may be in Auth.js initialization.',
  });
}



