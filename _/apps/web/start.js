/**
 * Production server entry point
 *
 * This wrapper ensures neon WebSocket is configured BEFORE any module
 * that uses @neondatabase/serverless is loaded.
 * It also compiles the Hono server entry from `src/__create/index.ts` on-the-fly
 * so the start script works regardless of the React Router build output path.
 */
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT) || DEFAULT_PORT;

process.env.PORT = String(port);
process.env.HOST = DEFAULT_HOST;

neonConfig.webSocketConstructor = ws;
console.log('[start.js] Neon WebSocket configured before server import');

process.on('unhandledRejection', (error) => {
  console.error('[start.js] Unhandled rejection', error);
});
process.on('uncaughtException', (error) => {
  console.error('[start.js] Uncaught exception', error);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceEntryPoint = path.join(__dirname, '__create', 'index.ts');

async function resolveServerEntry(rootDir) {
  const buildRoot = path.join(rootDir, 'build', 'server');
  const primaryEntry = path.join(buildRoot, 'index.js');
  try {
    await fs.promises.access(primaryEntry);
    return primaryEntry;
  } catch {
    // fallback to hashed directories
  }

  const entries = await fs.promises.readdir(buildRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(buildRoot, entry.name, 'index.js');
    try {
      await fs.promises.access(candidate);
      return candidate;
    } catch {
      // continue searching
    }
  }

  throw new Error('Could not resolve the React Router server output. Run `npm run build` first.');
}

async function tryImportBuiltServerEntry(entryPath) {
  try {
    const moduleUrl = pathToFileURL(entryPath).href;
    const module = await import(moduleUrl);

    const bootstrap =
      module.default ??
      module.createServer ??
      module.server ??
      module.create ??
      module.handler ??
      module.app;

    if (typeof bootstrap === 'function') {
      return await bootstrap();
    }

    if (bootstrap) {
      return bootstrap;
    }
  } catch (error) {
    console.warn('[start.js] could not import built server entry:', error);
  }

  return null;
}

async function buildServerFromSource(manifestPath) {
  const manifestCode = await fs.promises.readFile(manifestPath, 'utf8');

  const virtualModulePlugin = {
    name: 'virtual-react-router-server-build',
    setup(build) {
      build.onResolve({ filter: /^virtual:react-router\/server-build$/ }, () => ({
        path: 'virtual:react-router/server-build',
        namespace: 'virtual-react-router-server-build',
      }));
      build.onLoad({ filter: /.*/, namespace: 'virtual-react-router-server-build' }, () => ({
        contents: manifestCode,
        loader: 'js',
        resolveDir: __dirname,
      }));
    },
  };

  const buildResult = await esbuild.build({
    entryPoints: [sourceEntryPoint],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    define: {
      'import.meta.env.REACT_ROUTER_HONO_SERVER_BUILD_DIRECTORY': JSON.stringify('build'),
      'import.meta.env.REACT_ROUTER_HONO_SERVER_ASSETS_DIR': JSON.stringify('assets'),
      'import.meta.env.REACT_ROUTER_HONO_SERVER_RUNTIME': JSON.stringify('node'),
      'import.meta.env.REACT_ROUTER_HONO_SERVER_BASENAME': JSON.stringify('/'),
      'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    sourcemap: false,
    write: false,
    plugins: [virtualModulePlugin],
  });

  const code = buildResult.outputFiles[0].text;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  const serverModule = await import(moduleUrl);
  const createServer = serverModule.default;

  if (typeof createServer !== 'function') {
    throw new Error('Expected the server entry to export a default factory function.');
  }

  return createServer();
}

const manifestPath = await resolveServerEntry(__dirname);
let server = await tryImportBuiltServerEntry(manifestPath);

if (!server) {
  server = await buildServerFromSource(manifestPath);
}

export default server;

