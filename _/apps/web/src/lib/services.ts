/**
 * Services API Client
 * 
 * This client connects to the IVA backend services API.
 * 
 * API Contract (based on old dashboard implementation):
 * - GET /api/business_profile: Returns { services: Service[] } where services come from Supabase services table
 *   - Headers: x-tenant-id (business ID UUID)
 *   - Response services have: id, name, slug, duration_minutes, price_from, price_to, is_active
 * 
 * - POST /api/business_profile: Saves services array
 *   - Headers: x-tenant-id (business ID UUID)
 *   - Body: { services: ServiceInput[] }
 *   - ServiceInput with id: updates existing service
 *   - ServiceInput without id but with name: creates new service
 *   - To delete: set is_active: false
 * 
 * Database fields (snake_case) map to camelCase in TypeScript:
 * - duration_minutes -> durationMinutes
 * - price_from -> priceFrom
 * - price_to -> priceTo
 * - is_active -> isActive
 * - is_core -> isCore (optional, used for core services)
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

export interface Service {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMinutes: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  isActive: boolean;
  isBookable?: boolean;
  isCore?: boolean;
}

export type ServiceInput = {
  id?: string; // If provided, updates existing service
  name?: string;
  slug?: string | null;
  description?: string | null;
  durationMinutes?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  isActive?: boolean;
  isBookable?: boolean;
};

/**
 * Maps backend service (snake_case) to frontend Service (camelCase)
 */
function mapService(backendService: any): Service {
  return {
    id: backendService.id,
    name: backendService.name || '',
    slug: backendService.slug ?? null,
    description: backendService.description ?? null,
    durationMinutes: backendService.duration_minutes ?? null,
    priceFrom: backendService.price_from ?? null,
    priceTo: backendService.price_to ?? null,
    isActive: backendService.is_active !== false,
    isBookable: backendService.is_bookable === true,
    isCore: backendService.is_core || false,
  };
}

/**
 * Maps frontend ServiceInput to backend format (snake_case)
 */
function mapServiceInput(input: ServiceInput): any {
  const backend: any = {};

  if (input.id !== undefined) backend.id = input.id;

  if (input.name !== undefined) backend.name = input.name;

  if (input.slug !== undefined) backend.slug = input.slug;

  if (input.description !== undefined) backend.description = input.description;

  if (input.durationMinutes !== undefined) backend.duration_minutes = input.durationMinutes;

  if (input.priceFrom !== undefined) backend.price_from = input.priceFrom;

  if (input.priceTo !== undefined) backend.price_to = input.priceTo;

  if (input.isActive !== undefined) backend.is_active = input.isActive;

  if (input.isBookable !== undefined) backend.is_bookable = input.isBookable;

  return backend;
}

/**
 * Fetches all active services for the business
 * @param businessId - The business UUID (from TenantContext)
 */
export async function fetchServices(businessId: string): Promise<Service[]> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to fetch services');
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
  logPerfOnce('services.fetch', perfNow() - t0);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při načítání služeb.');
  }

  const data = await res.json();
  const services = data.services || [];

  // Filter to only active services and map to frontend format
  return services
    .filter((s: any) => s.is_active !== false)
    .map(mapService);
}

/**
 * Creates a new service
 * @param businessId - The business UUID (from TenantContext)
 * @param input - Service data to create
 */
export async function createService(businessId: string, input: ServiceInput): Promise<Service> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to create a service');
  }

  // First, fetch current services
  const currentServices = await fetchServices(resolvedBusinessId);

  // Add new service (without id, backend will create it)
  const newServiceInput = mapServiceInput({
    ...input,
    isActive: input.isActive !== false,
    // Always include is_bookable in payload for new service
    isBookable: input.isBookable ?? false,
  });

  // Convert all services to backend format, including the new one
  const servicesArray = [
    ...currentServices.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      duration_minutes: s.durationMinutes,
      price_from: s.priceFrom,
      price_to: s.priceTo,
      is_active: s.isActive,
      is_bookable: s.isBookable === true,
    })),
    newServiceInput,
  ];

  const url = buildBackendUrl('/api/business_profile');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      services: servicesArray,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from POST /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při vytváření služby.');
  }

  // Fetch updated services and return the newly created one
  // (backend doesn't return the created service, so we fetch again)
  const updatedServices = await fetchServices(resolvedBusinessId);
  const created = updatedServices.find(
    (s) => s.name === input.name && !currentServices.find((cs) => cs.id === s.id)
  );

  if (!created) {
    throw new Error('Služba byla vytvořena, ale nepodařilo se ji načíst.');
  }

  return created;
}

