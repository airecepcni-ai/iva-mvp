/**
 * POST /api/fix-auth-schema
 * Adds any missing columns to the auth tables.
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

const MIGRATIONS = [
  // Add password column to auth_accounts if missing
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_accounts'
         AND column_name = 'password'
     ) THEN
       ALTER TABLE auth_accounts ADD COLUMN password TEXT;
     END IF;
   END $$;`,

  // Add created_at/updated_at to auth_users if missing
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_users'
         AND column_name = 'created_at'
     ) THEN
       ALTER TABLE auth_users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_users'
         AND column_name = 'updated_at'
     ) THEN
       ALTER TABLE auth_users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  // Add created_at/updated_at to auth_accounts if missing
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_accounts'
         AND column_name = 'created_at'
     ) THEN
       ALTER TABLE auth_accounts ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_accounts'
         AND column_name = 'updated_at'
     ) THEN
       ALTER TABLE auth_accounts ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  // Add created_at/updated_at to auth_sessions if missing
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_sessions'
         AND column_name = 'created_at'
     ) THEN
       ALTER TABLE auth_sessions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_sessions'
         AND column_name = 'updated_at'
     ) THEN
       ALTER TABLE auth_sessions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  // Add created_at to auth_verification_tokens if missing
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'auth_verification_tokens'
         AND column_name = 'created_at'
     ) THEN
       ALTER TABLE auth_verification_tokens ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     END IF;
   END $$;`,

  // Create indexes if not exist
  `CREATE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_token ON auth_sessions(session_token);`,
];

export async function POST() {
  // Block in production - return 404 to not reveal endpoint existence
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const pool = createPool();
  const results = [];

  try {
    for (const sql of MIGRATIONS) {
      try {
        await queryWithTlsFallback(pool, sql);
        results.push({ sql: sql.slice(0, 50) + '...', ok: true });
      } catch (err) {
        results.push({
          sql: sql.slice(0, 50) + '...',
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({
      ok: results.every((r) => r.ok),
      message: 'Schema migrations applied',
      results,
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
    info: 'POST to apply schema migrations (add missing columns)',
  });
}



