import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Configures caching, retry logic, and default behaviors for all queries and mutations.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously called cacheTime
      
      // Retry failed requests up to 3 times
      retry: 3,
      
      // Exponential backoff with max 30 seconds
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus to reduce unnecessary requests
      refetchOnWindowFocus: false,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Shorter retry delay for mutations
      retryDelay: 1000,
    },
  },
});
