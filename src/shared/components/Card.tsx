import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  tier?: 'primary' | 'secondary' | 'tertiary';
  as?: React.ElementType;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', interactive = false, tier = 'secondary', as: Component = 'div', children, ...props }, ref) => {
    // 12px radius, border-first, subtle hover lift if interactive
    const tierClasses = {
      primary: 'bg-surface border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
      secondary: 'bg-surface border-border',
      tertiary: 'bg-surface-0 border-border/80',
    };

    const interactiveClass = interactive
      ? 'cursor-pointer transition-all duration-150 ease-out hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:translate-y-[1px]'
      : '';

    const combinedClasses = [
      'rounded-xl border p-5 sm:p-6',
      tierClasses[tier],
      interactiveClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Component ref={ref} className={combinedClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
