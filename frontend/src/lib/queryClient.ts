import { QueryClient } from '@tanstack/react-query'

// Create a client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes cache time
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after last use
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
