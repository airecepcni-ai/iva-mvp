/**
 * Business Profile & IVA Settings API Client
 * 
 * This client connects to the IVA backend business profile API.
 * 
 * API Contract (based on old dashboard implementation in iva-web):
 * 
 * === Business Profile ===
 * 
 * GET /api/business_profile (IVA backend)
 *   - Headers: x-tenant-id (business ID UUID, e.g., "<business-uuid>")
 *   - Response: {
 *       profile: {
 *         id: string,
 *         business_id: string,
 *         name: string,
 *         address: string | null,
 *         phone: string | null,
 *         email: string | null,
 *         website_url: string | null,
 *         instagram_url: string | null,
 *         notes: string | null
 *       },
 *       openingHours: Array<{ weekday, opens_at, closes_at }>,
 *       services: Array<{ id, name, duration_minutes, price_from, ... }>,
 *       locations: Array<{ name, address, phone }>
 *     }
 *   - Error response: { error: string } or { message_cs: string }
 * 
 * POST /api/business_profile (IVA backend)
 *   - Headers: x-tenant-id (business ID UUID)
 *   - Body: {
 *       profile: {
 *         name?: string,
 *         address?: string | null,
 *         phone?: string | null,
 *         email?: string | null,
 *         website_url?: string | null,
 *         instagram_url?: string | null,
 *         notes?: string | null
 *       },
 *       openingHours?: Array<{ weekday, opens_at, closes_at }>,
 *       services?: Array<{ id?, name, duration_minutes, ... }>,
 *       locations?: Array<{ name, address, phone }>
 *     }
 *   - Response: { success: true, message: "Profile saved successfully" }
 *   - Error response: { error: string }
 *   - Backend upserts business_profile by business_id
 * 
 * === IVA Settings ===
 * 
 * GET /api/iva-settings (Next.js API route)
 *   - Checks if iva_settings row exists for business_id
 *   - Response: { businessId: string, ivaEnabled: boolean }
 *   - If iva_settings row exists → ivaEnabled = true
 *   - If no row exists → ivaEnabled = false
 * 
 * POST /api/iva-settings (Next.js API route)
 *   - Body: { ivaEnabled: boolean }
 *   - If ivaEnabled = true: Creates/ensures iva_settings row exists
 *   - If ivaEnabled = false: Deletes iva_settings row
 *   - Response: { businessId: string, ivaEnabled: boolean }
 * 
 * Database fields (snake_case) map to camelCase in TypeScript:
 * - website_url -> websiteUrl
 * - instagram_url -> instagramUrl
 * - business_id -> businessId
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

export interface BusinessProfile {
  id: string;
  businessId: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  notes: string | null;
}

export interface IvaSettings {
  businessId: string;
  ivaEnabled: boolean; // Derived from existence of iva_settings row
  // Add other simple scalar fields that the new UI already exposes
  // For now, just the enabled flag
}

export interface BusinessSettings {
  // profile can be null when backend has no business_profile row yet (non-fatal state)
  profile: BusinessProfile | null;
  iva: IvaSettings;
}

/**
 * Maps backend profile (snake_case) to frontend BusinessProfile (camelCase)
 */
function mapProfile(backendProfile: any): BusinessProfile {
  return {
    id: backendProfile.id || backendProfile.business_id,
    businessId: backendProfile.business_id,
    name: backendProfile.name || '',
    address: backendProfile.address || null,
    phone: backendProfile.phone || null,
    email: backendProfile.email || null,
    websiteUrl: backendProfile.website_url || null,
    instagramUrl: backendProfile.instagram_url || null,
    notes: backendProfile.notes || null,
  };
}

/**
 * Maps frontend BusinessProfile to backend format (snake_case)
 */
function mapProfileInput(input: Partial<BusinessProfile>): any {
  const backendProfile: any = {};
  
  if (input.name !== undefined) {
    backendProfile.name = input.name || null;
  }
  if (input.address !== undefined) {
    backendProfile.address = input.address || null;
  }
  if (input.phone !== undefined) {
    backendProfile.phone = input.phone || null;
  }
  if (input.email !== undefined) {
    backendProfile.email = input.email || null;
  }
  if (input.websiteUrl !== undefined) {
    backendProfile.website_url = input.websiteUrl || null;
  }
  if (input.instagramUrl !== undefined) {
    backendProfile.instagram_url = input.instagramUrl || null;
  }
  if (input.notes !== undefined) {
    backendProfile.notes = input.notes || null;
  }
  
  return backendProfile;
}

/**
 * Fetches business profile and IVA settings
 * 
 * Business profile comes from backend API.
 * IVA settings are fetched from Next.js API route that queries Supabase.
 * 
 * @param businessId - The business UUID (from TenantContext)
 */
