import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { AuthLayout } from '../features/auth/components/AuthLayout';
import { WhatHappensNextCard } from '../features/auth/components/WhatHappensNextCard';

export const Route = createLazyFileRoute('/register')({
  component: RegisterRouteComponent,
});

function RegisterRouteComponent() {
  return (
    <AuthLayout
      title="Welcome to EduAdapt"
      subtitle="Join your classmates and start practicing curriculum exam questions."
      footerLink={
        <span>
          Already have an account?{' '}
          <Link
            to={'/login' as any}
            className="text-[var(--auth-link)] hover:text-[var(--auth-link-hover)] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--auth-link)] rounded"
          >
            Sign in
          </Link>
        </span>
      }
      sideContent={<WhatHappensNextCard />}
      mobileCollapsibleTitle="How onboarding works (3 steps)"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
