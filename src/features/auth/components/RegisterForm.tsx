import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle, Check, Circle } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  useDocumentTitle('Create Account — EduAdapt');
  const navigate = useNavigate();
  const { mutate: registerMutation, isPending, error: mutationError, reset: resetMutation } = useRegister();
  const [serverErrorMessage, setServerErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const passwordValue = watch('password') || '';

  // Real-time password rules
  const rules = [
    { label: 'At least 6 characters', valid: passwordValue.length >= 6 },
    { label: 'Contains at least one letter', valid: /[a-zA-Z]/.test(passwordValue) },
  ];

  React.useEffect(() => {
    if (mutationError) {
      const err = mutationError as any;
      setServerErrorMessage(
        err?.response?.data?.message || 'Registration could not be completed. Please try again.'
      );
    }
  }, [mutationError]);

  const clearServerError = React.useCallback(() => {
    if (serverErrorMessage || mutationError) {
      setServerErrorMessage(null);
      resetMutation();
    }
  }, [serverErrorMessage, mutationError, resetMutation]);

  const onSubmit = (data: RegisterFormData) => {
    clearServerError();
    registerMutation(data, {
      onSuccess: () => {
        import('sonner').then(({ toast }) => toast.success('Account created successfully!'));
        navigate({ to: '/dashboard' });
      },
      onError: (err: any) => {
        setServerErrorMessage(
          err?.response?.data?.message || 'Registration failed. Please check your details.'
        );
      },
    });
  };

  const onInvalid = (formErrors: Record<string, any>) => {
    if (formErrors.name) {
      document.getElementById('name')?.focus();
    } else if (formErrors.email) {
      document.getElementById('email')?.focus();
    } else if (formErrors.password) {
      document.getElementById('password')?.focus();
    }
  };

  const hasFieldErrors = Boolean(errors.name || errors.email || errors.password);
  const visibleServerError = !hasFieldErrors ? serverErrorMessage : null;

  return (
    <form
      aria-label="Create your EduAdapt account"
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-4.5 w-full"
    >
      <AuthInput
        label="Full name"
        type="text"
        id="name"
        placeholder="Amina Bello"
        autoComplete="name"
        autoFocus
        error={errors.name?.message}
        onClearError={() => {
          clearErrors('name');
          clearServerError();
        }}
        {...register('name')}
      />

      <AuthInput
        label="Email address"
        type="email"
        id="email"
        placeholder="you@university.edu.ng"
        autoComplete="username"
        inputMode="email"
        error={errors.email?.message}
        onClearError={() => {
          clearErrors('email');
          clearServerError();
        }}
        {...register('email')}
      />

      <div>
        <AuthInput
          label="Password"
          type="password"
          id="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          onClearError={() => {
            clearErrors('password');
            clearServerError();
          }}
          {...register('password')}
        />

        {/* Dynamic Live Password Rule List */}
        <div className="mt-2.5 p-2.5 rounded-lg border border-[var(--auth-card-border)] bg-[var(--auth-side-bg)]/60 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--auth-text-muted)] m-0">
            Password requirements:
          </p>
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              {rule.valid ? (
                <Check size={13} className="text-[var(--auth-success)] shrink-0" aria-hidden="true" />
              ) : (
                <Circle size={10} className="text-[var(--auth-placeholder)] shrink-0" aria-hidden="true" />
              )}
              <span
                className={
                  rule.valid ? 'text-[var(--auth-text)] font-medium' : 'text-[var(--auth-text-muted)]'
                }
              >
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {visibleServerError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-[var(--auth-danger-border)] bg-[var(--auth-danger-bg)] text-[var(--auth-danger)] text-sm flex items-start gap-2.5"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{visibleServerError}</span>
        </div>
      )}

      <AuthButton type="submit" isLoading={isPending} loadingText="Creating account…">
        Create account
      </AuthButton>
    </form>
  );
};
