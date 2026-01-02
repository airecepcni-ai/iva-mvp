// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

/**
 * Regression: server-side API routes use `src/app/api/utils/sql.js`.
 * In dev, we must prefer pooler URLs (DB_POOLER_URL or AUTH_DB_POOLER_URL) to avoid IPv6/5432 timeouts.
 *
 * This test does NOT hit a real DB. It validates the chosen connection string and TLS SNI behavior.
 */

describe('server DB url selection (pooler + ipv4 rewrite)', () => {
  it('prefers AUTH_DB_POOLER_URL in dev and rewrites host to ipv4 with TLS servername preserved', async () => {
    const prevEnv = { ...process.env }
    try {
      process.env.NODE_ENV = 'development'
      process.env.AUTH_DB_POOLER_URL =
        'postgresql://user:pass@aws-1-eu-north-1.pooler.supabase.com:6543/postgres'
      process.env.DATABASE_URL =
        'postgresql://user:pass@db.xxxx.supabase.co:5432/postgres'

      let captured = null as any

      vi.resetModules()
      vi.doMock('pg', () => {
        class MockPool {
          constructor(opts: any) {
            captured = opts
          }
          query() {
            return Promise.resolve({ rows: [] })
          }
          connect() {
            return Promise.resolve({
              query: () => Promise.resolve({ rows: [] }),
              release: () => {},
            })
          }
        }
        return { default: { Pool: MockPool } }
      })

      vi.doMock('node:dns/promises', () => {
        return {
          lookup: vi.fn(async () => ({ address: '51.21.18.29' })),
          resolve4: vi.fn(async () => ['51.21.18.29']),
          resolveAny: vi.fn(async () => [{ type: 'A', address: '51.21.18.29' }]),
        }
      })

      vi.doMock('node:dns', () => {
        return {
          default: {},
          setDefaultResultOrder: vi.fn(),
          getDefaultResultOrder: vi.fn(() => 'ipv4first'),
        }
      })

      await import('@/app/api/utils/sql.js')

      expect(captured).toBeTruthy()
      const cs = String(captured.connectionString)
      expect(cs).toContain('51.21.18.29')
      expect(cs).toContain(':6543')
      expect(captured.ssl?.servername).toBe('aws-1-eu-north-1.pooler.supabase.com')
    } finally {
      process.env = prevEnv
      vi.resetModules()
    }
  })
})








