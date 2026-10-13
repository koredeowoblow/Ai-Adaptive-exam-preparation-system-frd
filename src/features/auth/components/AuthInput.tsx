import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  onClearError?: () => void;
  rightElement?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, type = 'text', error, onClearError, rightElement, className = '', onChange, ...rest }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onClearError) {
        onClearError();
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={id}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--auth-text-muted)] select-none"
          >
            {label}
          </label>
          {rightElement}
        </div>

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={id}
            type={computedType}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`w-full h-11 px-3.5 rounded-lg border text-[16px] leading-normal transition-colors outline-none
              bg-[var(--auth-input-bg)] text-[var(--auth-text)] placeholder-[var(--auth-placeholder)]
              ${
                error
                  ? 'border-[var(--auth-danger)] focus:ring-2 focus:ring-[var(--auth-danger)] focus:border-[var(--auth-danger)]'
                  : 'border-[var(--auth-border)] focus:ring-2 focus:ring-[var(--auth-accent)] focus:border-[var(--auth-accent)]'
              }
              ${isPassword ? 'pr-11' : ''} ${className}`}
            {...rest}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[var(--auth-text-muted)] hover:text-[var(--auth-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] rounded-r-lg"
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          )}
        </div>

        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1.5 text-xs font-medium text-[var(--auth-danger)] flex items-center gap-1.5"
          >
            <span aria-hidden="true">●</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
