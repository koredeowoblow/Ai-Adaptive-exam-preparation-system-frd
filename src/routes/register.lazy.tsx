import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { AuthLayout } from '../features/auth/components/AuthLayout';

export const Route = createLazyFileRoute('/register')({
  component: () => (
    <AuthLayout
      title="Welcome to EduAdapt"
      subtitle="Start your learning journey today"
      footerLink={
        <>
          Already have an account?{' '}
          <Link to={"/login" as any} className="text-[var(--color-primary)] font-semibold no-underline hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  ),
});
