import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router';
import { queryKeys } from '../shared/queryKeys';
import { authApi } from '../features/auth/api/auth.api';

export const Route = createFileRoute('/')({ 
  beforeLoad: async ({ context }) => {
    try {
      const authData = await context.queryClient.fetchQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: async () => {
          const response = await authApi.getMe();
          return response.data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
      });

      // Already authenticated
      if (authData?.id) {
        if (authData.role === 'admin' || authData.role === 'superAdmin') {
          throw redirect({ to: '/admin' });
        }
        if (authData.role === 'student' && !authData.isOnboarded && !authData.departmentId) {
          throw redirect({ to: '/onboarding' });
        }
        throw redirect({ to: '/dashboard' });
      }


    } catch (error: any) {
      // Re-throw router redirects unchanged
      if (isRedirect(error)) throw error;
      // Not authenticated or API unreachable — go to login
    }

    // Unauthenticated: redirect to login
    throw redirect({ to: '/login' });
  },
  component: () => null,
});
