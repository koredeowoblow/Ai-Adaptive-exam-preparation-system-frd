import { createFileRoute, redirect } from '@tanstack/react-router';
import { OnboardingForm } from '../features/onboarding/components/OnboardingForm';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { requireAuth } from '../features/auth/utils/authGuard';

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async ({ context }) => {
    const authData = await requireAuth(context);
    if (authData?.isOnboarded || authData?.departmentId || (authData?.role && authData.role !== 'student')) {
      throw redirect({ to: '/dashboard' });
    }
    return { authData };
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
