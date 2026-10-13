import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi, type OnboardingPayload } from "../api/onboarding.api";
import { queryKeys } from '../../../shared/queryKeys';

export const useOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OnboardingPayload) => onboardingApi.completeOnboarding(payload),
    onSuccess: () => {
      // Refresh user profile/me
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
};
