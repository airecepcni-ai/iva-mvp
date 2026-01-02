/**
 * Session utilities for API routes.
 * 
 * Gets the authenticated session from the Hono context.
 * The session is populated by the verifyAuth middleware in __create/index.ts.
 */

import { getContext } from 'hono/context-storage';

/**
 * Gets the current authenticated session from Hono context.
 * 
 * @returns {{ user: { id: string, email: string, name?: string } } | null}
 */
export function getSession() {
  try {
    const c = getContext();
    const authUser = c?.get?.('authUser');
    
    if (!authUser) {
      return null;
    }
    
    // authUser can be { session: {...}, user: {...} } or { user: {...} }
    // Normalize to always have { user: {...} } structure
    const session = authUser?.session || authUser;
    
    if (!session?.user?.id) {
      return null;
    }
    
    return session;
  } catch (e) {
    // Context not available - probably not in Hono middleware chain
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[getSession] Could not get Hono context:', e.message);
    }
    return null;
  }
}

/**
 * Gets the current user ID from the session.
 * 
 * @returns {string | null}
 */
export function getUserId() {
  const session = getSession();
  return session?.user?.id || null;
}

/**
 * Checks if the request is authenticated.
 * 
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getUserId() !== null;
}









