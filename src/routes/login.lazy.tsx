import * as React from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthLayout } from '../features/auth/components/AuthLayout';

// Lazy load sample question component so initial mobile bundle is small and no layout shift
const SampleQuestionSection = React.lazy(() =>
  import('../features/auth/components/SampleQuestionSection').then((m) => ({
    default: m.SampleQuestionSection,
  }))
);

export const Route = createLazyFileRoute('/login')({
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  return (
    <AuthLayout
      title="Sign in to EduAdapt"
      subtitle="Access your course practice and review past exams."
      footerLink={
        <span>
          New here?{' '}
          <Link
            to={'/register' as any}
            className="text-[var(--auth-accent)] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--auth-accent)] rounded"
          >
            Create an account
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
      <LoginForm />
    </AuthLayout>
  );
}
