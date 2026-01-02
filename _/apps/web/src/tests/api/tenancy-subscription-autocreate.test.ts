// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These tests are deterministic and do not hit Supabase.
 * We mock:
 * - Auth.js session via `auth()`
 * - DB access via the `sql` helper (including `sql.transaction`)
 */

const authState = {
  userId: null as string | null,
};

type SqlCall = { query: string; values: unknown[] };
type SqlQueueItem = unknown[] | Error;
const sqlState = {
  queue: [] as SqlQueueItem[],
  calls: [] as SqlCall[],
};

function recordAndDequeue(query: string, values: unknown[]): unknown[] {
  sqlState.calls.push({ query, values });
  const next = sqlState.queue.shift();
  if (next instanceof Error) throw next;
  return next ?? [];
}

function findLegacyUsersCall(): SqlCall | undefined {
  return sqlState.calls.find((c) => {
    const q = c.query.toLowerCase();
    return (
      q.includes('public.users') ||
      q.includes('insert into users') ||
      q.includes('from users')
    );
  });
}

function makeSqlTag() {
  const tag = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    // Support both:
    // - tagged template usage: sql`SELECT ... ${x}`
    // - direct call usage: sql("SELECT ...", [x])
    if (typeof strings === 'string') {
      // If called as sql("SELECT ...", [a, b, c]) treat the 2nd arg as params array
      const normalizedValues =
        values.length === 1 && Array.isArray(values[0])
          ? (values[0] as unknown[])
          : values;
      return recordAndDequeue(strings, normalizedValues);
    }
    const query = strings.join('');
    return recordAndDequeue(query, values);
  };

  // Minimal `sql.transaction` mock used by /api/businesses
  (tag as any).transaction = async (cb: (tx: any) => Promise<any>) => {
    const tx = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
      if (typeof strings === 'string') {
        const normalizedValues =
          values.length === 1 && Array.isArray(values[0])
            ? (values[0] as unknown[])
            : values;
        return recordAndDequeue(strings, normalizedValues);
      }
      const query = strings.join('');
      return recordAndDequeue(query, values);
    };
    return await cb(tx);
  };

  return tag;
}

const sqlMock = makeSqlTag();

vi.mock('@/auth', () => {
  return {
    auth: vi.fn(async () => {
      return authState.userId ? { user: { id: authState.userId } } : null;
    }),
  };
});

vi.mock('@/app/api/utils/sql', () => {
  return { default: sqlMock };
});

// Helper: runtime resolves Vite/TS aliases and loads JS route modules, but TS can't type them.
// Keep the suppression localized to this helper so the rest of the test stays typechecked.
async function importRouteModule<T = any>(path: string): Promise<T> {
  // @ts-ignore - dynamic import of JS route modules via alias is runtime-valid in Vitest/Vite
  return await import(path);
}

