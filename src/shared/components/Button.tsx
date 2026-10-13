import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    // Maps to specific CSS classes defined in index.css
    // e.g. .btn-primary, .btn-sm
    const classNames = `btn btn-${variant} btn-${size} ${className || ''}`;

    return (
      <button ref={ref} className={classNames} disabled={isLoading || props.disabled} aria-busy={isLoading} {...props}>
        {isLoading ? <span className="spinner mr-2" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
