"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Globe,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { importFromWebsite } from "../../lib/onboarding";
import {
  fetchUserBusinessesWithUser,
  getStoredActiveBusinessId,
  setStoredActiveBusinessId,
  clearStoredActiveBusinessId,
  selectBestBusinessId,
} from "../../lib/tenant";

export default function OnboardingPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [businessName, setBusinessName] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [userId, setUserId] = useState(null);
  const [emptyBusinesses, setEmptyBusinesses] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Subscription state - checked on page load
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  
  const navigate = useNavigate();

  // Fetch businesses and check subscription for the ACTIVE business
  useEffect(() => {
    const loadBusinessesAndSubscription = async () => {
      try {
        console.log('[onboarding] Starting load...');
        
        // Step 1: Fetch businesses - this also gives us the userId
        // Server determines user from Auth.js session cookies
        const { businesses, userId: sessionUserId } = await fetchUserBusinessesWithUser();
        
        console.log('[onboarding] Got', businesses.length, 'businesses, userId:', sessionUserId);
        
        // If no session, user needs to log in
        if (!sessionUserId) {
          console.log('[onboarding] No session - user needs to log in');
          setError('Přihlaste se prosím pro pokračování.');
          setSessionLoading(false);
          return;
        }
        
        setUserId(sessionUserId);

        // With race-safe auto-create on GET /api/businesses, this should be extremely rare.
        // If it happens, do NOT show a create button; just let the user retry.
        if (businesses.length === 0) {
          console.warn('[onboarding] businesses[] empty after /api/businesses; showing retry');
          setEmptyBusinesses(true);
          setSubscriptionChecked(true);
          setSessionLoading(false);
          return;
        }

        setEmptyBusinesses(false);
        
        // Step 2: Determine active business using user-specific localStorage
        const storedBusinessId = getStoredActiveBusinessId(sessionUserId);
        console.log('[onboarding] Stored business ID:', storedBusinessId);
        
        // Validate stored ID is in user's businesses and select best one
        const activeBusinessId = selectBestBusinessId(businesses, storedBusinessId);
        
        if (!activeBusinessId) {
          console.error('[onboarding] Could not determine active business');
          setError('Nepodařilo se vybrat aktivní podnik.');
          setSessionLoading(false);
          return;
        }
        
        // If stored ID was invalid or different, update localStorage
        if (storedBusinessId !== activeBusinessId) {
          console.log('[onboarding] Updating stored business ID:', activeBusinessId);
          setStoredActiveBusinessId(sessionUserId, activeBusinessId);
        }
        
        const activeBusiness = businesses.find(b => b.id === activeBusinessId);
        setBusinessId(activeBusinessId);
        setBusinessName(activeBusiness?.name || null);
        
        console.log('[onboarding] Active business:', activeBusinessId, activeBusiness?.name);
        
        // Step 3: Check subscription for the active business
        console.log('[onboarding] Checking subscription...');
        try {
          const subRes = await fetch(`/api/subscription?businessId=${activeBusinessId}`, {
            method: 'GET',
            credentials: 'include', // Send cookies for auth
          });
          
          console.log('[onboarding] Subscription response:', subRes.status);
          
          if (subRes.ok) {
            const subData = await subRes.json();
            console.log('[onboarding] Subscription data:', subData);
            
            if (subData.ok) {
              setIsSubscribed(subData.isSubscribed === true);
              if (subData.businessName) {
                setBusinessName(subData.businessName);
              }
            } else {
              console.warn('[onboarding] Subscription check returned error:', subData.error);
              setIsSubscribed(false);
            }
          } else if (subRes.status === 403) {
            // Business doesn't belong to user - clear stored ID
            console.error('[onboarding] Business ownership check failed');
            clearStoredActiveBusinessId(sessionUserId);
            setError('Nemáte oprávnění k tomuto podniku.');
            setIsSubscribed(false);
          } else if (subRes.status === 401) {
            console.error('[onboarding] Not authenticated');
            setError('Přihlaste se prosím pro pokračování.');
            setIsSubscribed(false);
          } else {
            console.warn('[onboarding] Subscription check failed:', subRes.status);
            setIsSubscribed(false);
          }
        } catch (e) {
          console.error('[onboarding] Subscription check error:', e);
          setIsSubscribed(false);
        }
        
        setSubscriptionChecked(true);
      } catch (err) {
        console.error('[onboarding] Load error:', err);
        setError('Nepodařilo se načíst data. Zkuste to prosím znovu.');
      } finally {
        setSessionLoading(false);
      }
    };
    
    loadBusinessesAndSubscription();
  }, [retryCount]);

  const handleRetry = () => {
    setError(null);
    setSuccessMessage(null);
    setSubscriptionRequired(false);
    setSubscriptionChecked(false);
    setSessionLoading(true);
    setRetryCount((c) => c + 1);
  };

  const handleCreateBusiness = async () => {
    if (!userId) {
      setError('Přihlaste se prosím pro pokračování.');
      return;
    }
    setCreatingBusiness(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await createBusiness();
      if (!result.ok || !result.business?.id) {
        setError('Nepodařilo se vytvořit podnik. Zkuste to prosím znovu.');
        return;
      }

      setHasBusinesses(true);
      setBusinessId(result.business.id);
      setBusinessName(result.business.name || null);
      setStoredActiveBusinessId(userId, result.business.id);

      // Newly created business is unsubscribed by default
      setIsSubscribed(result.business.isSubscribed === true);
      setSubscriptionChecked(true);
    } finally {
      setCreatingBusiness(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubscriptionRequired(false);

    if (!businessId) {
      setError('Nemáte přiřazený žádný podnik.');
      return;
    }

    // Double-check subscription before submitting
    if (!isSubscribed) {
      setSubscriptionRequired(true);
      setError('Pro analýzu webu je potřeba mít aktivní předplatné.');
      return;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Zadejte prosím URL vašeho webu.");
      return;
    }

    setLoading(true);
    try {
      console.log('[onboarding] Importing from website for business:', businessId);
      const result = await importFromWebsite(businessId, trimmed);
      if (!result.success) {
        // Check if subscription is required (server-side enforcement)
        if (result.subscriptionRequired) {
          setSubscriptionRequired(true);
          setIsSubscribed(false); // Update local state
        }
        setError(result.message_cs);
      } else {
        setSuccessMessage(result.message_cs);
      }
    } catch (err) {
      console.error("Onboarding import error:", err);
      setError("Něco se pokazilo. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] dark:from-[#0A0A0A] dark:to-[#1A1A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine if the import button should be disabled
  const isImportDisabled = loading || !isSubscribed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] dark:from-[#0A0A0A] dark:to-[#1A1A1A]">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="font-inter font-bold text-4xl text-[#111111] dark:text-white mb-3">
            Vítejte v IVA
          </h1>
          <p className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-70">
            Importujte informace z vašeho webu během pár sekund
          </p>
          {/* Show active business name */}
          {businessName && (
            <p className="mt-2 font-inter text-sm text-[#9CA3AF] dark:text-gray-400">
              Podnik: <span className="font-medium text-[#6B7280] dark:text-gray-300">{businessName}</span>
              {isSubscribed && <span className="ml-2 text-green-600 dark:text-green-400">✓ Předplaceno</span>}
            </p>
          )}
        </div>

        {/* Input Step */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-8 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <Globe size={24} className="text-[#5A5BFF] dark:text-[#6366FF]" />
            <h2 className="font-inter font-semibold text-xl text-[#111111] dark:text-white">
              Zadejte URL vašeho webu
            </h2>
          </div>

          {emptyBusinesses ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="font-inter text-sm text-amber-800 dark:text-amber-200">
                  Váš účet ještě nemá žádný podnik. Zkuste to prosím znovu — IVA ho vytvoří automaticky při prvním přihlášení.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-inter font-semibold text-base transition-all shadow-lg bg-[#5A5BFF] dark:bg-[#6366FF] text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95"
              >
                <span>Zkusit znovu</span>
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading || !isSubscribed}
              className="w-full px-4 py-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-base text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors disabled:opacity-50"
            />

            {/* General error message */}
            {error && !subscriptionChecked && (
              <div className="flex items-center space-x-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                <p className="font-inter text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Subscription paywall - shown when not subscribed */}
            {subscriptionChecked && !isSubscribed && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-3">
                  <Lock
                    size={24}
                    className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-inter font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Funkce vyžaduje předplatné
                    </p>
                    <p className="font-inter text-sm text-amber-700 dark:text-amber-300">
                      Pro automatickou analýzu webu pomocí AI je potřeba mít aktivní předplatné.
                      Můžete data zadat ručně v nastavení, nebo aktivovat předplatné.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard/platby")}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 dark:bg-amber-500 text-white font-inter font-medium text-sm hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
                      >
                        <Sparkles size={16} className="mr-2" />
                        Aktivovat předplatné
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard/nastaveni")}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 font-inter font-medium text-sm border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        Vyplnit ručně
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                {successMessage}
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/nastaveni")}
                  className="ml-4 text-emerald-800 dark:text-emerald-200 underline font-medium"
                >
                  Přejít do nastavení
                </button>
              </div>
            )}

            {/* Tip - only show if subscribed */}
            {isSubscribed && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="font-inter text-sm text-blue-900 dark:text-blue-200">
                  💡 <strong>Tip:</strong> IVA automaticky najde název, adresu,
                  telefon, služby a otevírací dobu z vašeho webu
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isImportDisabled}
              className={`w-full inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-inter font-semibold text-base transition-all shadow-lg disabled:cursor-not-allowed ${
                isSubscribed
                  ? 'bg-[#5A5BFF] dark:bg-[#6366FF] text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] active:scale-95 disabled:opacity-50'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Analyzuji web…</span>
                </>
              ) : !isSubscribed ? (
                <>
                  <Lock size={20} />
                  <span>Vyžaduje předplatné</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Analyzovat web pomocí AI</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard/nastaveni")}
              className="w-full px-6 py-3 rounded-xl bg-transparent text-[#6B7280] dark:text-white dark:text-opacity-70 font-inter font-medium text-sm hover:bg-[#F9FAFB] dark:hover:bg-[#0A0A0A] transition-colors"
            >
              Přeskočit a vyplnit ručně
            </button>
          </form>
          )}
        </div>

        {/* Debug info - visible in dev to help debug */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400">
            <div>User ID: {userId || 'not logged in'}</div>
            <div>Business ID: {businessId || 'null'}</div>
            <div>Business Name: {businessName || 'N/A'}</div>
            <div>Subscribed: {subscriptionChecked ? (isSubscribed ? 'true ✅' : 'false ❌') : 'checking...'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
