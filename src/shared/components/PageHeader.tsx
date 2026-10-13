import * as React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-16)',
        marginBottom: 'var(--space-24)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 var(--space-4) 0',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
          {children}
        </div>
      )}
    </div>
  );
};
