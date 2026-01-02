/**
 * Opening Hours API Client
 * 
 * This client connects to the IVA backend opening hours API.
 * 
 * API Contract (based on old dashboard implementation):
 * - GET /api/business_profile: Returns { openingHours: OpeningHour[] }
 *   - Headers: x-tenant-id (business ID UUID)
 *   - Response openingHours come from Supabase opening_hours table
 *   - Each item has: id, weekday ("mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun"), 
 *     opens_at ("HH:MM:SS" or "HH:MM"), closes_at ("HH:MM:SS" or "HH:MM"), business_id
 * 
 * - POST /api/business_profile: Saves opening hours array
 *   - Headers: x-tenant-id (business ID UUID)
 *   - Body: { openingHours: OpeningHourInput[] }
 *   - Backend upserts by business_id + weekday (onConflict: 'business_id,weekday')
 *   - If opens_at/closes_at are null, the day is treated as closed
 * 
 * Database fields (snake_case) map to camelCase in TypeScript:
 * - opens_at -> opensAt
 * - closes_at -> closesAt
 * - weekday stays as "mon"-"sun" (backend format)
 */

import { getActiveBusinessId } from './tenantId';
import { buildBackendUrl } from './backend';

const __perfLogged = new Set<string>();
const perfNow = () =>
  // eslint-disable-next-line no-restricted-globals
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
const logPerfOnce = (name: string, ms: number) => {
  if (process.env.NODE_ENV === 'production') return;
  if (__perfLogged.has(name)) return;
  __perfLogged.add(name);
  console.log(`[perf] ${name} ${Math.round(ms)}ms`);
};

// NOTE: Business ID is now passed dynamically to each function.
// Use the TenantContext (useTenant hook) to get the activeBusinessId.

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface OpeningHour {
  id: string;
  weekday: Weekday;
  opensAt: string | null; // "HH:MM" format (normalized from backend's "HH:MM:SS")
  closesAt: string | null; // "HH:MM" format (normalized from backend's "HH:MM:SS")
  closed: boolean; // Derived from null opensAt/closesAt
}

export interface OpeningHourInput {
  weekday: Weekday;
  opensAt: string | null; // "HH:MM" format
  closesAt: string | null; // "HH:MM" format
  closed?: boolean; // If true, opensAt/closesAt should be null
}

/**
 * Normalizes time from backend format ("HH:MM:SS" or "HH:MM") to "HH:MM"
 */
function normalizeTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  
  // Extract HH:MM from HH:MM:SS format if present
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5);
  }
  
  return trimmed;
}

/**
 * Converts "HH:MM" to backend format "HH:MM:SS"
 */
function toDbTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  
  // If already in HH:MM:SS format, return as is
  if (trimmed.length === 8 && trimmed.includes(':')) {
    return trimmed;
  }
  
  // If in HH:MM format, append :00
  if (trimmed.length === 5 && trimmed.match(/^\d{2}:\d{2}$/)) {
    return `${trimmed}:00`;
  }
  
  // Otherwise normalize first, then convert
  const normalized = normalizeTime(trimmed);
  if (!normalized) return null;
  return `${normalized}:00`;
}

/**
 * Maps backend opening hour (snake_case) to frontend OpeningHour (camelCase)
 */
function mapOpeningHour(backendHour: any): OpeningHour {
  const opensAt = normalizeTime(backendHour.opens_at);
  const closesAt = normalizeTime(backendHour.closes_at);
  
  // Determine if closed - check both null times and explicit closed flag
  const isClosed = backendHour.closed === true || (!opensAt && !closesAt);
  
  return {
    id: backendHour.id,
    weekday: backendHour.weekday,
    opensAt: isClosed ? null : opensAt,
    closesAt: isClosed ? null : closesAt,
    closed: isClosed,
  };
}

/**
 * Maps frontend OpeningHourInput to backend format (snake_case)
 */
function mapOpeningHourInput(input: OpeningHourInput): any {
  // If closed, send null times (this works even if DB has no 'closed' column)
  if (input.closed === true) {
    return {
      weekday: input.weekday,
      opens_at: null,
      closes_at: null,
      closed: true,
    };
  }
  return {
    weekday: input.weekday,
    opens_at: toDbTime(input.opensAt),
    closes_at: toDbTime(input.closesAt),
    closed: false,
  };
}

/**
 * Fetches all opening hours for the business
 * @param businessId - The business UUID (from TenantContext)
 */
export async function fetchOpeningHours(businessId: string): Promise<OpeningHour[]> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to fetch opening hours');
  }

  const url = buildBackendUrl('/api/business_profile');

  const t0 = perfNow();
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
  });
  logPerfOnce('openingHours.fetch', perfNow() - t0);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při načítání otevírací doby.');
  }

  const data = await res.json();
  const openingHours = data.openingHours || [];

  // Map to frontend format
  return openingHours.map(mapOpeningHour);
}

/**
 * Updates opening hours (saves all days at once)
 * The backend upserts by business_id + weekday, so we send all days
 * @param businessId - The business UUID (from TenantContext)
 * @param hours - Array of opening hours to save
 */
export async function updateOpeningHours(
  businessId: string,
  hours: OpeningHourInput[]
): Promise<OpeningHour[]> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to update opening hours');
  }

  // Convert to backend format
  const openingHoursArray = hours.map(mapOpeningHourInput);

  const url = buildBackendUrl('/api/business_profile');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      openingHours: openingHoursArray,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from POST /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při ukládání otevírací doby.');
  }

  // Fetch updated opening hours and return
  return await fetchOpeningHours(resolvedBusinessId);
}

/**
 * Updates a single opening hour day
 * Convenience function that fetches current hours, updates one day, and saves all
 * @param businessId - The business UUID (from TenantContext)
 * @param weekday - Day of the week to update
 * @param input - Opening hours data for the day
 */
export async function updateOpeningHour(
  businessId: string,
  weekday: Weekday,
  input: {
    opensAt: string | null;
    closesAt: string | null;
    closed: boolean;
  }
): Promise<OpeningHour[]> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to update opening hour');
  }

  // Fetch current hours
  const currentHours = await fetchOpeningHours(resolvedBusinessId);
  
  // Find and update the specific day, or add it if it doesn't exist
  const updatedHours = currentHours.map((hour) => {
    if (hour.weekday === weekday) {
      return {
        weekday,
        opensAt: input.closed ? null : input.opensAt,
        closesAt: input.closed ? null : input.closesAt,
        closed: input.closed,
      };
    }
    return {
      weekday: hour.weekday,
      opensAt: hour.opensAt,
      closesAt: hour.closesAt,
      closed: hour.closed,
    };
  });
  
  // If the day doesn't exist, add it
  const dayExists = currentHours.some((h) => h.weekday === weekday);
  if (!dayExists) {
    updatedHours.push({
      weekday,
      opensAt: input.closed ? null : input.opensAt,
      closesAt: input.closed ? null : input.closesAt,
      closed: input.closed,
    });
  }
  
  return await updateOpeningHours(resolvedBusinessId, updatedHours);
}

