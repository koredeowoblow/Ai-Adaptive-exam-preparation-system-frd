import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router';
import { OnboardingForm } from '../features/onboarding/components/OnboardingForm';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { queryKeys } from '../shared/queryKeys';
import { authApi } from '../features/auth/api/auth.api';

export const Route = createFileRoute('/onboarding')({
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
      if (!authData?.id) {
        throw redirect({ to: '/login' });
      }
      if (authData?.isOnboarded || authData?.departmentId || (authData?.role && authData.role !== 'student')) {
        throw redirect({ to: '/dashboard' });
      }

    } catch (error: any) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <div className="page-shell focused-task-layout relative min-h-screen">
      <div className="fixed top-5 right-6 z-50">
        <ThemeToggle />
      </div>
      <div className="focused-task-container">
        <OnboardingForm />
      </div>
    </div>
  ),
  pendingComponent: () => (
    <div className="page-shell focused-task-layout">
      <div className="focused-task-container">
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div style={{ height: '40px', background: 'var(--color-surface-raised)', borderRadius: '8px' }} className="animate-pulse" />
            <div style={{ height: '100px', background: 'var(--color-surface-raised)', borderRadius: '12px' }} className="animate-pulse" />
            <div style={{ height: '48px', background: 'var(--color-surface-raised)', borderRadius: '8px' }} className="animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  ),
});
