import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useLogin } from '../hooks/useLogin';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  useDocumentTitle('Sign In — EduAdapt');
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (res: any) => { 
        import('sonner').then(({ toast }) => toast.success('Login successful!'));
        const user = res?.data?.user;
        if (user?.role === 'admin' || user?.role === 'superAdmin') {
          navigate({ to: '/admin' });
        } else {
          navigate({ to: '/dashboard' });
        }
      },
      onError: (err: any) => {
        import('sonner').then(({ toast }) => toast.error(err?.response?.data?.message || 'Login failed.'));
      }
    });
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      <Input
        label="Email address"
        type="email"
        id="email"
        placeholder="you@university.edu"
        autoComplete="email"
        className="input-premium"
        {...register('email')}
        error={errors.email?.message}
      />

      {/* Password field with Forgot Password link */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            Password
          </label>
          <button
            type="button"
            onClick={() => toast.info('Password reset is managed by your institution administrator. Please contact your department support.')}
            className="hover:underline"
            style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          >
            Forgot password?
          </button>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className={`input input-premium${errors.password ? ' border-danger' : ''}`}
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem', fontWeight: 500, color: 'var(--color-danger)', marginTop: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.password.message}
          </span>
        )}
      </div>

      {/* API error */}
      {error && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'var(--color-danger-light)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 4,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {(error as {response?: {data?: {message?: string}}})?.response?.data?.message || 'Login failed. Please check your credentials.'}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        variant="primary"
        style={{ width: '100%', marginTop: 16 }}
        isLoading={isPending}
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
};
