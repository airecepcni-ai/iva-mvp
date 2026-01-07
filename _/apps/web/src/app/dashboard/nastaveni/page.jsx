"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  Building2,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  fetchBusinessSettings,
  updateBusinessProfile,
  updateIvaSettings,
} from "@/lib/business";
import { useTenant } from "@/lib/TenantContext";

/**
 * Info banner shown when user has no business yet.
 */
function NoBusinessBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-inter text-sm font-medium text-amber-800 dark:text-amber-200">
          Zatím nemáte nastavený salon
        </p>
        <p className="font-inter text-xs text-amber-700 dark:text-amber-300 mt-1">
          Můžete prozkoumat rozhraní. Data se uloží až po zaplacení předplatného.
        </p>
      </div>
    </div>
  );
}

const DEBUG_SUBSCRIPTION = typeof window !== 'undefined' && 
  (window.location.search.includes('debug=1') || localStorage.getItem('DEBUG_SUBSCRIPTION') === 'true');

export default function SettingsPage() {
  const { activeBusinessId, activeBusiness, loading: tenantLoading, hasBusiness } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ivaSettings, setIvaSettings] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  
  // Canonical subscription from TenantContext (from /api/businesses)
  const isSubscribed = activeBusiness?.isSubscribed ?? activeBusiness?.is_subscribed ?? subscription?.isSubscribed ?? false;
  
  // Debug logging for subscription state
  useEffect(() => {
    if (DEBUG_SUBSCRIPTION && activeBusiness) {
      console.log('[Nastavení] Subscription debug:', {
        businessId: activeBusinessId,
        'activeBusiness.isSubscribed': activeBusiness?.isSubscribed,
        'activeBusiness.is_subscribed': activeBusiness?.is_subscribed,
        'subscription?.isSubscribed': subscription?.isSubscribed,
        'computed isSubscribed': isSubscribed,
        source: activeBusiness?.isSubscribed !== undefined ? '/api/businesses' : '/api/business_profile',
      });
    }
  }, [activeBusiness, subscription, activeBusinessId, isSubscribed]);

  const loadSettings = useCallback(async () => {
    // If no business, show empty form with defaults
    if (!activeBusinessId) {
      setLoading(false);
      setProfile({
        name: '',
        address: '',
        phone: '',
        email: '',
        websiteUrl: '',
      });
      setIvaSettings({
        ivaEnabled: false,
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const settings = await fetchBusinessSettings(activeBusinessId);
      console.log("fetchBusinessSettings result:", settings);
      const missing = !settings.profile;
      setProfileMissing(missing);
      setProfile(
        settings.profile || {
          // Default empty form when business_profile is missing
          name: "",
          address: "",
          phone: "",
          email: "",
          websiteUrl: "",
          instagramUrl: "",
          notes: "",
        }
      );
      setIvaSettings(settings.iva);
      setSubscription(settings.subscription || null);
    } catch (err) {
      console.error("Error fetching business settings:", err);
      setError(err?.message || "Nepodařilo se načíst nastavení podniku.");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  // Fetch when tenant is ready
  useEffect(() => {
    if (!tenantLoading) {
      loadSettings();
    }
  }, [tenantLoading, activeBusinessId, loadSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile || !ivaSettings || !activeBusinessId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Update business profile
      await updateBusinessProfile(activeBusinessId, {
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        websiteUrl: profile.websiteUrl,
      });

      // Update IVA settings if changed
      // Note: Currently IVA settings are read-only in the UI, but we can add a toggle later
      // await updateIvaSettings(activeBusinessId, { ivaEnabled: ivaSettings.ivaEnabled });

      setSuccessMessage("Změny byly úspěšně uloženy!");
      
      // Refetch to sync state
      const updated = await fetchBusinessSettings(activeBusinessId);
      setProfile(updated.profile);
      setIvaSettings(updated.iva);
      setSubscription(updated.subscription || null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err?.message || "Nepodařilo se uložit nastavení");
    } finally {
      setSaving(false);
    }
  };

  const handleIvaToggle = async (enabled) => {
    if (!ivaSettings || !activeBusinessId) return;

    try {
      setError(null);
      const updated = await updateIvaSettings(activeBusinessId, { ivaEnabled: enabled });
      setIvaSettings(updated);
      setSuccessMessage(`IVA asistentka byla ${enabled ? "zapnuta" : "vypnuta"}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating IVA settings:", err);
      setError(err?.message || "Nepodařilo se změnit stav IVA");
    }
  };

  // Show spinner only during initial tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show spinner only while settings are being fetched (real loading)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // After loading completes, ALWAYS render the full UI (even with no business)

  return (
    <>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white">
              Nastavení podniku
            </h1>
            <a
              href="/onboarding"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] text-white font-inter font-medium text-sm hover:opacity-90 transition-all active:scale-95 shadow-md"
            >
              <Sparkles size={16} />
              <span>Importovat z webu</span>
            </a>
          </div>
          <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
            Spravujte základní informace o vašem salonu
          </p>
        </div>

        {/* No business info banner */}
        {!hasBusiness && <NoBusinessBanner />}

        {/* business_profile missing banner (non-fatal) - only show if not subscribed */}
        {hasBusiness && profileMissing && !isSubscribed && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-inter text-sm font-medium text-amber-800 dark:text-amber-200">
                Zatím nemáte nastavený salon
              </p>
              <p className="font-inter text-xs text-amber-700 dark:text-amber-300 mt-1">
                Můžete prozkoumat rozhraní. Data se uloží až po zaplacení předplatného.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="font-inter text-sm text-red-900 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
                Načítám nastavení…
              </p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        {!loading && (
          <div className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Info Card */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#5A5BFF]/10 dark:bg-[#6366FF]/20 flex items-center justify-center">
                <Building2
                  size={20}
                  className="text-[#5A5BFF] dark:text-[#6366FF]"
                />
              </div>
              <h2 className="font-inter font-semibold text-xl text-[#111111] dark:text-white">
                Základní informace
              </h2>
            </div>

            <div className="space-y-5">
              {/* Salon Name */}
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Název salonu
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Building2
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={profile?.name ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
                    placeholder="např. Salon Krásy"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Adresa
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MapPin
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                    />
                  </div>
                  <input
                    type="text"
                    value={profile?.address ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, address: e.target.value || null }))
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
                    placeholder="např. Hlavní 123, Praha 1"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Telefonní číslo
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Phone
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                    />
                  </div>
                  <input
                    type="tel"
                    value={profile?.phone ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, phone: e.target.value || null }))
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
                    placeholder="např. +420 123 456 789"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Globe
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                    />
                  </div>
                  <input
                    type="email"
                    value={profile?.email ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value || null }))
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
                    placeholder="např. info@salon.cz"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block font-inter text-sm font-medium text-[#111111] dark:text-white mb-2">
                  Webová stránka
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Globe
                      size={18}
                      className="text-[#6B7280] dark:text-white dark:text-opacity-60"
                    />
                  </div>
                  <input
                    type="url"
                    value={profile?.websiteUrl ?? ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, websiteUrl: e.target.value || null }))
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:border-[#5A5BFF] dark:focus:border-[#6366FF] transition-colors"
                    placeholder="https://www.salon.cz"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* IVA Settings Card */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <h2 className="font-inter font-semibold text-xl text-[#111111] dark:text-white">
                IVA Asistentka
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-inter font-semibold text-sm text-[#111111] dark:text-white mb-1">
                      Status IVA
                    </p>
                    <p className="font-inter text-xs text-[#6B7280] dark:text-white dark:text-opacity-70">
                      {ivaSettings?.ivaEnabled
                        ? "Virtuální asistentka je připravena přijímat hovory"
                        : "IVA asistentka není aktivní"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          ivaSettings?.ivaEnabled
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span
                        className={`font-inter text-xs font-medium ${
                          ivaSettings?.ivaEnabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {ivaSettings?.ivaEnabled ? "Aktivní" : "Vypnuto"}
                      </span>
                    </div>
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ivaSettings?.ivaEnabled || false}
                        onChange={(e) => handleIvaToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5A5BFF]/20 dark:peer-focus:ring-[#6366FF]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#5A5BFF] dark:peer-checked:bg-[#6366FF]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="font-inter text-sm text-blue-900 dark:text-blue-200">
                  💡 <strong>Tip:</strong> IVA automaticky používá vaše služby a
                  otevírací dobu pro vytváření rezervací.
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="font-inter text-sm text-green-900 dark:text-green-200">
                {successMessage}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !profile}
              className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter font-semibold text-sm hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Save size={20} />
              <span>{saving ? "Ukládání..." : "Uložit změny"}</span>
            </button>
            </div>
          </form>
          </div>
        )}
      </div>
    </>
  );
}
