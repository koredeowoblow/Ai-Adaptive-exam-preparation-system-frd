import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      fullWidth = false,
      icon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = Boolean(disabled || isLoading);
    const resolvedVariant = variant === 'destructive' ? 'danger' : variant;

    const classNames = [
      'btn',
      `btn-${resolvedVariant}`,
      `btn-${size}`,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={isActuallyDisabled}
        aria-disabled={isActuallyDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span
            className="spinner mr-2"
            style={{
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
            aria-hidden="true"
          />
        ) : (
          icon && <span className="inline-flex shrink-0 items-center" aria-hidden="true">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
