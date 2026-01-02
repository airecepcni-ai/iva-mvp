import { Check, Sparkles } from "lucide-react";

export function PricingCard({ tier, billingPeriod, index }) {
  const price =
    billingPeriod === "monthly" ? tier.priceMonthly : tier.priceYearly;
  const formattedPrice = price.toLocaleString("cs-CZ");
  const monthlySavings =
    billingPeriod === "yearly"
      ? Math.round((tier.priceMonthly * 12 - tier.priceYearly) / 12)
      : 0;

  return (
    <div
      className={`relative bg-white dark:bg-[#1E1E1E] border rounded-2xl p-8 transition-all hover:shadow-xl animate-slide-up ${
        tier.popular
          ? "border-[#5A5BFF] dark:border-[#6366FF] shadow-lg scale-105"
          : "border-[#E5E7EB] dark:border-gray-700"
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-[#5A5BFF] dark:bg-[#6366FF] text-white px-4 py-1 rounded-full font-inter text-xs font-semibold animate-pulse">
            <Sparkles size={12} />
            NEJPOPULÁRNĚJŠÍ
          </span>
        </div>
      )}
      <h3 className="font-inter font-bold text-2xl text-[#111111] dark:text-white mb-2">
        {tier.name}
      </h3>
      <div className="mb-6">
        <span className="font-inter font-bold text-4xl text-[#111111] dark:text-white">
          {formattedPrice}
        </span>
        <span className="font-inter text-lg text-[#6B7280] dark:text-white dark:text-opacity-60">
          {" "}
          Kč{billingPeriod === "yearly" ? "/rok" : "/měsíc"}
        </span>
        {billingPeriod === "yearly" && (
          <div className="mt-2">
            <span className="inline-block bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full font-inter text-xs font-semibold">
              Ušetříte {monthlySavings.toLocaleString("cs-CZ")} Kč/měsíc
            </span>
          </div>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {tier.features.map((feature, j) => (
          <li
            key={j}
            className="flex items-start space-x-3 font-inter text-sm text-[#374151] dark:text-white dark:text-opacity-87"
          >
            <Check size={20} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href="/account/signup"
        className={`block w-full text-center rounded-[20px] px-6 py-3 font-inter font-semibold text-base transition-all active:scale-95 ${
          tier.popular
            ? "bg-[#5A5BFF] dark:bg-[#6366FF] text-white hover:bg-[#4F4FE6] dark:hover:bg-[#5856FF]"
            : "bg-white dark:bg-[#262626] text-[#5A5BFF] dark:text-[#6366FF] border-2 border-[#5A5BFF] dark:border-[#6366FF] hover:bg-[#5A5BFF]/5 dark:hover:bg-[#6366FF]/10"
        }`}
      >
        Vyzkoušet zdarma
      </a>
    </div>
  );
}
