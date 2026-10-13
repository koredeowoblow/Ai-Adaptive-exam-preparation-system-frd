import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { RegisterPayload } from '../../../types/auth.types';
import { queryKeys } from '../../../shared/queryKeys';

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (response: any) => {
      const token = response?.data?.accessToken || response?.accessToken || response?.data?.tokens?.accessToken;
      
      // Store token in localStorage as a fallback for cross-origin cookie issues
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      // Invalidate the 'me' query so it re-fetches the authenticated user instead of using a stale unauthenticated cache.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
};
