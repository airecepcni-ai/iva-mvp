## Auth.js (apps/web) notes

This app uses **Auth.js v5** (`@auth/core`) with **Hono** middleware (`@hono/auth-js`).

### Database requirement

Auth.js uses a DB-backed adapter with these tables:

- `auth_users`
- `auth_accounts`
- `auth_sessions`
- `auth_verification_tokens`

Create them once by running this SQL in Supabase SQL Editor (against the DB used by `DATABASE_URL`):

- `create-anything/_/apps/web/sql/authjs-schema.sql`

### Local dev SSL (Supabase)

For local development, `apps/web` creates the Postgres pool with:

- `ssl: { rejectUnauthorized: false }`

This avoids common Windows trust-chain issues with Supabase Postgres during dev.


## Task B build & run

See [Local build & start (Task B)](docs/BUILD_AND_RUN.md) for the verified production build/start workflow and smoke tests that block on Task B.









