import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";
import { pricingTiers } from "@/data/pricingTiers";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-[1240px] mx-auto">
        <h2 className="font-inter font-bold text-3xl text-center text-[#111111] dark:text-white mb-4">
          Cena
        </h2>
        <p className="font-inter text-base text-center text-[#6B7280] dark:text-white dark:text-opacity-70 mb-8">
          Vyberte si plán, který vyhovuje vašemu salonu
        </p>

        <BillingToggle
          billingPeriod={billingPeriod}
          onToggle={setBillingPeriod}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, i) => (
            <PricingCard
              key={tier.tier}
              tier={tier}
              billingPeriod={billingPeriod}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