export async function fetchBusinessSettings(businessId: string): Promise<BusinessSettings> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to fetch business settings');
  }

  // Fetch business profile from backend
  const url = buildBackendUrl('/api/business_profile');

  const t0 = perfNow();
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
  });
  logPerfOnce('businessProfile.fetch', perfNow() - t0);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from /api/business_profile:', errorData);
    throw new Error(errorData?.error || errorData?.message_cs || 'Chyba při načítání nastavení podniku.');
  }

  const data = await res.json();
  console.log("fetchBusinessSettings raw:", data);

  // Be defensive when mapping the response
  const profileRaw =
    data?.profile ??
    data?.businessProfile ??
    data?.business ??
    data?.business_profile ??
    null;

  const locationsRaw = Array.isArray(data?.locations) ? data.locations : [];
  const primaryLocation = locationsRaw[0] ?? null;

  const ivaRaw =
    data?.iva ??
    data?.ivaSettings ??
    data?.settings ??
    data?.iva_settings ??
    null;

  // Map to our internal types, preferring primary location for address/phone.
  // IMPORTANT: If business_profile is missing (profileRaw is null), treat it as a non-fatal state.
  const profile: BusinessProfile | null = profileRaw
    ? {
        id: profileRaw.id ?? profileRaw.business_id ?? "",
        businessId: profileRaw.business_id ?? businessId,
        name: profileRaw.name ?? "",
        address:
          primaryLocation?.address ??
          primaryLocation?.street ??
          profileRaw?.address ??
          null,
        phone:
          primaryLocation?.phone ??
          profileRaw?.phone ??
          profileRaw?.phone_number ??
          profileRaw?.telephone ??
          null,
        email: profileRaw.email ?? null,
        websiteUrl:
          profileRaw.website_url ??
          profileRaw.website ??
          profileRaw.web ??
          null,
        instagramUrl: profileRaw.instagram_url ?? null,
        notes: profileRaw.notes ?? null,
      }
    : null;

  // Fetch IVA settings from Next.js API route
  // Make failures non-fatal - just log and use default
  let ivaEnabled = false;
  try {
    const ivaRes = await fetch(`/api/iva-settings?businessId=${businessId}`);
    if (ivaRes.ok) {
      const contentType = ivaRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const ivaData = await ivaRes.json();
        ivaEnabled = ivaData.ivaEnabled || false;
      } else {
        console.warn('IVA settings endpoint returned non-JSON response');
      }
    }
  } catch (err) {
    // Non-fatal: just log and continue with default
    console.warn('Could not check IVA settings:', err);
    ivaEnabled = false;
  }

  const iva = {
    businessId:
      ivaRaw?.business_id ??
      ivaRaw?.businessId ??
      profile?.businessId ??
      businessId,
    ivaEnabled:
      ivaRaw?.ivaEnabled ??
      ivaRaw?.enabled ??
      (ivaRaw?.status === "active") ??
      ivaEnabled,
  };

  return { profile, iva };
}

/**
 * Updates business profile
 * 
 * @param businessId - The business UUID (from TenantContext)
 * @param input - Profile fields to update
 */
export async function updateBusinessProfile(
  businessId: string,
  input: Partial<BusinessProfile>
): Promise<BusinessProfile> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to update business profile');
  }

  const profileData = mapProfileInput(input);

  const url = buildBackendUrl('/api/business_profile');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      profile: profileData,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from POST /api/business_profile:', errorData);
    throw new Error(errorData?.error || errorData?.message_cs || 'Chyba při ukládání profilu podniku.');
  }

  const responseData = await res.json();
  
  // Backend returns { success: true, message: ... }, so we need to refetch
  const updated = await fetchBusinessSettings(resolvedBusinessId);
  if (!updated.profile) {
    throw new Error("Profil firmy se nepodařilo načíst po uložení.");
  }
  return updated.profile;
}

/**
 * Updates IVA settings
 * 
 * Uses Next.js API route that queries/updates Supabase iva_settings table.
 * 
 * @param businessId - The business UUID (from TenantContext)
 * @param input - IVA settings to update
 */
export async function updateIvaSettings(
  businessId: string,
  input: Partial<IvaSettings>
): Promise<IvaSettings> {
  if (!businessId) {
    throw new Error('Business ID is required to update IVA settings');
  }

  if (input.ivaEnabled === undefined) {
    // No changes to IVA enabled status
    const current = await fetchBusinessSettings(businessId);
    return current.iva;
  }

  const res = await fetch('/api/iva-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessId,
      ivaEnabled: input.ivaEnabled,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Error updating IVA settings:', errorData);
    throw new Error(errorData?.error || 'Chyba při ukládání IVA nastavení.');
  }

  const data = await res.json();
  return {
    businessId,
    ivaEnabled: data.ivaEnabled || false,
  };
}

