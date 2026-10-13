import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute
      staleTime: 60 * 1000,
      
      // Default retry strategy for failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 401 or 403 or 404
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
          return false;
        }
        return failureCount < 3;
      },
      
      refetchOnWindowFocus: false, // Prevents aggressive refetching unless explicit
    },
  },
});
