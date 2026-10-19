import * as React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`page-container ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
