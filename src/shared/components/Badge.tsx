import * as React from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-1 text-text-secondary border-border',
    primary: 'bg-primary-light text-primary border-primary/20',
    success: 'bg-success-light text-success border-success/20',
    warning: 'bg-warning-light text-warning border-warning/20',
    danger: 'bg-danger-light text-danger border-danger/20',
    info: 'bg-info-light text-info border-info/20',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 font-medium leading-tight',
    md: 'text-[12px] px-2.5 py-0.5 font-medium leading-normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} tracking-normal select-none tabular-nums ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};
