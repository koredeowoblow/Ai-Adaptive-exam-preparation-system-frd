import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router';

import { queryKeys } from '../shared/queryKeys';
import { authApi } from '../features/auth/api/auth.api';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    try {
      // Resolve user identity from server — backend is authoritative for roles.
      // Uses the same TanStack Query cache as the dashboard guard; no extra network
      // request if the user has already visited /dashboard in this session.
      const authData = await context.queryClient.fetchQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: async () => {
          const response = await authApi.getMe();
          return response.data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
      });

      if (!authData?.id) {
        throw redirect({ to: '/login' });
      }

      // Backend resolves the actual role. Frontend reads it from /auth/me.
      // If the API doesn't include a role yet, all authenticated users are blocked
      // from the admin UI — fail-secure by default.
      if (authData.role !== 'admin' && authData.role !== 'superAdmin') {
        throw redirect({ to: '/dashboard' });
      }

      return { adminUser: authData };
    } catch (error: any) {
      // Re-throw TanStack Router redirects unchanged
      if (isRedirect(error)) throw error;
      throw redirect({ to: '/login' });
    }
  },
});
