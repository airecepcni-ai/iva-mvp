"use client";

import { useState, useEffect } from "react";
import { Phone, Copy, Check, ExternalLink, Info } from "lucide-react";
import { useTenant } from "@/lib/TenantContext";

export default function PhoneNumberPage() {
  const [copied, setCopied] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  const { activeBusiness, activeBusinessId, ready, loading: tenantLoading, updateBusiness } = useTenant();

  // Keep the input in sync with the active business
  useEffect(() => {
    setPhoneInput(activeBusiness?.vapiPhone || activeBusiness?.vapi_phone || "");
    setSaveError(null);
    setSaveOk(false);
  }, [activeBusinessId, activeBusiness?.vapiPhone, activeBusiness?.vapi_phone]);

  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ready || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#5A5BFF] dark:border-[#6366FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSubscribed = !!(activeBusiness?.is_subscribed ?? activeBusiness?.isSubscribed);
  const subscriptionStatus = isSubscribed ? "active" : "inactive";
  const subscriptionTier = null; // Not currently derived from DB in this app
  const ivaPhoneNumber = (activeBusiness?.vapiPhone || activeBusiness?.vapi_phone || "").trim() || null;

  const savePhone = async () => {
    if (!activeBusinessId) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const res = await fetch(`/api/businesses/${activeBusinessId}/phone`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const err =
          data?.error === "phone_must_be_e164"
            ? "Zadejte číslo ve formátu E.164, např. +420123456789 (nebo nechte prázdné pro smazání)."
            : data?.error === "phone_in_use"
              ? "Toto číslo už je přiřazené k jinému podniku. Zvolte jiné číslo."
            : data?.error || `http_${res.status}`;
        throw new Error(err);
      }

      updateBusiness(activeBusinessId, { vapiPhone: data.phone, vapi_phone: data.phone });
      setSaveOk(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Nepodařilo se uložit telefonní číslo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
          Telefonní číslo
        </h1>
        <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
          Spravujte telefonní čísla pro IVA asistentku
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl space-y-6">
        {/* Current Status Card */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <h2 className="font-inter font-semibold text-xl text-[#111111] dark:text-white">
              IVA Telefonní číslo
            </h2>
          </div>

          {subscriptionStatus === "active" && ivaPhoneNumber ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-inter text-sm font-medium text-green-900 dark:text-green-200">
                      Aktivní
                    </span>
                  </div>
                  <span className="font-inter text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">
                    {subscriptionTier === "basic"
                      ? "Základní plán"
                      : subscriptionTier === "standard"
                        ? "Standard plán"
                        : "Premium plán"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-inter text-xs text-green-700 dark:text-green-300 mb-1">
                      Vaše IVA číslo
                    </p>
                    <p className="font-mono font-bold text-2xl text-green-900 dark:text-green-100">
                      {ivaPhoneNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyNumber(ivaPhoneNumber)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white dark:bg-green-900/30 border border-green-200 dark:border-green-700 font-inter text-sm font-medium text-green-900 dark:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/50 transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        <span>Zkopírováno!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Kopírovat</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <Info
                    size={20}
                    className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-inter text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Jak to funguje?
                    </p>
                    <p className="font-inter text-sm text-blue-800 dark:text-blue-300">
                      Když zákazník zavolá na toto číslo, IVA automaticky přijme
                      hovor a pomůže s vytvořením rezervace podle vašich služeb
                      a otevírací doby.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                <Phone
                  size={48}
                  className="text-amber-600 dark:text-amber-400 mx-auto mb-4"
                />
                <h3 className="font-inter font-semibold text-lg text-amber-900 dark:text-amber-200 mb-2">
                  Telefonní číslo není aktivní
                </h3>
                <p className="font-inter text-sm text-amber-800 dark:text-amber-300 mb-4">
                  Pro aktivaci telefonního čísla si zvolte předplatné
                </p>
                <a
                  href="/"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#5A5BFF] to-[#726BFF] dark:from-[#6366FF] dark:to-[#8B5CF6] text-white font-inter font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg"
                >
                  <span>Zobrazit cenové plány</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Phone mapping form (persists to public.businesses.vapi_phone) */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-gray-700">
            <p className="font-inter text-sm font-semibold text-[#111111] dark:text-white mb-2">
              Číslo pro IVA (Twilio/Vapi)
            </p>
            <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 mb-4">
              Musí být stejné jako číslo, na které zákazník volá (To). Formát +420… Prázdné pole číslo smaže.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+420123456789"
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700 font-inter text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5A5BFF]/30 dark:focus:ring-[#6366FF]/30"
              />
              <button
                onClick={savePhone}
                disabled={!activeBusinessId || saving}
                className="px-6 py-3 rounded-xl bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter font-semibold text-sm hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Ukládám..." : "Uložit"}
              </button>
            </div>

            {saveError && (
              <p className="mt-3 font-inter text-sm text-red-600 dark:text-red-400">
                {saveError}
              </p>
            )}
            {saveOk && !saveError && (
              <p className="mt-3 font-inter text-sm text-green-700 dark:text-green-300">
                Uloženo.
              </p>
            )}
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6">
          <h3 className="font-inter font-semibold text-lg text-[#111111] dark:text-white mb-4">
            Co IVA umí?
          </h3>
          <div className="space-y-3">
            {[
              "Přijímá hovory 24/7, i když jste nedostupní",
              "Mluví přirozeně česky s vašimi zákazníky",
              "Automaticky vytváří rezervace podle volných termínů",
              "Zná všechny vaše služby a ceny",
              "Přizpůsobuje se vaší otevírací době",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#0A0A0A]"
              >
                <Check
                  size={20}
                  className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                />
                <p className="font-inter text-sm text-[#374151] dark:text-white dark:text-opacity-87">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Info */}
        {subscriptionStatus === "active" && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-6">
            <h3 className="font-inter font-semibold text-lg text-[#111111] dark:text-white mb-4">
              Váš plán
            </h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-gray-700">
              <div>
                <p className="font-inter font-semibold text-base text-[#111111] dark:text-white">
                  {subscriptionTier === "basic"
                    ? "Základní plán"
                    : subscriptionTier === "standard"
                      ? "Standard plán"
                      : "Premium plán"}
                </p>
                <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
                  {subscriptionTier === "basic"
                    ? "1 telefonní číslo"
                    : subscriptionTier === "standard"
                      ? "Až 2 telefonní čísla"
                      : "Neomezená telefonní čísla"}
                </p>
              </div>
              <a
                href="/dashboard/platby"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#5A5BFF] dark:bg-[#6366FF] text-white font-inter text-sm font-medium hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF] transition-all active:scale-95"
              >
                <span>Změnit plán</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
