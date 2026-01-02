## Local env setup (apps/web)

This app uses **Auth.js v5** (`@auth/core`) via **Hono middleware** (`@hono/auth-js`).

### 1) Create your local env file

Create `create-anything/_/apps/web/.env.local` on your machine (this repo environment blocks editing `.env*` files).

Use `create-anything/_/apps/web/env.example` as a starting point.

### 2) Required variables

- `AUTH_SECRET`: required, used to sign/encrypt auth cookies/JWT.
- `AUTH_URL`: must be the **origin only** (do NOT include `/api/auth`). For dev:
  - `http://localhost:4000`
- `AUTH_TRUST_HOST`: recommended for dev (`true`).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: required for Google OAuth login.
- `AUTH_DB_URL` (or `DATABASE_URL`): required for the auth adapter tables (`auth_users`, `auth_accounts`, `auth_sessions`).
- `AUTH_DB_POOLER_URL` (recommended for dev): Supabase “Connection pooling” URL (PgBouncer, typically port 6543).

### Dev note: IPv6 DNS timeouts (Windows / some networks)

If credentials signup/login fails with `connect ETIMEDOUT <ipv6>:5432`, your network/DNS may resolve the DB host to **IPv6 first** and time out.

Preferred fix: use Supabase **connection pooling** for Auth DB access in dev:

- Set `AUTH_DB_POOLER_URL` to the Supabase “Connection pooling” URI (PgBouncer / port 6543).

### 4) Create the Auth.js tables

This app uses a custom adapter with `auth_*` tables. If you see an error like:

- `relation "auth_users" does not exist`

Run this SQL against the database pointed to by `DATABASE_URL`:

- `create-anything/_/apps/web/sql/authjs-schema.sql`

### 3) Google OAuth redirect URL

In Google Cloud Console, add this Authorized redirect URI:

- `http://localhost:4000/api/auth/callback/google`


