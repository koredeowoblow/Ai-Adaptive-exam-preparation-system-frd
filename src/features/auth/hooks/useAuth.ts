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
      try {
        await authApi.logout();
      } catch {
        // Ignored: cleanup runs regardless in finally
      } finally {
        localStorage.removeItem('accessToken');
        queryClient.setQueryData(queryKeys.auth.me(), null);
        queryClient.clear();
      }
    },
    onSettled: () => {
      window.location.href = '/login';
    },
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
