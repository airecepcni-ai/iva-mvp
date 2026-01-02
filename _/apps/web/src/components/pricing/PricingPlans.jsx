"use client";

import { Check, Sparkles, Loader2 } from "lucide-react";
import { pricingTiers } from "@/data/pricingTiers";

/**
 * Shared PricingPlans component for landing page and dashboard.
 * 
 * Props:
 * - billingPeriod: "monthly" | "yearly" (default: "monthly")
 * - activePriceId: string | null - Currently active Stripe price ID (to mark as "Aktivní")
 * - onSelectPlan: (tier) => void - Called when user clicks CTA
 * - ctaLabel: string - Button label (default: "Vybrat tarif")
 * - showYearlySavings: boolean - Show savings badge for yearly (default: true)
 * - loading: boolean - Show loading state on buttons
 * - loadingPriceId: string | null - Which plan is currently loading
 * - compact: boolean - Smaller cards for dashboard (default: false)
 */
export function PricingPlans({
  billingPeriod = "monthly",
  activePriceId = null,
  onSelectPlan,
  ctaLabel = "Vybrat tarif",
  showYearlySavings = true,
  loading = false,
  loadingPriceId = null,
  compact = false,
}) {
  return (
    <div className={`grid grid-cols-1 ${compact ? "lg:grid-cols-3 gap-4" : "md:grid-cols-3 gap-8"}`}>
      {pricingTiers.map((tier, i) => (
        <PricingCard
          key={tier.tier}
          tier={tier}
          billingPeriod={billingPeriod}
          index={i}
          isActive={activePriceId === tier.stripePriceId}
          onSelect={onSelectPlan}
          ctaLabel={ctaLabel}
          showYearlySavings={showYearlySavings}
          loading={loading && loadingPriceId === tier.stripePriceId}
          disabled={loading}
          compact={compact}
        />
      ))}
    </div>
  );
}

function PricingCard({
  tier,
  billingPeriod,
  index,
  isActive,
  onSelect,
  ctaLabel,
  showYearlySavings,
  loading,
  disabled,
  compact,
}) {
  const price = billingPeriod === "monthly" ? tier.priceMonthly : tier.priceYearly;
  const formattedPrice = price.toLocaleString("cs-CZ");
  const monthlySavings =
    billingPeriod === "yearly" && showYearlySavings
      ? Math.round((tier.priceMonthly * 12 - tier.priceYearly) / 12)
      : 0;

  const handleClick = () => {
    if (!disabled && onSelect && !isActive) {
      onSelect(tier);
    }
  };

  return (
    <div
      className={`relative bg-white dark:bg-[#1E1E1E] border rounded-2xl transition-all ${
        compact ? "p-5" : "p-8"
      } ${
        tier.popular
          ? "border-[#5A5BFF] dark:border-[#6366FF] shadow-lg " + (compact ? "" : "scale-105")
          : "border-[#E5E7EB] dark:border-gray-700"
      } ${!compact ? "hover:shadow-xl animate-slide-up" : "hover:shadow-md"}`}
      style={!compact ? { animationDelay: `${index * 0.1}s` } : undefined}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className={`absolute ${compact ? "-top-3" : "-top-4"} left-1/2 -translate-x-1/2`}>
          <span className={`inline-flex items-center gap-1 bg-[#5A5BFF] dark:bg-[#6366FF] text-white ${
            compact ? "px-3 py-0.5 text-[10px]" : "px-4 py-1 text-xs"
          } rounded-full font-inter font-semibold`}>
            <Sparkles size={compact ? 10 : 12} />
            NEJPOPULÁRNĚJŠÍ
          </span>
        </div>
      )}

      {/* Active badge */}
      {isActive && (
        <div className={`absolute ${compact ? "-top-3 right-3" : "-top-4 right-4"}`}>
          <span className={`inline-flex items-center gap-1 bg-green-500 text-white ${
            compact ? "px-3 py-0.5 text-[10px]" : "px-4 py-1 text-xs"
          } rounded-full font-inter font-semibold`}>
            <Check size={compact ? 10 : 12} />
            AKTIVNÍ
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className={`font-inter font-bold text-[#111111] dark:text-white ${
        compact ? "text-lg mb-1" : "text-2xl mb-2"
      }`}>
        {tier.name}
      </h3>

      {/* Price */}
      <div className={compact ? "mb-4" : "mb-6"}>
        <span className={`font-inter font-bold text-[#111111] dark:text-white ${
          compact ? "text-2xl" : "text-4xl"
        }`}>
          {formattedPrice}
        </span>
        <span className={`font-inter text-[#6B7280] dark:text-white dark:text-opacity-60 ${
          compact ? "text-sm" : "text-lg"
        }`}>
          {" "}Kč{billingPeriod === "yearly" ? "/rok" : "/měsíc"}
        </span>
        {monthlySavings > 0 && (
          <div className="mt-2">
            <span className={`inline-block bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            } rounded-full font-inter font-semibold`}>
              Ušetříte {monthlySavings.toLocaleString("cs-CZ")} Kč/měsíc
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className={`space-y-2 ${compact ? "mb-4" : "mb-8"}`}>
        {tier.features.map((feature, j) => (
          <li
            key={j}
            className={`flex items-start space-x-2 font-inter text-[#374151] dark:text-white dark:text-opacity-87 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            <Check size={compact ? 14 : 18} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {onSelect ? (
        <button
          onClick={handleClick}
          disabled={disabled || isActive}
          className={`block w-full text-center rounded-[20px] font-inter font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            compact ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"
          } ${
            isActive
              ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-500 cursor-default"
              : tier.popular
                ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF]"
                : "bg-white dark:bg-[#262626] text-[#5A5BFF] dark:text-[#6366FF] border-2 border-[#5A5BFF] dark:border-[#6366FF] hover:bg-[#5A5BFF]/5 dark:hover:bg-[#6366FF]/10"
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={compact ? 14 : 16} />
              Zpracování...
            </span>
          ) : isActive ? (
            "Aktivní"
          ) : (
            ctaLabel
          )}
        </button>
      ) : (
        <a
          href="/account/signup"
          className={`block w-full text-center rounded-[20px] font-inter font-semibold transition-all active:scale-95 ${
            compact ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"
          } ${
            tier.popular
              ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF]"
              : "bg-white dark:bg-[#262626] text-[#5A5BFF] dark:text-[#6366FF] border-2 border-[#5A5BFF] dark:border-[#6366FF] hover:bg-[#5A5BFF]/5 dark:hover:bg-[#6366FF]/10"
          }`}
        >
          Vyzkoušet zdarma
        </a>
      )}
    </div>
  );
}

export default PricingPlans;

