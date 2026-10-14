import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from '@tanstack/react-router';
import { AlertCircle, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';

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
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors, touchedFields, isSubmitted },
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
    if (formErrors.email) {
      document.getElementById('email')?.focus();
    } else if (formErrors.password) {
      document.getElementById('password')?.focus();
    }
  };

  // Only show errors once user submits or field has been touched (prevents error on initial load)
  const emailError = (touchedFields.email || isSubmitted) ? errors.email?.message : undefined;
  const passwordError = (touchedFields.password || isSubmitted) ? errors.password?.message : undefined;

  const hasFieldErrors = Boolean(emailError || passwordError);
  const visibleServerError = !hasFieldErrors ? serverErrorState : null;

  return (
    <div className="w-full">
      {/* Header text */}
      <div className="mb-8">
        <h2 className="font-heading text-[34px] font-bold text-[#0B2239] dark:text-[#F8FAFC] tracking-tight leading-tight">
          Welcome back
        </h2>
        <p className="font-body text-[16px] text-[#52607A] dark:text-[#8FA3BB] mt-1.5 leading-normal">
          Sign in to pick up where you stopped.
        </p>
      </div>

      <form
        aria-label="Sign in to EduAdapt"
        noValidate
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-5 w-full"
      >
        {/* Email field */}
        <div className="w-full">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#0B2239] dark:text-[#F8FAFC] mb-1.5 select-none"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@university.edu.ng"
            autoComplete="username"
            inputMode="email"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`w-full h-[52px] px-4 rounded-[12px] border text-[16px] transition-colors outline-none
              bg-white dark:bg-[#0F2B45] text-[#0B2239] dark:text-[#F8FAFC]
              placeholder:text-[#8FA3BB] dark:placeholder:text-[#64748B]
              ${
                emailError
                  ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626]'
                  : 'border-[#B9C3D2] dark:border-[#2E4A66] focus:ring-2 focus:ring-[#0E6BA8] focus:border-[#0E6BA8] focus:ring-offset-2 dark:focus:ring-offset-[#0B1726]'
              }`}
            {...register('email', {
              onChange: () => {
                clearErrors('email');
                clearServerError();
              },
            })}
          />
          {emailError && (
            <p
              id="email-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-[#DC2626] flex items-center gap-1.5"
            >
              <span aria-hidden="true">●</span>
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#0B2239] dark:text-[#F8FAFC] select-none"
            >
              Password
            </label>
            <Link
              to={'/forgot-password' as any}
              className="text-sm font-medium text-[#0E6BA8] hover:text-[#0A5588] dark:text-[#38BDF8] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] rounded select-none"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              className={`w-full h-[52px] px-4 pr-12 rounded-[12px] border text-[16px] transition-colors outline-none
                bg-white dark:bg-[#0F2B45] text-[#0B2239] dark:text-[#F8FAFC]
                placeholder:text-[#8FA3BB] dark:placeholder:text-[#64748B]
                ${
                  passwordError
                    ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#B9C3D2] dark:border-[#2E4A66] focus:ring-2 focus:ring-[#0E6BA8] focus:border-[#0E6BA8] focus:ring-offset-2 dark:focus:ring-offset-[#0B1726]'
                }`}
              {...register('password', {
                onChange: () => {
                  clearErrors('password');
                  clearServerError();
                },
              })}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-[#52607A] dark:text-[#8FA3BB] hover:text-[#0B2239] dark:hover:text-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] rounded-lg"
            >
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>

          {passwordError && (
            <p
              id="password-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-[#DC2626] flex items-center gap-1.5"
            >
              <span aria-hidden="true">●</span>
              <span>{passwordError}</span>
            </p>
          )}
        </div>

        {/* Server error */}
        {visibleServerError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 text-[#DC2626] dark:text-[#FCA5A5] text-sm flex items-start gap-2.5"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 flex items-center justify-between gap-3">
              <span>{visibleServerError.message}</span>
              {visibleServerError.isNetworkError && (
                <button
                  type="button"
                  onClick={() => onSubmit(getValues())}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FCA5A5]/40 hover:bg-[#DC2626] hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  <span>Try again</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sign in button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-[52px] rounded-[12px] bg-[#0E6BA8] hover:bg-[#0A5588] text-white font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] focus:ring-offset-2 dark:focus:ring-offset-[#0B1726] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm select-none"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#D5DCE6] dark:border-[#2E4A66]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-[#0B1726] text-[#52607A] dark:text-[#8FA3BB] font-medium select-none">
              or
            </span>
          </div>
        </div>

        {/* Google button */}
        <button
          type="button"
          disabled
          aria-label="Google sign-in, coming soon"
          className="w-full h-[52px] rounded-[12px] border border-[#D5DCE6] dark:border-[#2E4A66] bg-[#F6F8FB] dark:bg-[#0F2B45] text-[#52607A] dark:text-[#8FA3BB] font-medium text-sm flex items-center justify-center gap-3 cursor-not-allowed opacity-90 transition-colors select-none"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.54 0 2.92.54 4.02 1.43l3.01-3.01C17.21 1.74 14.77 1 12 1 7.42 1 3.51 3.6 1.63 7.37l3.65 2.83C6.16 7.42 8.84 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.94 3.71-8.7z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.8c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.63 7.37C.6 9.44 0 11.75 0 14.2s.6 4.76 1.63 6.83l3.65-2.83z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.45 1.16-4.22 1.16-3.16 0-5.84-2.42-6.72-5.7L1.63 17.5C3.51 21.27 7.42 23 12 23z"
            />
          </svg>
          <span>Google sign-in, coming soon</span>
        </button>

        {/* Bottom line */}
        <p className="text-center text-sm text-[#52607A] dark:text-[#8FA3BB] mt-2">
          New to EduAdapt?{' '}
          <Link
            to={'/register' as any}
            className="text-[#0E6BA8] dark:text-[#38BDF8] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#0E6BA8] rounded"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};
