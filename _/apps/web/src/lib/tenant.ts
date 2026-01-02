/**
 * Tenant (Business) utilities for multi-tenant dashboard
 * 
 * This module provides:
 * - Business type definition
 * - API client to fetch user's businesses from /api/businesses
 * - localStorage helpers for persisting active business selection (keyed by userId)
 * 
 * IMPORTANT: All API calls rely on Auth.js cookie-based sessions.
 * No X-User-Id headers or other bypasses are used.
 */

import {
  ACTIVE_BUSINESS_ID_STORAGE_KEY,
  setActiveBusinessIdInStorage,
} from './tenantId';

export interface Business {
  id: string;
  name: string;
  authUserId?: string;
  timezone?: string;
  /** Twilio/Vapi destination number for inbound call routing (E.164, e.g. +420...) */
  phone?: string | null;
  /** Dedicated IVA inbound number mapping (Twilio/Vapi "To" number) */
  vapiPhone?: string | null;
  // Optional: API may still provide snake_case for compatibility
  vapi_phone?: string | null;
  // /api/businesses returns both snake_case and camelCase for compatibility
  is_subscribed?: boolean;
  isSubscribed?: boolean;
}

// localStorage key prefix - actual key is `iva_active_business_id:{userId}`
const ACTIVE_BUSINESS_KEY_PREFIX = 'iva_active_business_id';

/**
 * Fetches the current session from Auth.js.
 * Returns the session data or null if not authenticated.
 */
export async function fetchSession(): Promise<{ user: { id: string; email?: string; name?: string } } | null> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include', // Important: send cookies
    });

    if (!res.ok) {
      console.warn('[fetchSession] Session fetch failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data?.user?.id) {
      return null;
    }

    return data;
  } catch (e) {
    console.error('[fetchSession] Error:', e);
    return null;
  }
}

/**
 * Result type for fetchUserBusinessesWithUser
 */
export interface FetchBusinessesResult {
  businesses: Business[];
  userId: string | null;
}

export interface CreateBusinessResult {
  ok: boolean;
  userId: string | null;
  business?: Business;
  error?: string;
}

function perfNow(): number {
  // Works in browser + node. performance.now() has better precision when available.
  // eslint-disable-next-line no-restricted-globals
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * Fetches businesses owned by the currently logged-in user.
 * Also returns the userId so callers can detect user changes.
 * 
 * IMPORTANT: This relies on Auth.js session cookies - no headers needed.
 */
export async function fetchUserBusinessesWithUser(): Promise<FetchBusinessesResult> {
  const t0 = perfNow();
  // Send browser timezone to the server so first-login auto-created business gets correct tz.
  // Safe: if not in browser or timezone unavailable, don't send the header.
  let clientTimezone: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
      if (typeof tz === 'string' && tz.includes('/') && !/\s/.test(tz)) {
        clientTimezone = tz;
      }
    } catch {
      clientTimezone = null;
    }
  }

  // Fetch businesses - server will determine user from Auth.js session cookies
  const res = await fetch('/api/businesses', {
    method: 'GET',
    credentials: 'include', // Important: send cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...(clientTimezone ? { 'x-client-timezone': clientTimezone } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      console.log('[fetchUserBusinesses] Not authenticated');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[perf] /api/businesses ${Math.round(perfNow() - t0)}ms status=401`);
      }
      return { businesses: [], userId: null };
    }
    console.warn('[fetchUserBusinesses] Fetch failed:', res.status);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[perf] /api/businesses ${Math.round(perfNow() - t0)}ms status=${res.status}`);
    }
    return { businesses: [], userId: null };
  }

  const data = await res.json();
  const businesses = data?.businesses || [];
  const userId = data?.userId || null;
  
  console.log('[fetchUserBusinesses] Loaded', businesses.length, 'businesses for user', userId);
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[perf] /api/businesses ${Math.round(perfNow() - t0)}ms status=200 businesses=${businesses.length}`
    );
  }

  return { businesses, userId };
}

/**
 * Creates a new business for the current session user.
 * Requires Auth.js session (cookies).
 */
export async function createBusiness(name?: string): Promise<CreateBusinessResult> {
  try {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: typeof name === 'string' ? name : undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        userId: data?.userId ?? null,
        error: data?.error ?? `http_${res.status}`,
      };
    }

    return {
      ok: true,
      userId: data.userId ?? null,
      business: data.business,
    };
  } catch (e) {
    return { ok: false, userId: null, error: 'network_error' };
  }
}

/**
 * Fetches businesses owned by the currently logged-in user.
 * Returns just the businesses array for backwards compatibility.
 */
export async function fetchUserBusinesses(): Promise<Business[]> {
  const result = await fetchUserBusinessesWithUser();
  return result.businesses;
}

/**
 * Gets the active business ID from localStorage for a specific user.
 * Returns null if not set or if running on server.
 * 
 * @param userId - The user ID to look up the active business for
 */
export function getStoredActiveBusinessId(userId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // If userId provided, use user-specific key
    if (userId) {
      const userKey = `${ACTIVE_BUSINESS_KEY_PREFIX}:${userId}`;
      const stored = localStorage.getItem(userKey);
      if (stored) return stored;
    }
    
    // Fall back to global key (context-independent)
    const globalStored = localStorage.getItem(ACTIVE_BUSINESS_ID_STORAGE_KEY);
    if (globalStored) return globalStored;

    // Fall back to older legacy global key (for migration)
    return localStorage.getItem(ACTIVE_BUSINESS_KEY_PREFIX);
  } catch {
    return null;
  }
}

/**
 * Stores the active business ID in localStorage for a specific user.
 * 
 * @param userId - The user ID to store the active business for
 * @param businessId - The business ID to store, or null to clear
 */
export function setStoredActiveBusinessId(userId: string | null, businessId: string | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Always keep the global key in sync for low-level API clients.
    setActiveBusinessIdInStorage(businessId);

    if (userId && businessId) {
      const userKey = `${ACTIVE_BUSINESS_KEY_PREFIX}:${userId}`;
      localStorage.setItem(userKey, businessId);
      // Clean up legacy global key
      localStorage.removeItem(ACTIVE_BUSINESS_KEY_PREFIX);
    } else if (userId && !businessId) {
      // Clear user-specific key
      const userKey = `${ACTIVE_BUSINESS_KEY_PREFIX}:${userId}`;
      localStorage.removeItem(userKey);
    }
  } catch {
    // Ignore localStorage errors (e.g., private browsing)
  }
}

/**
 * Clears the stored active business ID for a user.
 */
export function clearStoredActiveBusinessId(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (userId) {
      const userKey = `${ACTIVE_BUSINESS_KEY_PREFIX}:${userId}`;
      localStorage.removeItem(userKey);
    }
    // Also clean up legacy global key
    localStorage.removeItem(ACTIVE_BUSINESS_KEY_PREFIX);
    // And clear the global key used by low-level clients
    setActiveBusinessIdInStorage(null);
  } catch {
    // Ignore errors
  }
}

/**
 * Selects the best business ID to use:
 * 1. If stored ID exists and is in the list, use it
 * 2. If only one business, use it
 * 3. If multiple, use the first one
 * 4. Return null if no businesses
 * 
 * @param businesses - Array of businesses owned by the user
 * @param storedId - Previously stored active business ID
 */
export function selectBestBusinessId(
  businesses: Business[],
  storedId: string | null
): string | null {
  if (!businesses.length) return null;

  // If stored ID exists and is valid (in the list), use it
  if (storedId && businesses.some((b) => b.id === storedId)) {
    return storedId;
  }

  // Otherwise, use the first business
  return businesses[0].id;
}
