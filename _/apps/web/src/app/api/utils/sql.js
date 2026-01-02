import pg from 'pg';
import dns from 'node:dns';
import { lookup, resolve4, resolveAny } from 'node:dns/promises';

const { Pool } = pg;

function chooseServerDatabaseUrl() {
  const env = process.env.NODE_ENV;
  const isDev = env && env !== 'production';

  if (isDev) {
    return (
      process.env.DB_POOLER_URL ||
      process.env.AUTH_DB_POOLER_URL ||
      process.env.DATABASE_URL ||
      null
    );
  }

  return process.env.DB_POOLER_URL || process.env.DATABASE_URL || null;
}

function isIpv4Literal(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isIpv6Literal(host) {
  return typeof host === 'string' && host.includes(':');
}

async function resolveHostnameToIpv4(host) {
  try {
    const r = await lookup(host, { family: 4 });
    if (r && typeof r === 'object' && r.address) return r.address;
  } catch {
    // ignore
  }
  try {
    const a = await resolve4(host);
    if (a?.[0]) return a[0];
  } catch {
    // ignore
  }
  try {
    const any = await resolveAny(host);
    const aRec = (any || []).find((r) => r && r.type === 'A' && r.address);
    if (aRec?.address) return aRec.address;
  } catch {
    // ignore
  }
  return null;
}

let pool = null;
let poolInitPromise = null;

async function initPool() {
  if (poolInitPromise) {
    await poolInitPromise;
    return;
  }

  poolInitPromise = (async () => {
    const rawDatabaseUrl = chooseServerDatabaseUrl();
    if (!rawDatabaseUrl) {
      return;
    }

    const env = process.env.NODE_ENV;
    const isDev = env && env !== 'production';

    if (isDev) {
      try {
        dns.setDefaultResultOrder?.('ipv4first');
      } catch {
        // ignore
      }
    }

    let finalDatabaseUrl = rawDatabaseUrl;
    let dbServernameForTls = null;

    if (isDev) {
      try {
        const u = new URL(rawDatabaseUrl);
        const host = u.hostname;
        const port = u.port || '(default)';
        const usingPooler = Boolean(
          (process.env.DB_POOLER_URL && rawDatabaseUrl === process.env.DB_POOLER_URL) ||
            (process.env.AUTH_DB_POOLER_URL && rawDatabaseUrl === process.env.AUTH_DB_POOLER_URL)
        );

        console.log('[db] DB target:', { host, port, usingPooler });

        if (!isIpv4Literal(host) && !isIpv6Literal(host)) {
          const ipv4 = await resolveHostnameToIpv4(host);
          if (ipv4) {
            u.hostname = ipv4;
            finalDatabaseUrl = u.toString();
            dbServernameForTls = host;
            console.log('[db] DB host forced to ipv4:', host, '->', ipv4);
          }
        }
      } catch {
        // ignore
      }
    }

    pool = new Pool({
      connectionString: finalDatabaseUrl,
      ssl: {
        rejectUnauthorized: false,
        ...(dbServernameForTls ? { servername: dbServernameForTls } : {}),
      },
    });
  })();

  try {
    await poolInitPromise;
  } catch (error) {
    poolInitPromise = null;
    throw error;
  }
}

async function getPool() {
  await initPool();
  return pool;
}

function buildQuery(strings, values) {
  let text = '';
  const params = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }
  return { text, values: params };
}

const missingDatabaseError = new Error(
  'No database connection string was provided. Perhaps process.env.DATABASE_URL has not been set'
);

function throwMissingDbError() {
  throw missingDatabaseError;
}

const sql = async (strings, ...values) => {
  const poolInstance = await getPool();
  if (!poolInstance) {
    throwMissingDbError();
  }
  const { text, values: params } = buildQuery(strings, values);
  const result = await poolInstance.query(text, params);
  return result.rows;
};

sql.transaction = async (callback) => {
  const poolInstance = await getPool();
  if (!poolInstance) {
    throwMissingDbError();
  }
  const client = await poolInstance.connect();
  try {
    await client.query('BEGIN');
    const tx = async (strings, ...values) => {
      const { text, values: params } = buildQuery(strings, values);
      const result = await client.query(text, params);
      return result.rows;
    };
    const out = await callback(tx);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw e;
  } finally {
    client.release();
  }
};

export default sql;