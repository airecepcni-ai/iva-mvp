// IMPORTANT: neon-setup MUST be imported first to configure WebSocket before any DB usage
import './neon-setup';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js';
import { HTTPException } from 'hono/http-exception';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { API_BASENAME, api, registerRoutes } from './route-builder';

/**
 * Ensure .env files are loaded for the Node server in dev.
 *
 * Vite/React Router will load env for the client build, but the Hono Node server
 * needs `process.env.AUTH_SECRET` at runtime (required by @hono/auth-js).
 *
 * We intentionally load:
 *   - .env
 *   - .env.local
 *   - .env.<mode>
 *   - .env.<mode>.local
 * from the apps/web project root.
 */
function loadEnvFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  // Track which env files were actually loaded (debug, no secret values).
  // @ts-ignore
  globalThis.__IVA_ENV_FILES__ ??= [];
  // @ts-ignore
  globalThis.__IVA_ENV_FILES__.push(filePath);

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Support both `KEY=value` and `export KEY=value`
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2] ?? '';
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Do not override explicitly provided environment variables
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function loadAppEnv() {
  const mode = process.env.NODE_ENV ?? 'development';

  // Resolve paths robustly on Windows.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // apps/web
  const appsWebDir = path.resolve(__dirname, '..');
  // create-anything/_
  const createAnythingUnderScoreDir = path.resolve(appsWebDir, '..', '..');
  // create-anything
  const createAnythingDir = path.resolve(createAnythingUnderScoreDir, '..');
  // repo root (IVA)
  const repoRootDir = path.resolve(createAnythingDir, '..');

  // Prefer the closest env files first, but also allow central env files elsewhere
  // in this monorepo (e.g. iva-backend/.env).
  const envDirs = [appsWebDir, createAnythingUnderScoreDir, createAnythingDir, repoRootDir];

  for (const envDir of envDirs) {
    for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
      loadEnvFromFile(path.join(envDir, file));
    }
  }

  // Additional opt-in monorepo env files (so you don't need to duplicate secrets).
  loadEnvFromFile(path.join(repoRootDir, 'iva-backend', '.env'));
  loadEnvFromFile(path.join(repoRootDir, 'iva-web', '.env'));
  loadEnvFromFile(path.join(repoRootDir, 'iva-web', '.env.local'));
}

loadAppEnv();

// Compatibility: some setups still use NEXTAUTH_* names.
// Ensure Hono/Auth.js can always read AUTH_*.
if ((!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length === 0) && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if ((!process.env.AUTH_URL || process.env.AUTH_URL.length === 0) && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

// Import auth config AFTER env is loaded (src/auth.js reads env at module init time).
const { createAuthConfig } = (await import('../src/auth.js')) as any;

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

// Auth.js (NextAuth v5-style) routes + config
// Keep /api/auth/token and /api/auth/expo-web-success working as-is (they're custom routes in src/app/api/auth/*).
app.use('*', initAuthConfig(() => createAuthConfig()));
app.use('/api/auth/*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api/auth/token' || path === '/api/auth/expo-web-success') {
    return next();
  }
  return authHandler()(c, next);
});

// Populate session for all other API routes (without requiring auth).
// This allows route handlers to access c.get('authUser') if authenticated.
app.use('/api/*', async (c, next) => {
  // Skip auth routes - they're handled above
  if (c.req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Try to verify auth - if it fails (401), continue anyway but without session
  try {
    // verifyAuth() will populate c.set('authUser', session) if valid
    await verifyAuth()(c, async () => {});
  } catch (e) {
    // Session invalid or missing - that's fine, just continue without session
  }
  
  return next();
});

app.onError((err, c) => {
  // For any API path, always return JSON (clients like @hono/auth-js/react expect JSON).
  if (c.req.path.startsWith('/api/')) {
    const status = err instanceof HTTPException ? err.status : 500;
    return c.json(
      {
        error: err instanceof Error ? err.message : 'An error occurred in your app',
        details: serializeError(err),
      },
      status
    );
  }
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb to match vercel limit
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

app.route(API_BASENAME, api);

let serverPromise: ReturnType<typeof createHonoServer> | null = null;

async function initializeServer() {
  await registerRoutes();
  return createHonoServer({
    app,
    defaultLogger: false,
  });
}

/**
 * Lazily initialize the server so builds don't start the HTTP listener.
 */
export async function createServer() {
  if (!serverPromise) {
    serverPromise = initializeServer();
  }
  return serverPromise;
}

export default createServer;
