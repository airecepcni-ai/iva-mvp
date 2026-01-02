-- Auth.js schema for apps/web (Supabase Postgres)
-- ==============================================
-- Run this ONCE in Supabase SQL Editor for the database pointed to by DATABASE_URL.
-- Safe to run multiple times (uses IF NOT EXISTS).
--
-- Alternative: POST http://localhost:4000/api/setup-auth-tables (dev only)
--
-- Tables with snake_case columns matching src/auth.js adapter queries:
--   - auth_users
--   - auth_accounts
--   - auth_sessions
--   - auth_verification_tokens

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