describe('tenancy + subscription + default business creation (regression)', () => {
  beforeEach(() => {
    authState.userId = null;
    sqlState.queue = [];
    sqlState.calls = [];
    vi.clearAllMocks();
  });

  it('db-health reports owner_id nullable and businesses_owner_fk absent', async () => {
    // info_schema says nullable, pg_constraint says FK missing
    sqlState.queue = [
      [{ is_nullable: 'YES' }],
      [],
    ];

    const mod = await importRouteModule<any>('@/app/api/db-health/route.js');
    const res: Response = await mod.GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.checks).toEqual({
      ownerIdNullable: true,
      ownerFkPresent: false,
    });
    expect(Array.isArray(json.advice)).toBe(true);
    expect(Array.isArray(json.remediationSql)).toBe(true);
    expect(json.remediationSql).toHaveLength(0);
  });

  it('db-health is blocked in production unless explicitly enabled, and does not query DB', async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevFlag = process.env.ENABLE_DB_HEALTHCHECK;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DB_HEALTHCHECK;

      sqlState.calls = [];
      sqlState.queue = [];

      const mod = await importRouteModule<any>('@/app/api/db-health/route.js');
      const res: Response = await mod.GET();

      // Prefer 404 to avoid leaking existence in prod
      expect([404, 403]).toContain(res.status);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(['not_found', 'forbidden']).toContain(json.error);

      // Critical: must not query DB
      expect(sqlState.calls).toHaveLength(0);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevFlag === undefined) {
        delete process.env.ENABLE_DB_HEALTHCHECK;
      } else {
        process.env.ENABLE_DB_HEALTHCHECK = prevFlag;
      }
    }
  });

  it('1) /api/businesses isolates by session user (auth_user_id)', async () => {
    authState.userId = 'user-A';

    // tx calls: advisory lock, select businesses
    sqlState.queue = [
      [], // pg_advisory_xact_lock
      [
        {
          id: 'biz-1',
          name: 'A Biz',
          timezone: 'Europe/Prague',
          is_subscribed: false,
          created_at: '2025-01-01',
        },
      ], // SELECT businesses
    ];

    const mod = await importRouteModule<any>('@/app/api/businesses/route.js');
    const res: Response = await mod.GET(new Request('http://test.local/api/businesses'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.userId).toBe('user-A');
    expect(json.businesses).toHaveLength(1);

    const whereCall = sqlState.calls.find((c) => c.query.includes('WHERE auth_user_id ='));
    expect(whereCall).toBeTruthy();
    expect(whereCall?.values).toContain('user-A');
  });

  it('2) /api/subscription enforces ownership and returns isSubscribed when owned', async () => {
    authState.userId = 'user-A';

    const mod = await importRouteModule<any>('@/app/api/subscription/route.js');

    // Case 1: business exists but owned by someone else -> 403
    sqlState.queue = [
      [
        {
          id: 'biz-1',
          name: 'Other Biz',
          is_subscribed: true,
          auth_user_id: 'user-B',
        },
      ],
    ];
    const resForbidden: Response = await mod.GET(
      new Request('http://test.local/api/subscription?businessId=biz-1')
    );
    expect(resForbidden.status).toBe(403);

    // Case 2: owned -> returns isSubscribed
    sqlState.queue = [
      [
        {
          id: 'biz-1',
          name: 'My Biz',
          is_subscribed: true,
          auth_user_id: 'user-A',
        },
      ],
    ];
    const resOk: Response = await mod.GET(
      new Request('http://test.local/api/subscription?businessId=biz-1')
    );
    expect(resOk.status).toBe(200);
    const json = await resOk.json();
    expect(json.ok).toBe(true);
    expect(json.businessId).toBe('biz-1');
    expect(json.isSubscribed).toBe(true);
  });

  it('3) /api/businesses auto-creates default business for new user and is idempotent', async () => {
    authState.userId = 'user-new';

    const mod = await importRouteModule<any>('@/app/api/businesses/route.js');

    // First call (with client timezone header): no businesses -> insert -> reselect
    sqlState.queue = [
      [], // pg_advisory_xact_lock
      [], // initial SELECT businesses (empty)
      [], // SAVEPOINT
      [{ id: 'biz-new' }], // INSERT RETURNING id (success)
      [], // RELEASE SAVEPOINT
      [
        {
          id: 'biz-new',
          name: 'Můj nový salon',
          timezone: 'Europe/Bratislava',
          is_subscribed: false,
          created_at: '2025-01-01',
        },
      ], // re-SELECT businesses
    ];

    const res1: Response = await mod.GET(
      new Request('http://test.local/api/businesses', {
        headers: {
          'x-client-timezone': 'Europe/Bratislava',
        },
      })
    );
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.ok).toBe(true);
    expect(json1.created).toBe(true);
    expect(json1.businesses).toHaveLength(1);

    const insertCall = sqlState.calls.find((c) => c.query.includes('INSERT INTO public.businesses'));
    expect(insertCall).toBeTruthy();
    expect(insertCall?.query).toContain('VALUES (NULL,');
    expect(insertCall?.values).toContain('user-new');
    expect(insertCall?.values).toContain('Můj nový salon');
    expect(insertCall?.values).toContain('Europe/Bratislava');

    // Ensure we use SAVEPOINT pattern (this keeps handler robust and matches production implementation).
    const savepointCall = sqlState.calls.find((c) => c.query.includes('SAVEPOINT create_default_business'));
    const releaseSavepointCall = sqlState.calls.find((c) => c.query.includes('RELEASE SAVEPOINT create_default_business'));
    expect(savepointCall).toBeTruthy();
    expect(releaseSavepointCall).toBeTruthy();

    // Ensure we do NOT touch legacy public.users in this code path (intentional design).
    // This guards against regressions back to legacy bridging that caused:
    // - users_id_fkey
    // - users_email_key
    // - businesses_owner_fk
    const legacyUsersCall = findLegacyUsersCall();
    expect(legacyUsersCall).toBeFalsy();

    // First call (no timezone header): should fall back to Europe/Prague for insert.
    sqlState.calls = [];
    sqlState.queue = [
      [], // pg_advisory_xact_lock
      [], // initial SELECT businesses (empty)
      [], // SAVEPOINT
      [{ id: 'biz-new-2' }], // INSERT RETURNING id (success)
      [], // RELEASE SAVEPOINT
      [
        {
          id: 'biz-new-2',
          name: 'Můj nový salon',
          timezone: 'Europe/Prague',
          is_subscribed: false,
          created_at: '2025-01-01',
        },
      ], // re-SELECT businesses
    ];

    const res1b: Response = await mod.GET(new Request('http://test.local/api/businesses'));
    expect(res1b.status).toBe(200);
    const json1b = await res1b.json();
    expect(json1b.ok).toBe(true);
    expect(json1b.created).toBe(true);
    const insertCallB = sqlState.calls.find((c) => c.query.includes('INSERT INTO public.businesses'));
    expect(insertCallB).toBeTruthy();
    expect(insertCallB?.values).toContain('Můj nový salon');
    expect(insertCallB?.values).toContain('Europe/Prague');

    // Second call: business already exists -> no insert
    sqlState.calls = [];
    sqlState.queue = [
      [], // pg_advisory_xact_lock
      [
        {
          id: 'biz-new',
          name: 'Můj nový salon',
          timezone: 'Europe/Prague',
          is_subscribed: false,
          created_at: '2025-01-01',
        },
      ], // SELECT businesses (non-empty)
    ];

    const res2: Response = await mod.GET(new Request('http://test.local/api/businesses'));
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.ok).toBe(true);
    expect(json2.created).toBe(false);

    const insertCall2 = sqlState.calls.find((c) => c.query.includes('INSERT INTO public.businesses'));
    expect(insertCall2).toBeFalsy();

    const legacyUsersCall2 = findLegacyUsersCall();
    expect(legacyUsersCall2).toBeFalsy();
  });
});


