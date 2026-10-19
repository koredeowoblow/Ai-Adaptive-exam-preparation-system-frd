import * as React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: { label: string; onClick: () => void | Promise<void> };
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  action,
  icon,
  className = '',
}) => {
  const finalActionLabel = actionLabel || action?.label;
  const handleAction = onAction || action?.onClick;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-6 max-w-[420px] mx-auto ${className}`}
    >
      {icon && (
        <div
          className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-surface-1 text-text-muted shrink-0"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-primary mb-1.5 leading-snug">
        {title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-[340px]">
        {description}
      </p>
      {finalActionLabel && handleAction && (
        <Button onClick={handleAction} variant="primary" size="md">
          {finalActionLabel}
        </Button>
      )}
    </div>
  );
};
