/**
 * POST /api/fix-auth-defaults
 * Fixes missing DEFAULT values on auth table id columns.
 */

import pg from 'pg';

const { Pool } = pg;

function getDatabaseUrl() {
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

async function query(pool, sql) {
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return await pool.query(sql);
  } finally {
    if (prev === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }
}

const FIXES = [
  // Ensure pgcrypto extension exists
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

  // Set default for auth_users.id
  `ALTER TABLE auth_users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`,

  // Set default for auth_accounts.id
  `ALTER TABLE auth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`,

  // Set default for auth_sessions.id
  `ALTER TABLE auth_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;`,
];

export async function POST() {
  // Block in production - return 404 to not reveal endpoint existence
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const pool = createPool();
  const results = [];

  try {
    for (const sql of FIXES) {
      try {
        await query(pool, sql);
        results.push({ sql: sql.slice(0, 60) + '...', ok: true });
      } catch (err) {
        results.push({
          sql: sql.slice(0, 60) + '...',
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Verify the defaults are set
    const verification = await query(
      pool,
      `SELECT table_name, column_name, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('auth_users', 'auth_accounts', 'auth_sessions')
         AND column_name = 'id'`
    );

    return Response.json({
      ok: results.every((r) => r.ok),
      message: 'Default values fixed',
      results,
      verification: verification.rows,
    });
  } finally {
    await pool.end();
  }
}

export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  return Response.json({
    info: 'POST to fix missing DEFAULT values on auth table id columns',
  });
}



