import Stripe from 'stripe';

let stripeSingleton = null;

/**
 * Server-side Stripe client (test mode).
 * Uses STRIPE_SECRET_KEY from apps/web/.env.local
 * 
 * Required env vars:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret (whsec_...)
 * - APP_URL or AUTH_URL: Base URL for redirect URLs (auto-detected on Vercel)
 * 
 * Price IDs (from env or hardcoded):
 * - STRIPE_PRICE_TIER1: price_1ShqAQBI794qjgfkMz70rLi4 (Základní - 1890 CZK)
 * - STRIPE_PRICE_TIER2: price_1ShqCkBI794qjgfkpdj2LDHu (Standard - 3490 CZK)
 * - STRIPE_PRICE_TIER3: price_1ShqDFBI794qjgfkTm92uWLk (Premium - 4990 CZK)
 */
export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('[stripe-server] STRIPE_SECRET_KEY is not set in environment');
    throw new Error('Missing STRIPE_SECRET_KEY env var. Please configure it in .env.local');
  }
  
  // Check for placeholder value
  if (secretKey.includes('XXXX') || secretKey.length < 20) {
    console.error('[stripe-server] STRIPE_SECRET_KEY appears to be a placeholder');
    throw new Error('STRIPE_SECRET_KEY is not configured correctly. Please replace the placeholder with your real Stripe secret key.');
  }
  
  // Validate key format
  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    console.error('[stripe-server] STRIPE_SECRET_KEY has invalid format');
    throw new Error('STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
  }
  
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey, {
      // Use latest API version
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[stripe-server] Stripe client initialized (mode:', secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE', ')');
  }
  
  return stripeSingleton;
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return false;
  if (secretKey.includes('XXXX') || secretKey.length < 20) return false;
  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) return false;
  return true;
}

/**
 * Get Stripe mode (test or live)
 */
export function getStripeMode() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (secretKey.startsWith('sk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_')) return 'live';
  return null;
}
