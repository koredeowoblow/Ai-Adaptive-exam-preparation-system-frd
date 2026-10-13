import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { queryKeys } from '../../../shared/queryKeys';
import type { AuthUser } from '../../../types/auth.types';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data;
    },
    // Prevent retries on 401s
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = data as AuthUser | undefined;
  const isAuthenticated = !!user;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      authApi.logout();
    },
    onSuccess: () => {
      // Clear the token from localStorage
      localStorage.removeItem('accessToken');
      
      // Clear the user from cache and maybe invalidate other queries
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      // Use standard window navigation for now
      window.location.href = '/login';
    }
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
