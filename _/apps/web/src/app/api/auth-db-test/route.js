/**
 * GET /api/auth-db-test
 * Tests database connectivity specifically for auth tables.
 */

import pg from 'pg';

const { Pool } = pg;

function getDatabaseUrl() {
  // Keep consistent with server DB selection logic in `src/app/api/utils/sql.js` and Auth.js.
  // In dev, prefer pooler URLs to avoid IPv6/5432 timeouts.
  if (process.env.NODE_ENV !== 'production') {
    return (
      process.env.DB_POOLER_URL ||
      process.env.AUTH_DB_POOLER_URL ||
      process.env.AUTH_DB_URL ||
      process.env.DATABASE_URL ||
      null
    );
  }
  return process.env.AUTH_DB_URL || process.env.DATABASE_URL || null;
}

function createPool() {
  const databaseUrl = getDatabaseUrl();
  return new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
  });
}

async function queryWithTlsFallback(pool, sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const looksLikeTls =
      /certificate has expired/i.test(msg) ||
      /self-signed certificate/i.test(msg) ||
      /unable to verify the first certificate/i.test(msg);

    if (looksLikeTls && process.env.NODE_ENV !== 'production') {
      const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const retryPool = createPool();
        const result = await retryPool.query(sql, params);
        await retryPool.end();
        return result;
      } finally {
        if (prev === undefined) {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        } else {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
        }
      }
    }
    throw err;
  }
}

export async function GET() {
  const pool = createPool();

  try {
    // Test basic connectivity
    const pingResult = await queryWithTlsFallback(pool, 'SELECT 1 as ok');

    // Test auth_users table
    const usersResult = await queryWithTlsFallback(
      pool,
      'SELECT COUNT(*) as count FROM auth_users'
    );

    // Test auth_accounts table
    const accountsResult = await queryWithTlsFallback(
      pool,
      'SELECT COUNT(*) as count FROM auth_accounts'
    );

    // Test auth_sessions table
    const sessionsResult = await queryWithTlsFallback(
      pool,
      'SELECT COUNT(*) as count FROM auth_sessions'
    );

    // Check table structure
    const columnsResult = await queryWithTlsFallback(
      pool,
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('auth_users', 'auth_accounts', 'auth_sessions', 'auth_verification_tokens')
       ORDER BY table_name, ordinal_position`
    );

    return Response.json({
      ok: true,
      ping: pingResult.rows[0],
      counts: {
        users: parseInt(usersResult.rows[0].count),
        accounts: parseInt(accountsResult.rows[0].count),
        sessions: parseInt(sessionsResult.rows[0].count),
      },
      columns: columnsResult.rows,
    });
  } catch (err) {
    console.error('[auth-db-test] Error:', err);
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        code: err?.code ?? null,
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}



