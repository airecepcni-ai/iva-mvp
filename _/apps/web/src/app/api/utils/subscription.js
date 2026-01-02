/**
 * Subscription utilities for multi-tenant auth.
 * 
 * Checks if a user has an active subscription across their businesses.
 */

import sql from './sql';

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
    const rows = await sql`
      SELECT id, name, is_subscribed
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

    const businesses = rows.map((row) => ({
      id: row.id,
      name: row.name,
      isSubscribed: row.is_subscribed === true,
    }));

    // User is subscribed if ANY of their businesses has is_subscribed = true
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
    // First, get the auth_user_id for this business
    const businessRows = await sql`
      SELECT auth_user_id
      FROM public.businesses
      WHERE id = ${businessId}
      LIMIT 1
    `;

    if (!businessRows || businessRows.length === 0) {
      console.warn(`[getSubscriptionInfoByBusinessId] Business not found: ${businessId}`);
      return null;
    }

    const authUserId = businessRows[0].auth_user_id;
    
    if (!authUserId) {
      // Legacy/unclaimed business - check only this business
      const singleBusinessRows = await sql`
        SELECT id, name, is_subscribed
        FROM public.businesses
        WHERE id = ${businessId}
      `;
      
      if (!singleBusinessRows || singleBusinessRows.length === 0) {
        return null;
      }
      
      const biz = singleBusinessRows[0];
      return {
        userId: '',
        isSubscribed: biz.is_subscribed === true,
        businesses: [{
          id: biz.id,
          name: biz.name,
          isSubscribed: biz.is_subscribed === true,
        }],
      };
    }

    // Get subscription info for the user owning this business
    return getSubscriptionInfo(authUserId);
  } catch (error) {
    console.error('[getSubscriptionInfoByBusinessId] Database error:', error);
    return null;
  }
}









