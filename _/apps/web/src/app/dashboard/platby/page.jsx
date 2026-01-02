"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useTenant } from "@/lib/TenantContext";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { getTierByPriceId, getTierByKey } from "@/data/pricingTiers";

// Status display config
const STATUS_CONFIG = {
  active: { label: "Aktivní", color: "green", icon: CheckCircle },
  trialing: { label: "Zkušební", color: "blue", icon: Sparkles },
  past_due: { label: "Po splatnosti", color: "yellow", icon: AlertCircle },
  canceled: { label: "Zrušeno", color: "red", icon: XCircle },
  unpaid: { label: "Nezaplaceno", color: "red", icon: XCircle },
  incomplete: { label: "Nedokončeno", color: "yellow", icon: Clock },
  incomplete_expired: { label: "Vypršelo", color: "red", icon: XCircle },
};

function getStatusDisplay(status) {
  return STATUS_CONFIG[status] || { label: status || "Neznámý", color: "gray", icon: Clock };
}

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function PlatbyPage() {
  const { activeBusinessId, loading: tenantLoading, ready: tenantReady, refreshBusinesses } = useTenant();

  // Subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState(null);

  // Fetch subscription details
  const fetchSubscription = useCallback(async (opts = {}) => {
    const businessId = typeof opts.businessId === "string" ? opts.businessId : activeBusinessId;
    if (!businessId) {
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      const res = await fetch(`/api/subscription?businessId=${businessId}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        // Don't show error for missing subscription - just show as no subscription
        if (res.status === 404 || data?.error === 'Business not found') {
          setSubscription(null);
        } else {
          setSubscription(null);
          // Only show error for actual errors, not for "no subscription" state
          if (res.status !== 401) {
            console.warn('[Platby] Subscription fetch error:', data?.error);
          }
        }
        return;
      }

      setSubscription({
        isSubscribed: data.isSubscribed === true,
        status: data.subscription?.status || null,
        priceId: data.subscription?.priceId || null,
        tier: data.subscription?.tier || null,
        currentPeriodEnd: data.subscription?.currentPeriodEnd || null,
        customerId: data.subscription?.customerId || null,
        subscriptionId: data.subscription?.subscriptionId || null,
      });
    } catch (e) {
      console.error('[Platby] Subscription fetch error:', e);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    if (!tenantReady || tenantLoading) return;
    if (!activeBusinessId) {
      setSubscriptionLoading(false);
      return;
    }
    fetchSubscription({ businessId: activeBusinessId });
  }, [tenantReady, tenantLoading, activeBusinessId, fetchSubscription]);

  // After returning from Stripe, refresh tenant + subscription state.
  useEffect(() => {
    if (!tenantReady || tenantLoading) return;
    if (!activeBusinessId) return;

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    const stripeReturn = params.get("stripe");
    const businessIdFromUrl = params.get("businessId");

    if (checkoutStatus === "success" || checkoutStatus === "cancel" || 
        stripeReturn === "success" || stripeReturn === "cancel") {
      (async () => {
        try {
          await refreshBusinesses?.();
        } catch {
          // ignore
        }
        await fetchSubscription({ businessId: businessIdFromUrl || activeBusinessId });

        // Clean up URL params (avoid re-trigger on refresh)
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout");
          url.searchParams.delete("stripe");
          url.searchParams.delete("businessId");
          window.history.replaceState({}, "", url.toString());
        } catch {
          // ignore
        }
      })();
    }
  }, [tenantReady, tenantLoading, activeBusinessId, refreshBusinesses, fetchSubscription]);

  // Handle selecting a plan (checkout)
  const handleSelectPlan = async (tier) => {
    if (!activeBusinessId || !tier?.stripePriceId) {
      setSubscriptionError("Vyberte prosím tarif.");
      return;
    }
    
    setStripeActionLoading(true);
    setLoadingPriceId(tier.stripePriceId);
    setSubscriptionError(null);
    
    try {
      console.log('[Platby] Creating checkout for tier:', tier.tier, 'priceId:', tier.stripePriceId);
      
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          businessId: activeBusinessId,
          priceId: tier.stripePriceId,
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data?.url) {
        console.error('[Platby] Checkout error:', { status: res.status, data });
        
        // Show user-friendly error message
        let errorMsg = "Nepodařilo se spustit platbu.";
        if (data?.error === 'stripe_not_configured') {
          errorMsg = "Platební systém není nakonfigurován. Kontaktujte podporu.";
        } else if (data?.error === 'unauthorized') {
          errorMsg = "Přihlaste se prosím znovu.";
        } else if (data?.details) {
          errorMsg += ` (${data.details})`;
        }
        
        setSubscriptionError(errorMsg);
        return;
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e) {
      console.error('[Platby] Stripe checkout error:', e);
      setSubscriptionError("Nepodařilo se spustit platbu. Zkuste to prosím znovu.");
    } finally {
      setStripeActionLoading(false);
      setLoadingPriceId(null);
    }
  };

  // Handle opening customer portal
  const handleManageSubscription = async () => {
    if (!activeBusinessId) return;
    
    setStripeActionLoading(true);
    setSubscriptionError(null);
    
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId: activeBusinessId }),
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data?.url) {
        console.error('[Platby] Portal error:', { status: res.status, data });
        setSubscriptionError("Nepodařilo se otevřít správu předplatného.");
        return;
      }
      
      window.location.href = data.url;
    } catch (e) {
      console.error('[Platby] Stripe portal error:', e);
      setSubscriptionError("Nepodařilo se otevřít správu předplatného. Zkuste to prosím znovu.");
    } finally {
      setStripeActionLoading(false);
    }
  };

  // Get current tier info
  const currentTier = subscription?.tier 
    ? getTierByKey(subscription.tier)
    : subscription?.priceId
      ? getTierByPriceId(subscription.priceId)
      : null;

  const statusDisplay = getStatusDisplay(subscription?.status);
  const StatusIcon = statusDisplay.icon;

  // Loading state
  if (!tenantReady || (tenantLoading && !activeBusinessId)) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-inter font-bold text-3xl text-[#111111] dark:text-white mb-2">
          Předplatné
        </h1>
        <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70">
          Vyberte si tarif a spravujte své předplatné
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6">
        <h2 className="font-inter font-bold text-xl text-[#111111] dark:text-white mb-4">
          Aktuální tarif
        </h2>

        {subscriptionLoading ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="animate-spin text-[#6B7280]" size={20} />
            <span className="font-inter text-sm text-[#6B7280]">Načítám stav předplatného...</span>
          </div>
        ) : subscription?.isSubscribed && currentTier ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              {/* Plan name */}
              <div className="flex items-center gap-3">
                <span className="font-inter font-bold text-2xl text-[#111111] dark:text-white">
                  {currentTier.name}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  statusDisplay.color === "green" ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                  statusDisplay.color === "blue" ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" :
                  statusDisplay.color === "yellow" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400" :
                  statusDisplay.color === "red" ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                  "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400"
                }`}>
                  <StatusIcon size={12} />
                  {statusDisplay.label}
                </span>
              </div>
              
              {/* Price */}
              <p className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-70">
                {currentTier.priceMonthly.toLocaleString("cs-CZ")} Kč/měsíc
              </p>
              
              {/* Renewal date */}
              {subscription.currentPeriodEnd && (
                <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-60 flex items-center gap-1">
                  <Calendar size={14} />
                  Další platba: {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={stripeActionLoading || !activeBusinessId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-inter text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stripeActionLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Otevírám...
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  Spravovat předplatné
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-70">
              Nemáte aktivní předplatné
            </p>
            <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-60">
              Vyberte si tarif níže a začněte využívat všechny funkce
            </p>
          </div>
        )}

        {subscriptionError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="font-inter text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              {subscriptionError}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-gray-700 rounded-xl p-6">
        <h2 className="font-inter font-bold text-xl text-[#111111] dark:text-white mb-2">
          {subscription?.isSubscribed ? "Změnit tarif" : "Vyberte tarif"}
        </h2>
        <p className="font-inter text-sm text-[#6B7280] dark:text-white dark:text-opacity-70 mb-6">
          {subscription?.isSubscribed 
            ? "Změna tarifu se projeví od dalšího fakturačního období"
            : "Vyberte si plán, který vyhovuje vašemu salonu"
          }
        </p>

        <PricingPlans
          billingPeriod="monthly"
          activePriceId={subscription?.priceId || null}
          onSelectPlan={handleSelectPlan}
          ctaLabel="Vybrat tarif"
          showYearlySavings={false}
          loading={stripeActionLoading}
          loadingPriceId={loadingPriceId}
          compact={true}
        />
      </div>
    </div>
  );
}
