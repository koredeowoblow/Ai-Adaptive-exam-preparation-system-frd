import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { LoginPayload } from '../../../types/auth.types';
import { queryKeys } from '../../../shared/queryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (response: any) => {
      const token = response?.data?.accessToken || response?.accessToken || response?.data?.tokens?.accessToken;

      if (token) {
        localStorage.setItem('accessToken', token);
      }

      // Invalidate the 'me' query so it re-fetches the authenticated user instead of using a stale unauthenticated cache.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
};
