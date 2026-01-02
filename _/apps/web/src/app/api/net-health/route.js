/**
 * GET /api/net-health
 *
 * Dev-only connectivity healthcheck for Node -> Google OAuth endpoints.
 * Useful for diagnosing UND_ERR_CONNECT_TIMEOUT during Google OAuth callback.
 *
 * Gating: same as /api/db-health
 *  - Allowed when NODE_ENV !== 'production'
 *  - Or explicitly when ENABLE_DB_HEALTHCHECK === 'true'
 *
 * NOTE: This endpoint uses the same global fetch() implementation that Auth.js/oauth4webapi uses.
 */

import dns from 'node:dns'

function isEnabled() {
  // Allow explicit override for staging debugging.
  if (process.env.ENABLE_DB_HEALTHCHECK === 'true') return true
  const env = process.env.NODE_ENV
  if (!env) return false
  return env !== 'production'
}

export async function GET() {
  if (!isEnabled()) {
    return new Response(null, { status: 404 });
  }

  const dnsOrder =
    (typeof dns.getDefaultResultOrder === 'function' && dns.getDefaultResultOrder()) || 'unknown'

  const usingIpv4Fetch = Boolean(globalThis.__iva_undici_ipv4_fetch === true)

  const url = 'https://oauth2.googleapis.com'
  const timeoutMs = 8000
  const started = Date.now()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'accept': 'application/json' },
      signal: controller.signal,
    })
    const ms = Date.now() - started
    return Response.json({
      ok: true,
      google: {
        ok: res.ok,
        status: res.status,
        ms,
      },
      dnsOrder,
      usingIpv4Fetch,
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    const code = e && typeof e === 'object' ? (e.code ?? null) : null
    return Response.json(
      {
        ok: false,
        google: {
          ok: false,
          status: null,
          ms: Date.now() - started,
        },
        dnsOrder,
        usingIpv4Fetch,
        error: {
          name: err.name,
          code,
          message: err.message,
        },
      },
      { status: 500 }
    )
  } finally {
    clearTimeout(timer)
  }
}