/**
 * Updates an existing service
 * @param businessId - The business UUID (from TenantContext)
 * @param id - Service ID to update
 * @param input - Service data to update
 */
export async function updateService(businessId: string, id: string, input: ServiceInput): Promise<Service> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to update a service');
  }

  // First, fetch current services
  const currentServices = await fetchServices(resolvedBusinessId);

  // Find the service to update
  const existingService = currentServices.find((s) => s.id === id);
  if (!existingService) {
    throw new Error(`Služba s ID ${id} nebyla nalezena.`);
  }

  // Merge existing data with updates
  const updatedServiceInput = mapServiceInput({
    id,
    name: input.name ?? existingService.name,
    slug: input.slug !== undefined ? input.slug : existingService.slug,
    description: input.description !== undefined ? input.description : existingService.description,
    durationMinutes: input.durationMinutes !== undefined ? input.durationMinutes : existingService.durationMinutes,
    priceFrom: input.priceFrom !== undefined ? input.priceFrom : existingService.priceFrom,
    priceTo: input.priceTo !== undefined ? input.priceTo : existingService.priceTo,
    isActive: input.isActive !== undefined ? input.isActive : existingService.isActive,
    isBookable: input.isBookable !== undefined ? input.isBookable : existingService.isBookable ?? false,
  });

  // Convert all services to backend format, with the updated one
  const servicesArray = currentServices.map((s) => {
    if (s.id === id) {
      return updatedServiceInput;
    }
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      duration_minutes: s.durationMinutes,
      price_from: s.priceFrom,
      price_to: s.priceTo,
      is_active: s.isActive,
      is_bookable: s.isBookable === true,
    };
  });

  const url = buildBackendUrl('/api/business_profile');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      services: servicesArray,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from POST /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při úpravě služby.');
  }

  // Fetch updated services and return the updated one
  const updatedServices = await fetchServices(resolvedBusinessId);
  const updated = updatedServices.find((s) => s.id === id);

  if (!updated) {
    throw new Error('Služba byla upravena, ale nepodařilo se ji načíst.');
  }

  return updated;
}

/**
 * Deletes a service by setting is_active to false
 * @param businessId - The business UUID (from TenantContext)
 * @param id - Service ID to delete
 */
export async function deleteService(businessId: string, id: string): Promise<void> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to delete a service');
  }

  // Fetch the service first to get its name
  const currentServices = await fetchServices(resolvedBusinessId);
  const service = currentServices.find((s) => s.id === id);
  if (!service) {
    throw new Error(`Služba s ID ${id} nebyla nalezena.`);
  }
  await updateService(resolvedBusinessId, id, { name: service.name, isActive: false });
}

/**
 * Bulk-save services in a single request (avoids races from parallel updateService calls).
 * Sends the full services list to POST /api/business_profile in backend (snake_case).
 * @param businessId - The business UUID (from TenantContext)
 * @param updatedServices - Full list of services to save
 */
export async function saveServicesBulk(businessId: string, updatedServices: Service[]): Promise<Service[]> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Business ID is required to save services');
  }

  const servicesArray = (updatedServices || []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug ?? null,
    description: s.description ?? null,
    duration_minutes: s.durationMinutes ?? null,
    price_from: s.priceFrom ?? null,
    price_to: s.priceTo ?? null,
    is_active: s.isActive !== false,
    is_bookable: s.isBookable === true,
  }));

  const url = buildBackendUrl('/api/business_profile');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      services: servicesArray,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Backend error from POST /api/business_profile:', errorData);
    throw new Error(errorData?.error || 'Chyba při ukládání služeb.');
  }

  // Backend doesn't reliably return updated services, so re-fetch the canonical state.
  return fetchServices(resolvedBusinessId);
}

/**
 * Toggles the is_bookable flag for a service
 * @param businessId - The business UUID (from TenantContext)
 * @param id - Service ID to toggle
 * @param isBookable - New bookable state
 */
export async function toggleServiceBookable(businessId: string, id: string, isBookable: boolean): Promise<Service> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  return updateService(resolvedBusinessId, id, { isBookable });
}


