import * as React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional icon to display above the title (e.g. a Lucide icon element) */
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6"
      style={{ maxWidth: 320, margin: '0 auto' }}
    >
      {icon && (
        <div
          className="mb-4 flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text-light)',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          marginBottom: actionLabel ? '1.25rem' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
