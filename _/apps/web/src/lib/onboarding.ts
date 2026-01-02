import { getActiveBusinessId } from './tenantId';
import { buildBackendUrl } from './backend';

// NOTE: Business ID is now passed dynamically to each function.
// Use the TenantContext (useTenant hook) to get the activeBusinessId.

export interface ImportFromWebsiteResult {
  success: boolean;
  message_cs: string;
  error?: string;
  subscriptionRequired?: boolean;
}

export async function importFromWebsite(businessId: string, url: string): Promise<ImportFromWebsiteResult> {
  const resolvedBusinessId = businessId || getActiveBusinessId() || '';
  if (!resolvedBusinessId) {
    return {
      success: false,
      message_cs: 'Není vybrán žádný podnik. Přihlaste se znovu.',
      error: 'No business ID provided',
    };
  }

  // trim, basic check
  const finalUrl = url.trim();

  const res = await fetch(buildBackendUrl('/api/onboarding/import_from_web'), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": resolvedBusinessId,
    },
    body: JSON.stringify({
      businessId: resolvedBusinessId,
      url: finalUrl,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    // Check for subscription_required error (HTTP 402)
    if (res.status === 402 || data?.error === 'subscription_required') {
      return {
        success: false,
        message_cs: data?.message_cs || 'Pro analýzu webu je potřeba mít aktivní předplatné.',
        error: 'subscription_required',
        subscriptionRequired: true,
      };
    }
    
    const message =
      data?.message_cs ||
      "Nepodařilo se načíst data z webu. Zkuste to prosím znovu.";
    return { success: false, message_cs: message, error: data?.error };
  }

  return {
    success: true,
    message_cs:
      data.message_cs ||
      "Data z webu byla úspěšně načtena a uložena.",
  };
}

