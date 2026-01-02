# Local build & start (Task B)

This app uses React Router v7 with a Hono-backed Node server. Task B verifies the production build/start workflow, so follow these steps to rebuild and run everything locally:

## Commands

- `npm run build` – produces `build/client` + `build/server`. The command currently uses `react-router build`, which bundles the client, compiles all routes, and emits the SSR server files.
- `npm run start` – runs `node ./start.js`. `start.js` configures Neon’s WebSocket constructor before importing `build/server/index.js`, then awaits the lazily exported `createServer()` factory so the bundle can be imported without spinning up Hono during `react-router build`.

## Start script behavior & logs

- `start.js` ensures that `process.env.PORT` defaults to `3000` and `process.env.HOST` defaults to `0.0.0.0`, while still honoring any `PORT` / `HOST` values you provide (useful for deploy targets). These values are set before the Neon setup so `createServer()` sees them when it calls `createHonoServer()`.
- Expected logs when `npm run start` succeeds:
  - `[start.js] Neon WebSocket configured before server import`
  - `[neon-setup] WebSocket constructor configured for Neon`
  - `🚀 Server started on port <port>` and `🌍 http://<address>:<port>` from `react-router-hono-server`

## Smoke test commands

Run these after `npm run start` to confirm the SSR server responds:

```powershell
Invoke-WebRequest http://127.0.0.1:3000/ -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3000/account/signin -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3000/dashboard -UseBasicParsing
```

Each command returns `StatusCode: 200` and the rendered HTML payload unless auth redirects occur. If `/dashboard` redirects, the server still returns HTML without crashing.

## Required environment variables (for DB-backed endpoints)

- `DATABASE_URL` – points to the Neon/Postgres database used by `auth.js` and other API routes.
- `AUTH_SECRET` – required by `@hono/auth-js` (matches `AUTH_SECRET` expected by `createAuthConfig()`). Do not log or expose the secret value.
- Optional: `HOST` / `PORT` when running in non-local environments.

When these are missing, DB routes throw a descriptive error, but the build & start commands still run.

## Verification checklist

- [x] `npm run build` completes with no `Cannot find package '@/auth'` or `Cannot find package '@/app'` errors during SSR compilation.
- [x] `npm run start` logs the Neon setup messages, then starts Hono and reports the listening URL.
- [x] Hitting `/`, `/account/signin`, and `/dashboard` returns HTTP 200 (the app may redirect on auth-protected routes, but they should not crash).
- [ ] Optional: hit a DB-backed route (for example `/api/auth-db-test`) once `DATABASE_URL` + `AUTH_SECRET` are set to confirm `getPool()` is invoked lazily instead of during build.

