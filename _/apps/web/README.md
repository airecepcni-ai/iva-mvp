# Deploy Checklist

## Vercel deployment
- **Root directory:** `apps/web`
- **Framework preset:** `react-router` (see `vercel.json` + `react-router.config.ts` using `@vercel/react-router/vite`)
- **Backend proxy:** Vercel rewrites `/backend/:path*` to `https://iva-backendmvp-production.up.railway.app/:path*`. Auth.js routes under `/api/auth/*` stay on Vercel.

## Required environment variables
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_TRUST_HOST`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL` or `DB_POOLER_URL` / `AUTH_DB_POOLER_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional overrides: `VITE_BACKEND_BASE_URL` (default `/backend`), `IVA_BACKEND_URL`, `STRIPE_PRICE_TIER*`

## Stripe webhook
- Endpoint: `/api/stripe/webhook`
- Required events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Ensure `STRIPE_WEBHOOK_SECRET` is set in Vercel and Stripe sends signatures to verify raw bodies.

## Database migrations
- Apply SQL files in `apps/web/sql/` directly via `psql`.
- New dashboard migrations:
  - `apps/web/sql/001_create_view_daily_activity_summary.sql`
  - `apps/web/sql/002_create_table_alerts.sql`
- Stripe webhook migration:
  - `apps/web/sql/2026-01-02_stripe_events_table.sql` (required before connecting the webhook in production)
  ```
  psql "$DATABASE_URL" -f apps/web/sql/001_create_view_daily_activity_summary.sql
  psql "$DATABASE_URL" -f apps/web/sql/002_create_table_alerts.sql
  psql "$DATABASE_URL" -f apps/web/sql/2026-01-02_stripe_events_table.sql
  ```

## Smoke test checklist
- Run `npm run build` from `apps/web`.
- Run `npm run start` (locally) and visit `/`, `/account/signin`, `/dashboard`.
- Trigger each tier’s “Vybrat tarif” button and confirm `/api/stripe/checkout` receives the correct `priceId`.

## Manual test checklist
- `/dashboard` renders V2 when `NEXT_PUBLIC_UI_VERSION=v2` (and still works with `VITE_UI_VERSION=v2`).
- `/api/dashboard/chart` returns `view_missing` vs `no_activity` error branches correctly.
- `/api/alerts` returns empty state for missing table or no alerts.
- `POST /api/alerts/:id/status` enforces tenant scoping (cannot update another tenant’s alert).
- Server build doesn’t hang due to DB client init at module import-time (DB client creation stays lazy).

