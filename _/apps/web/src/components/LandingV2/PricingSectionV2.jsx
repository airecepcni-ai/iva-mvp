"use client";

import { Check } from "lucide-react";

const pricingTiers = [
  {
    name: "Základní",
    price: "1 890 Kč/měs",
    tier: "tier1",
    features: [
      "Až 50 rezervací měsíčně",
      "Základní kalendář",
      "E-mailové notifikace",
      "1 telefonní číslo",
      "Základní správa rezervací",
    ],
  },
  {
    name: "Standard",
    price: "3 490 Kč/měs",
    tier: "tier2",
    popular: true,
    features: [
      "Neomezené rezervace",
      "Pokročilý kalendář",
      "E-mailové notifikace",
      "2 telefonní čísla",
      "Prioritní podpora",
    ],
  },
  {
    name: "Premium",
    price: "4 990 Kč/měs",
    tier: "tier3",
    features: [
      "Vše z tier2",
      "Neomezený počet telefonních čísel",
      "Vlastní nastavení IVA",
      "Prioritní podpora 24/7",
      "Rozšířené statistiky (brzy)",
    ],
  },
];

export function PricingSectionV2() {
  return (
    <section id="cena" className="py-20 lg:py-28 bg-gray-50">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
            Cena
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Vyberte si plán, který vyhovuje vašemu salonu.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingTiers.map((tier, index) => {
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl p-8 transition-all duration-300 ${
                  tier.popular
                    ? "border-2 border-[#7B42BC] shadow-2xl shadow-purple-500/20 scale-105 z-10"
                    : "border border-gray-200 shadow-sm hover:shadow-lg"
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-[#7B42BC] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                      Nejpopulárnější
                    </span>
                  </div>
                )}

                {/* Tier Name */}
                <h3 className="font-bold text-2xl text-gray-900 mb-2">
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="font-extrabold text-4xl text-gray-900">
                    {tier.price}
                  </div>

                  {/* Trust text */}
                  <p className="mt-3 text-xs text-gray-500">
                    Bez smlouvy • Zrušení kdykoli
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <Check
                        size={18}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <a
                  href="/account/signin"
                  className={`block w-full text-center rounded-xl px-6 py-3.5 font-semibold text-base transition-all ${
                    tier.popular
                      ? "bg-[#7B42BC] text-white hover:bg-[#6a39a3] shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                      : "bg-white text-[#7B42BC] border-2 border-[#7B42BC] hover:bg-purple-50"
                  }`}
                >
                  Vybrat tarif
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

