import { getActiveBusinessId } from './tenantId';

const RAW_BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ??
  import.meta.env.VITE_IVA_BACKEND_URL ??
  '';

export const BACKEND_BASE_URL = RAW_BACKEND_BASE_URL.replace(/\/$/, '');

function ensureLeadingSlash(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function serializeParams(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function buildBackendUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const cleanPath = ensureLeadingSlash(path);
  if (BACKEND_BASE_URL) {
    return `${BACKEND_BASE_URL}${cleanPath}${serializeParams(params)}`;
  }
  return `${cleanPath}${serializeParams(params)}`;
}


const __perfLogged = new Set<string>();
function perfNow(): number {
  // eslint-disable-next-line no-restricted-globals
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function logPerfOnce(name: string, ms: number) {
  if (process.env.NODE_ENV === 'production') return;
  if (__perfLogged.has(name)) return;
  __perfLogged.add(name);
  console.log(`[perf] ${name} ${Math.round(ms)}ms`);
}

export type BookingStatusFilter =
  | 'all'
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled';

export interface Booking {
  id: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  serviceName: string;
  customerName: string;
  customerPhone: string;
  locationName: string;
  durationMinutes: number | null;
  status: string;
  calendarEventId?: string | null;
  originalDate?: string | null;
}

function mapBooking(b: any): Booking {
  return {
    id: b.id,
    date: b.date,
    time: (b.time ?? '').slice(0, 5),
    serviceName: b.serviceName ?? b.service_slug ?? '',
    customerName: b.customerName ?? b.client_name ?? '',
    customerPhone: b.customerPhone ?? b.client_phone ?? '',
    locationName: b.locationName ?? b.location ?? '',
    durationMinutes: b.durationMinutes ?? b.duration_minutes ?? null,
    status: b.status ?? 'confirmed',
    calendarEventId: b.calendarEventId ?? b.calendar_event_id ?? null,
    originalDate: b.originalDate ?? b.original_date ?? null,
  };
}

export async function fetchBookings(params: {
  businessId: string;
  from: string;
  to: string;
  status: BookingStatusFilter;
}): Promise<Booking[]> {
  // Allow callers to omit businessId and fall back to the active tenant from storage.
  // This keeps "1 business" users working without threading IDs everywhere.
  const resolvedBusinessId = params.businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Missing businessId for fetchBookings');
  }

  const url = buildBackendUrl('/api/bookings', {
    from: params.from,
    to: params.to,
    status: params.status,
  });

  const t0 = perfNow();
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
  });
  logPerfOnce('bookings.fetch', perfNow() - t0);

  const data = await res.json();
  if (!res.ok || data?.error) {
    console.error('Backend error from /api/bookings:', data);
    throw new Error(data?.message_cs || 'Chyba při načítání rezervací.');
  }

  return (data.bookings ?? []).map(mapBooking);
}

export async function createBooking(body: {
  businessId: string;
  serviceName: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  locationName?: string;
  notes?: string;
}) {
  const resolvedBusinessId = body.businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Missing businessId for createBooking');
  }

  const t0 = perfNow();
  const res = await fetch(buildBackendUrl('/api/vapi/book_appointment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({ ...body, businessId: resolvedBusinessId }),
  });
  logPerfOnce('bookings.create', perfNow() - t0);
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    console.error('Backend error from book_appointment:', data);
    throw new Error(data?.message_cs || 'Chyba při vytváření rezervace.');
  }
  return data;
}

export async function updateBooking(body: {
  businessId: string;
  bookingId: string;
  action: 'cancel' | 'reschedule';
  date?: string;
  time?: string;
}) {
  const resolvedBusinessId = body.businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    throw new Error('Missing businessId for updateBooking');
  }

  const t0 = perfNow();
  const res = await fetch(buildBackendUrl('/api/vapi/update_appointment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolvedBusinessId,
    },
    body: JSON.stringify({
      businessId: resolvedBusinessId,
      bookingId: body.bookingId,
      action: body.action,
      date: body.date ?? '',
      time: body.time ?? '',
    }),
  });
  logPerfOnce('bookings.update', perfNow() - t0);
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    console.error('Backend error from update_appointment:', data);
    throw new Error(data?.message_cs || 'Chyba při úpravě rezervace.');
  }
  return data;
}
