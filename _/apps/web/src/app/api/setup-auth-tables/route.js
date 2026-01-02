/**
 * POST /api/setup-auth-tables
 *
 * Creates the Auth.js schema tables (auth_users, auth_accounts, auth_sessions,
 * auth_verification_tokens) in the database pointed to by DATABASE_URL.
 *
 * Run this ONCE after setting up your Supabase project.
 * After tables exist, Google login should work.
 *
 * Usage:
 *   curl -X POST $APP_URL/api/setup-auth-tables
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

// Helper to create a pool with proper SSL for Supabase
function createPool() {
  const databaseUrl = getDatabaseUrl();
  return new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
  });
}

// Helper to run a query with TLS fallback for dev environments
async function queryWithTlsFallback(pool, sql) {
  try {
    return await pool.query(sql);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const looksLikeTls =
      /certificate has expired/i.test(msg) ||
      /self-signed certificate/i.test(msg) ||
      /unable to verify the first certificate/i.test(msg);

    if (looksLikeTls && process.env.NODE_ENV !== 'production') {
      // Temporarily disable TLS verification for this query only
      const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const retryPool = createPool();
        const result = await retryPool.query(sql);
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

const SCHEMA_SQL = `
-- Auth.js schema for apps/web custom adapter
-- Tables use snake_case columns; adapter aliases them to camelCase for Auth.js.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- auth_users
CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auth_accounts
CREATE TABLE IF NOT EXISTS auth_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  expires_at BIGINT,
  refresh_token TEXT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  password TEXT,
  refresh_token_expires_in BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_account_id)
);

-- auth_sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auth_verification_tokens
CREATE TABLE IF NOT EXISTS auth_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT PRIMARY KEY,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);
`;

export async function POST(request) {
  // Block in production - return 404 to not reveal endpoint existence
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return Response.json(
      { error: 'DATABASE_URL is not set' },
      { status: 500 }
    );
  }

  const pool = createPool();

  try {
    // Run the schema creation SQL with TLS fallback
    await queryWithTlsFallback(pool, SCHEMA_SQL);

    // Verify tables exist
    const tablesResult = await queryWithTlsFallback(pool, `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('auth_users', 'auth_accounts', 'auth_sessions', 'auth_verification_tokens')
      ORDER BY table_name
    `);

    const createdTables = tablesResult.rows.map((r) => r.table_name);

    return Response.json({
      ok: true,
      message: 'Auth.js tables created successfully',
      tables: createdTables,
    });
  } catch (err) {
    console.error('[setup-auth-tables] Error:', err);
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

export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  return Response.json({
    info: 'POST to this endpoint to create the Auth.js tables in your database',
    usage: 'curl -X POST $APP_URL/api/setup-auth-tables',
  });
}

