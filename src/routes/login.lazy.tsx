import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthLayout } from '../features/auth/components/AuthLayout';

export const Route = createLazyFileRoute('/login')({
  component: () => (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your learning journey"
      footerLink={
        <>
          New to EduAdapt?{' '}
          <Link to={"/register" as any} className="text-[var(--color-primary)] font-semibold no-underline hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  ),
});
