import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from '@tanstack/react-router';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';

const loginSchema = z.object({
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

type LoginFormData = z.infer<typeof loginSchema>;

function parseServerErrorMessage(error: any): { message: string; isNetworkError: boolean } {
  if (!error) return { message: '', isNetworkError: false };

  if (
    error.code === 'ECONNABORTED' ||
    error.message?.includes('Network Error') ||
    !error.response
  ) {
    return {
      message: 'Cannot reach the server. Check your connection and try again.',
      isNetworkError: true,
    };
  }

  const status = error.response?.status;
  if (status === 401) {
    return {
      message: 'That email and password do not match.',
      isNetworkError: false,
    };
  }
  if (status === 429) {
    return {
      message: 'Too many attempts. Wait a minute and try again.',
      isNetworkError: false,
    };
  }

  return {
    message: 'Something went wrong on our side. Try again.',
    isNetworkError: false,
  };
}

export const LoginForm: React.FC = () => {
  useDocumentTitle('Sign In — EduAdapt');
  const navigate = useNavigate();
  const { mutate: login, isPending, error: mutationError, reset: resetMutation } = useLogin();
  const [serverErrorState, setServerErrorState] = React.useState<{ message: string; isNetworkError: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Keep server error synced with mutation
  React.useEffect(() => {
    if (mutationError) {
      setServerErrorState(parseServerErrorMessage(mutationError));
    }
  }, [mutationError]);

  const clearServerError = React.useCallback(() => {
    if (serverErrorState || mutationError) {
      setServerErrorState(null);
      resetMutation();
    }
  }, [serverErrorState, mutationError, resetMutation]);

  const onSubmit = (data: LoginFormData) => {
    clearServerError();
    login(data, {
      onSuccess: (res: any) => {
        import('sonner').then(({ toast }) => toast.success('Login successful!'));
        const user = res?.data?.user;
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectParam = searchParams?.get('redirect') || searchParams?.get('returnTo');
        const savedRedirect = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('auth_redirect') : null;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('auth_redirect');
        }

        const destination = redirectParam || savedRedirect;
        const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

        if (isAdmin) {
          if (destination && destination.startsWith('/admin')) {
            navigate({ to: destination as any });
          } else {
            navigate({ to: '/admin' });
          }
        } else {
          if (destination && !destination.startsWith('/admin') && destination !== '/login' && destination !== '/') {
            navigate({ to: destination as any });
          } else if (user?.isOnboarded || user?.departmentId) {
            navigate({ to: '/dashboard' });
          } else {
            navigate({ to: '/onboarding' });
          }
        }
      },
      onError: (err: any) => {
        setServerErrorState(parseServerErrorMessage(err));
      },
    });
  };

  const onInvalid = (formErrors: Record<string, any>) => {
    // Focus first invalid input on submit
    if (formErrors.email) {
      document.getElementById('email')?.focus();
    } else if (formErrors.password) {
      document.getElementById('password')?.focus();
    }
  };

  const hasFieldErrors = Boolean(errors.email || errors.password);
  // Show server error only if no field validation error is currently showing
  const visibleServerError = !hasFieldErrors ? serverErrorState : null;

  return (
    <form
      aria-label="Sign in to EduAdapt"
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-5 w-full"
    >
      <AuthInput
        label="Email address"
        type="email"
        id="email"
        placeholder="you@university.edu.ng"
        autoComplete="username"
        inputMode="email"
        autoFocus
        error={errors.email?.message}
        onClearError={() => {
          clearErrors('email');
          clearServerError();
        }}
        {...register('email')}
      />

      <AuthInput
        label="Password"
        type="password"
        id="password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        onClearError={() => {
          clearErrors('password');
          clearServerError();
        }}
        rightElement={
          <Link
            to={'/forgot-password' as any}
            className="text-xs text-[var(--auth-accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--auth-accent)] rounded select-none"
          >
            Forgot password?
          </Link>
        }
        {...register('password')}
      />

      {/* Server error (shown once, above the button) */}
      {visibleServerError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-[var(--auth-danger-border)] bg-[var(--auth-danger-bg)] text-[var(--auth-danger)] text-sm flex items-start gap-2.5"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 flex items-center justify-between gap-3">
            <span>{visibleServerError.message}</span>
            {visibleServerError.isNetworkError && (
              <button
                type="button"
                onClick={() => onSubmit(getValues())}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[var(--auth-danger-border)] hover:bg-[var(--auth-danger)] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw size={12} aria-hidden="true" />
                <span>Try again</span>
              </button>
            )}
          </div>
        </div>
      )}

      <AuthButton type="submit" isLoading={isPending} loadingText="Signing in…">
        Sign in
      </AuthButton>
    </form>
  );
};
