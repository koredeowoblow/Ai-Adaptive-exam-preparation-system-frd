import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  isLoading = false,
  loadingText = 'Signing in…',
  variant = 'primary',
  disabled,
  className = '',
  ...rest
}) => {
  const isPrimary = variant === 'primary';

  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={{
        color: isPrimary ? 'var(--auth-accent-text)' : undefined,
      }}
      className={`w-full min-h-[44px] h-11 px-4 rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isPrimary
            ? 'bg-[var(--auth-accent)] hover:bg-[var(--auth-accent-hover)] focus:ring-[var(--auth-accent)] focus:ring-offset-[var(--auth-card-bg)] shadow-sm'
            : 'bg-[var(--auth-button-secondary-bg)] hover:bg-[var(--auth-button-secondary-hover)] text-[var(--auth-text)] border border-[var(--auth-border)] focus:ring-[var(--auth-accent)] focus:ring-offset-[var(--auth-card-bg)]'
        } ${className}`}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
