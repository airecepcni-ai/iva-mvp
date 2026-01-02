'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import {
  Business,
  fetchUserBusinessesWithUser,
  getStoredActiveBusinessId,
  setStoredActiveBusinessId,
  selectBestBusinessId,
  clearStoredActiveBusinessId,
} from './tenant';

interface TenantContextValue {
  /** List of businesses owned by the user */
  businesses: Business[];
  /** Currently selected business ID (null if no businesses) */
  activeBusinessId: string | null;
  /** Currently selected business object (null if no businesses) */
  activeBusiness: Business | null;
  /** Whether businesses are being loaded (true only during fetch) */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether the user has at least one business */
  hasBusiness: boolean;
  /** The current Auth.js user ID */
  currentUserId: string | null;
  /** Whether tenant data has finished loading (regardless of result) */
  ready: boolean;
  /** Switch to a different business */
  setActiveBusinessId: (id: string) => void;
  /** Reload businesses from the API */
  refreshBusinesses: () => Promise<void>;
  /** Optimistically update a business in local state (no API call) */
  updateBusiness: (id: string, patch: Partial<Business>) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Hook to access the tenant context.
 * Must be used within a TenantProvider.
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook to get the active business ID.
 * Returns empty string if loading or no business selected.
 * Does not throw.
 */
export function useActiveBusinessId(): string {
  const { activeBusinessId } = useTenant();
  return activeBusinessId || '';
}

/**
 * Hook to get the active business ID, or null if none selected.
 * Does not throw.
 */
export function useActiveBusinessIdOrNull(): string | null {
  const { activeBusinessId } = useTenant();
  return activeBusinessId;
}

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages tenant (business) state.
 * Wrap your dashboard layout with this provider.
 * 
 * Handles user changes by clearing stored business selection
 * when the logged-in user changes.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  // Perf: don't block first paint on the initial tenant fetch. We still fetch immediately on mount,
  // but `loading` starts false so pages can render their shell and show their own loading UI.
  const [loading, setLoading] = useState(false);
  // `ready` should mean "we have completed at least one /api/businesses fetch".
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Track the last known userId to detect user changes
  const lastUserIdRef = useRef<string | null>(null);
  // React 18 StrictMode (dev) intentionally re-runs effects once to surface side effects.
  // Guard the initial bootstrap so /api/businesses isn't fetched twice on first load.
  const didBootstrapRef = useRef(false);

  const perfNow = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  // Load businesses
  const loadBusinesses = useCallback(async () => {
    const t0 = perfNow();
    setLoading(true);
    setError(null);

    try {
      const tFetch0 = perfNow();
      const { businesses: fetchedBusinesses, userId } = await fetchUserBusinessesWithUser();
      const fetchMs = perfNow() - tFetch0;
      
      console.log('[TenantProvider] Loaded businesses:', {
        userId,
        count: fetchedBusinesses.length,
        lastUserId: lastUserIdRef.current,
      });
      
      // Check if user changed
      if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
        console.log('[TenantProvider] User changed from', lastUserIdRef.current, 'to', userId, '- clearing stored business');
        clearStoredActiveBusinessId(lastUserIdRef.current);
      }
      
      lastUserIdRef.current = userId;
      setCurrentUserId(userId);
      setBusinesses(fetchedBusinesses);

      // Select best business ID
      const tSelect0 = perfNow();
      const storedId = getStoredActiveBusinessId(userId);
      const bestId = selectBestBusinessId(fetchedBusinesses, storedId);

      if (bestId) {
        setActiveBusinessIdState(bestId);
        setStoredActiveBusinessId(userId, bestId);
      } else {
        setActiveBusinessIdState(null);
      }
      const selectMs = perfNow() - tSelect0;

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[perf] tenant.bootstrap total=${Math.round(perfNow() - t0)}ms fetch=${Math.round(fetchMs)}ms select+storage=${Math.round(selectMs)}ms businesses=${fetchedBusinesses.length}`
        );
      }
    } catch (err) {
      console.error('[TenantProvider] Error loading businesses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;
    loadBusinesses();
  }, [loadBusinesses]);

  // Handler to change active business
  const setActiveBusinessId = useCallback((id: string) => {
    setActiveBusinessIdState(id);
    setStoredActiveBusinessId(lastUserIdRef.current, id);
  }, []);

  // Local-only updater for when the UI changes a business field (e.g. phone) and
  // we want immediate UI consistency without a full refetch.
  const updateBusiness = useCallback((id: string, patch: Partial<Business>) => {
    if (!id) return;
    setBusinesses((prev) =>
      (prev || []).map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }, []);

  // Get active business object
  const activeBusiness = useMemo(() => {
    if (!activeBusinessId) return null;
    return businesses.find((b) => b.id === activeBusinessId) || null;
  }, [businesses, activeBusinessId]);

  // Convenience flags for UI logic
  // hasBusiness: true if user has at least one business
  const hasBusiness = businesses.length > 0;
  // ready: true once the first /api/businesses fetch has completed (regardless of result)
  const ready = bootstrapped;

  const value = useMemo<TenantContextValue>(
    () => ({
      businesses,
      activeBusinessId,
      activeBusiness,
      loading,
      error,
      hasBusiness,
      currentUserId,
      ready,
      setActiveBusinessId,
      refreshBusinesses: loadBusinesses,
      updateBusiness,
    }),
    [businesses, activeBusinessId, activeBusiness, loading, error, hasBusiness, currentUserId, ready, setActiveBusinessId, loadBusinesses, updateBusiness]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

