import * as React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  actions,
  children,
  className = '',
}) => {
  return (
    <header className={`flex flex-col gap-3 mb-6 sm:mb-8 ${className}`}>
      {breadcrumb && (
        <nav aria-label="Breadcrumb" className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
          {breadcrumb}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-text-primary tracking-[-0.01em] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-text-secondary leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {(actions || children) && (
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            {actions}
            {children}
          </div>
        )}
      </div>
    </header>
  );
};
