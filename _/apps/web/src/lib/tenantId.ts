/**
 * Single source of truth for the "active business id" outside React context.
 *
 * We intentionally read from localStorage so low-level API clients (services,
 * openingHours, IVA backend calls) can attach `x-tenant-id` without requiring
 * every caller to thread businessId through props.
 *
 * Storage key: `iva.activeBusinessId`
 *
 * Safe in non-browser contexts: returns null when `window` is undefined.
 */
export const ACTIVE_BUSINESS_ID_STORAGE_KEY = 'iva.activeBusinessId';

export function getActiveBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(ACTIVE_BUSINESS_ID_STORAGE_KEY);
    return v && typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

export function setActiveBusinessIdInStorage(businessId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (businessId) {
      window.localStorage.setItem(ACTIVE_BUSINESS_ID_STORAGE_KEY, businessId);
    } else {
      window.localStorage.removeItem(ACTIVE_BUSINESS_ID_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}


