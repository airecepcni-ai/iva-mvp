/**
 * Client-side subscription utilities.
 * 
 * This module provides:
 * - API client to fetch subscription info from /api/subscription
 * - Types for subscription data
 */

export interface SubscriptionInfo {
  userId: string;
  isSubscribed: boolean;
  businesses: {
    id: string;
    name: string | null;
    isSubscribed: boolean;
  }[];
}

/**
 * Fetches subscription info for the current user.
 * 
 * @returns SubscriptionInfo or null if not authenticated
 */
export async function fetchSubscription(): Promise<SubscriptionInfo | null> {
  try {
    const res = await fetch('/api/subscription', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.log('[fetchSubscription] User not authenticated');
        return null;
      }
      console.warn('[fetchSubscription] Failed to fetch subscription:', res.status);
      return null;
    }

    const data = await res.json();
    
    // Log the subscription info in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log('[fetchSubscription] Result:', {
        userId: data.userId,
        isSubscribed: data.isSubscribed,
        businessCount: data.businesses?.length ?? 0,
      });
    }
    
    return data as SubscriptionInfo;
  } catch (error) {
    console.error('[fetchSubscription] Error:', error);
    return null;
  }
}

/**
 * Checks if the current user has an active subscription.
 * Convenience wrapper around fetchSubscription.
 * 
 * @returns true if user is subscribed, false otherwise
 */
export async function isUserSubscribed(): Promise<boolean> {
  const info = await fetchSubscription();
  return info?.isSubscribed ?? false;
}









