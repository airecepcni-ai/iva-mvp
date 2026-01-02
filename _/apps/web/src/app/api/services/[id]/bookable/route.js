/**
 * PATCH /api/services/[id]/bookable
 * 
 * Toggles the is_bookable flag for a service.
 * Forwards the request to the IVA backend.
 * 
 * NOTE: In production, set IVA_BACKEND_URL env var.
 * The DEFAULT_BUSINESS_ID is only used if no x-tenant-id header is provided.
 */
import { auth } from "../../../../../auth.js";

const RAW_BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ||
  process.env.IVA_BACKEND_URL ||
  '';
const BACKEND_BASE_URL = RAW_BACKEND_BASE_URL.replace(/\/$/, '');

function buildBackendUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!BACKEND_BASE_URL) {
    return cleanPath;
  }
  return `${BACKEND_BASE_URL}${cleanPath}`;
}

// Default business ID fallback (legacy support)
const DEFAULT_BUSINESS_ID = process.env.DEFAULT_BUSINESS_ID || null;

export async function PATCH(request, { params }) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { isBookable, businessId } = body;

    if (typeof isBookable !== 'boolean') {
      return Response.json(
        { error: 'isBookable must be a boolean' },
        { status: 400 }
      );
    }

    // Get business ID from body, headers, or fallback
    const tenantId = businessId || request.headers.get('x-tenant-id') || DEFAULT_BUSINESS_ID;
    if (!tenantId) {
      return Response.json(
        { error: 'Missing business ID (x-tenant-id header or businessId in body)' },
        { status: 400 }
      );
    }

    // Forward to IVA backend
    const backendUrl = buildBackendUrl(`/api/services/${id}`);
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify({ isBookable }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: data.message || data.error || 'Chyba při úpravě služby',
          code: data.code,
        },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('PATCH /api/services/[id]/bookable error:', error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

