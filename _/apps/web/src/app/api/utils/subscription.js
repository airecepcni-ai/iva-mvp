/**
 * Subscription utilities for multi-tenant auth.
 * 
 * Checks if a user has an active subscription across their businesses.
 */

import sql from './sql';

const ACTIVE_STATUS_SET = new Set(['active', 'trialing']);

function parsePeriodEnd(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Canonical compute helper for business-level subscription state.
 */
export function computeIsSubscribed(businessRow) {
  if (!businessRow) return false;

  if (businessRow.is_subscribed === true) {
    return true;
  }

  const status = (
    businessRow.stripe_status ||
    businessRow.stripe_subscription_status ||
    ''
  )
    .toString()
    .toLowerCase();

  if (status && ACTIVE_STATUS_SET.has(status)) {
    return true;
  }

  const periodEnd = parsePeriodEnd(businessRow.stripe_current_period_end);
  if (periodEnd && periodEnd.getTime() > Date.now()) {
    return true;
  }

  return false;
}

function mapBusinessRow(row) {
  return {
    id: row.id,
    name: row.name,
    isSubscribed: computeIsSubscribed(row),
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    stripePriceId: row.stripe_price_id || null,
    stripeStatus: row.stripe_status || null,
    stripeSubscriptionStatus: row.stripe_subscription_status || null,
    stripeCurrentPeriodEnd: row.stripe_current_period_end || null,
  };
}

/**
 * Gets subscription info for an Auth.js user.
 * 
 * @param {string} authUserId - The Auth.js user ID (from session.user.id)
 * @returns {Promise<{userId: string, isSubscribed: boolean, businesses: Array}>}
 */
export async function getSubscriptionInfo(authUserId) {
  if (!authUserId) {
    console.warn('[getSubscriptionInfo] No authUserId provided');
    return {
      userId: '',
      isSubscribed: false,
      businesses: [],
    };
  }

  try {
    // NOTE: stripe_status column may not exist in all deployments
    const rows = await sql`
      SELECT
        id,
        name,
        is_subscribed,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        stripe_current_period_end
      FROM public.businesses
      WHERE auth_user_id = ${authUserId}
      ORDER BY created_at ASC
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[getSubscriptionInfo] authUserId: ${authUserId}`);
      console.log(`[getSubscriptionInfo] Found ${rows?.length ?? 0} businesses`);
    }

    if (!rows || rows.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[getSubscriptionInfo] No businesses found for user ${authUserId}, isSubscribed = false`);
      }
      return {
        userId: authUserId,
        isSubscribed: false,
        businesses: [],
      };
    }

    const businesses = rows.map((row) => mapBusinessRow(row));

    const isSubscribed = businesses.some((b) => b.isSubscribed);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[getSubscriptionInfo] Final isSubscribed = ${isSubscribed}`);
    }

    return {
      userId: authUserId,
      isSubscribed,
      businesses,
    };
  } catch (error) {
    console.error('[getSubscriptionInfo] Database error:', error);
    return {
      userId: authUserId,
      isSubscribed: false,
      businesses: [],
    };
  }
}

/**
 * Gets subscription info for a specific business.
 * Also returns the auth_user_id so we can check across all businesses.
 * 
 * @param {string} businessId - The business UUID
 * @returns {Promise<{userId: string, isSubscribed: boolean, businesses: Array} | null>}
 */
export async function getSubscriptionInfoByBusinessId(businessId) {
  if (!businessId) {
    console.warn('[getSubscriptionInfoByBusinessId] No businessId provided');
    return null;
  }

  try {
    // NOTE: stripe_status column may not exist in all deployments
    const businessRows = await sql`
      SELECT
        id,
        name,
        auth_user_id,
        owner_id,
        is_subscribed,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        stripe_current_period_end
      FROM public.businesses
      WHERE id = ${businessId}
      LIMIT 1
    `;

    if (!businessRows || businessRows.length === 0) {
      console.warn(`[getSubscriptionInfoByBusinessId] Business not found: ${businessId}`);
      return null;
    }

    const biz = businessRows[0];
    const authUserId = biz.auth_user_id || biz.owner_id || '';

    if (!authUserId) {
      return {
        userId: '',
        isSubscribed: computeIsSubscribed(biz),
        businesses: [mapBusinessRow(biz)],
      };
    }

    return getSubscriptionInfo(authUserId);
  } catch (error) {
    console.error('[getSubscriptionInfoByBusinessId] Database error:', error);
    return null;
  }
}









