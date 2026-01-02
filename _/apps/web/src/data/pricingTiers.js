/**
 * Pricing tiers with Stripe price IDs.
 * 
 * Stripe products (test mode):
 * - Tier1 (Základní): prod_TfAVEBPNfoAgip
 * - Tier2 (Standard): prod_TfAXQMNr78bnI7
 * - Tier3 (Premium): prod_TfAYB53mNolHPS
 */

export const STRIPE_PRICE_IDS = {
  tier1: process.env.STRIPE_PRICE_TIER1 || 'price_1ShqAQBI794qjgfkMz70rLi4',
  tier2: process.env.STRIPE_PRICE_TIER2 || 'price_1ShqCkBI794qjgfkpdj2LDHu',
  tier3: process.env.STRIPE_PRICE_TIER3 || 'price_1ShqDFBI794qjgfkTm92uWLk',
};

export const STRIPE_PRODUCT_IDS = {
  tier1: process.env.STRIPE_PRODUCT_TIER1 || 'prod_TfAVEBPNfoAgip',
  tier2: process.env.STRIPE_PRODUCT_TIER2 || 'prod_TfAXQMNr78bnI7',
  tier3: process.env.STRIPE_PRODUCT_TIER3 || 'prod_TfAYB53mNolHPS',
};

// Map from Stripe price ID to tier key
export const PRICE_ID_TO_TIER = {
  [STRIPE_PRICE_IDS.tier1]: 'tier1',
  [STRIPE_PRICE_IDS.tier2]: 'tier2',
  [STRIPE_PRICE_IDS.tier3]: 'tier3',
  // Hardcoded fallbacks in case env vars differ
  'price_1ShqAQBI794qjgfkMz70rLi4': 'tier1',
  'price_1ShqCkBI794qjgfkpdj2LDHu': 'tier2',
  'price_1ShqDFBI794qjgfkTm92uWLk': 'tier3',
};

export const pricingTiers = [
  {
    name: "Základní",
    priceMonthly: 1890,
    priceYearly: 18144, // ~20% discount
    tier: "tier1",
    stripePriceId: STRIPE_PRICE_IDS.tier1,
    stripeProductId: STRIPE_PRODUCT_IDS.tier1,
    features: [
      "Až 50 rezervací měsíčně",
      "Základní kalendář",
      "E-mailové notifikace",
      "1 telefonní číslo",
      "Virtuální asistentka IVA",
      "Nastavení za 10 minut",
    ],
  },
  {
    name: "Standard",
    priceMonthly: 3490,
    priceYearly: 33504, // ~20% discount
    tier: "tier2",
    stripePriceId: STRIPE_PRICE_IDS.tier2,
    stripeProductId: STRIPE_PRODUCT_IDS.tier2,
    popular: true,
    features: [
      "Neomezené rezervace",
      "Pokročilý kalendář",
      "E-mailové notifikace",
      "2 telefonní čísla",
      "Virtuální asistentka IVA",
      "Bez zmeškaných hovorů",
      "Prioritní podpora",
    ],
  },
  {
    name: "Premium",
    priceMonthly: 4990,
    priceYearly: 47904, // ~20% discount
    tier: "tier3",
    stripePriceId: STRIPE_PRICE_IDS.tier3,
    stripeProductId: STRIPE_PRODUCT_IDS.tier3,
    features: [
      "Vše ze Standard",
      "Neomezená telefonní čísla",
      "E-mailové notifikace",
      "Rozšířené statistiky",
      "Vlastní nastavení IVA",
      "Prioritní podpora 24/7",
    ],
  },
];

/**
 * Get tier info by price ID
 */
export function getTierByPriceId(priceId) {
  if (!priceId) return null;
  const tierKey = PRICE_ID_TO_TIER[priceId];
  if (!tierKey) return null;
  return pricingTiers.find((t) => t.tier === tierKey) || null;
}

/**
 * Get tier info by tier key (tier1, tier2, tier3)
 */
export function getTierByKey(tierKey) {
  if (!tierKey) return null;
  return pricingTiers.find((t) => t.tier === tierKey) || null;
}

/**
 * Allowed price IDs for validation
 */
export const ALLOWED_PRICE_IDS = new Set([
  STRIPE_PRICE_IDS.tier1,
  STRIPE_PRICE_IDS.tier2,
  STRIPE_PRICE_IDS.tier3,
  // Hardcoded fallbacks
  'price_1ShqAQBI794qjgfkMz70rLi4',
  'price_1ShqCkBI794qjgfkpdj2LDHu',
  'price_1ShqDFBI794qjgfkTm92uWLk',
]);
