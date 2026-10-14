import { redirect, isRedirect } from '@tanstack/react-router';
import { queryKeys } from '../../../shared/queryKeys';
import { authApi } from '../api/auth.api';
import type { RouterContext } from '../../../routes/__root';

export interface GuardOptions {
  allowedRoles?: ('student' | 'admin' | 'superAdmin')[];
  requireOnboarded?: boolean;
}

export async function requireAuth(context: RouterContext, options: GuardOptions = {}) {
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

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
    if (!authData || !authData.id) {
      if (currentPath && currentPath !== '/login' && currentPath !== '/') {
        try { sessionStorage.setItem('auth_redirect', currentPath); } catch {}
      }
      throw redirect({ to: '/login' });
    }

    if (options.allowedRoles && (!authData.role || !options.allowedRoles.includes(authData.role))) {
      if (authData.role === 'admin' || authData.role === 'superAdmin') {
        throw redirect({ to: '/admin' });
      }
      throw redirect({ to: '/dashboard' });
    }

    if (options.requireOnboarded && authData.role === 'student' && !authData.isOnboarded && !authData.departmentId) {
      throw redirect({ to: '/onboarding' });
    }

    return authData;
  } catch (error: any) {
    if (isRedirect(error)) throw error;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : undefined;
    if (currentPath && currentPath !== '/login' && currentPath !== '/') {
      try { sessionStorage.setItem('auth_redirect', currentPath); } catch {}
    }
    throw redirect({ to: '/login' });
  }
}
