import * as React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const fillColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5 tabular-nums font-medium">
          {label && <span>{label}</span>}
          {showLabel && <span className="ml-auto">{safeProgress}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={safeProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full overflow-hidden rounded-full bg-surface-1 border border-border/40 ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${fillColors[variant]}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
