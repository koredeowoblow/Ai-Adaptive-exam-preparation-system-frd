import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useRegister } from '../hooks/useRegister';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  useDocumentTitle('Create Account — EduAdapt');
  const navigate = useNavigate();
  const { mutate: registerMutation, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation(data, {
      onSuccess: () => { 
        import('sonner').then(({ toast }) => toast.success('Account created successfully!'));
        navigate({ to: '/dashboard' }); 
      },
      onError: (err: any) => {
        import('sonner').then(({ toast }) => toast.error(err?.response?.data?.message || 'Registration failed.'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      <Input
        label="Full name"
        type="text"
        id="name"
        placeholder="Jane Doe"
        autoComplete="name"
        className="input-premium"
        {...register('name')}
        error={errors.name?.message}
      />

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

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            Password
          </label>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
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
          {(error as {response?: {data?: {message?: string}}})?.response?.data?.message || 'Registration failed. Please check your details.'}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        variant="primary"
        style={{ width: '100%', marginTop: 16 }}
        isLoading={isPending}
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
};
