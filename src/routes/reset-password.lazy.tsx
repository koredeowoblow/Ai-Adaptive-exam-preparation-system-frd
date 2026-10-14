import * as React from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AuthLayout } from '../features/auth/components/AuthLayout';
import { ForgotPasswordCard } from '../features/auth/components/ForgotPasswordCard';

const SampleQuestionSection = React.lazy(() =>
  import('../features/auth/components/SampleQuestionSection').then((m) => ({
    default: m.SampleQuestionSection,
  }))
);

export const Route = createLazyFileRoute('/reset-password')({
  component: ResetPasswordRouteComponent,
});

function ResetPasswordRouteComponent() {
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Complete your password reset verification."
      footerLink={
        <span>
          Finished resetting?{' '}
          <Link
            to={'/login' as any}
            className="text-[var(--auth-link)] hover:text-[var(--auth-link-hover)] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--auth-link)] rounded"
          >
            Sign in
          </Link>
        </span>
      }
      sideContent={
        <React.Suspense
          fallback={
            <div className="w-full h-80 rounded-2xl border border-[var(--auth-card-border)] bg-[var(--auth-side-bg)] animate-pulse" />
          }
        >
          <SampleQuestionSection />
        </React.Suspense>
      }
      mobileCollapsibleTitle="Try a sample question (no account needed)"
    >
      <ForgotPasswordCard />
    </AuthLayout>
  );
}
