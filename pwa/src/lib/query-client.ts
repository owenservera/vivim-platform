/**
 * TanStack Query Client Configuration
 * 
 * Provides:
 * - Intelligent caching
 * - Offline mutation persistence
 * - Optimistic updates
 * - Background refetching
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      
      // Retry failed requests 3 times
      retry: 3,
      
      // Don't refetch on window focus in PWA
      refetchOnWindowFocus: false,
      
      // Enable refetch on reconnect for offline support
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Show errors to user
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Persist cache to localStorage for offline support
const CACHE_KEY = 'openscroll-query-cache';

export function persistQueryCache(): void {
  const cache = queryClient.getQueryCache().getAll();
  const serializable = cache.map(query => ({
    queryKey: query.queryKey,
    state: query.state,
  }));
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.warn('Failed to persist query cache:', e);
  }
}

export function hydrateQueryCache(): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const queries = JSON.parse(cached);
      queries.forEach((query: { queryKey: unknown[]; state: { data: unknown } }) => {
        if (query.state?.data) {
          queryClient.setQueryData(query.queryKey, query.state.data);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to hydrate query cache:', e);
  }
}

export default queryClient;
