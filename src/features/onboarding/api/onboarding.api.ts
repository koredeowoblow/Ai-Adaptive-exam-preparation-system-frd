import { apiClient } from '../../../shared/api-client/client';

export interface OnboardingPayload {
  departmentId?: string;
  level?: '100L' | '200L' | '300L' | '400L';
  courseIds?: string[];
}

export const onboardingApi = {
  completeOnboarding: async (payload: OnboardingPayload): Promise<any> => {
    return apiClient.post('/students/onboarding', payload);
  },
};

