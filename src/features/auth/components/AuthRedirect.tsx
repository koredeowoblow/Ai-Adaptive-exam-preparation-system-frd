import * as React from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';

export const AuthRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  React.useEffect(() => {
    if (isLoading) return;

    // Do nothing on public auth pages or root index to prevent redirect loops.
    if (pathname === '/login' || pathname === '/register' || pathname === '/') return;

    // If no user or not authenticated, return to login page
    if (!isAuthenticated || !user) {
      router.navigate({ to: '/login', replace: true });
      return;
    }

    // Force un-onboarded students to complete onboarding
    if (user?.role === 'student' && !user.isOnboarded && !user.departmentId && pathname !== '/onboarding') {
      router.navigate({ to: '/onboarding', replace: true });
      return;
    }

    // Ensure admins are routed to the Admin Console
    if ((user?.role === 'admin' || user?.role === 'superAdmin') && (pathname === '/dashboard' || pathname === '/onboarding')) {
      router.navigate({ to: '/admin', replace: true });
      return;
    }

    // Prevent onboarded students from accessing /onboarding
    if (user?.role === 'student' && (user?.isOnboarded || user?.departmentId) && pathname === '/onboarding') {
      router.navigate({ to: '/dashboard', replace: true });
      return;
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);


  return null;
};
