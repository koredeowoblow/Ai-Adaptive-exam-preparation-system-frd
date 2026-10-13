import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  tier?: 'primary' | 'secondary' | 'tertiary';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, tier = 'secondary', children, ...props }, ref) => {
    // Compose: base card class + optional tier modifier + optional interactive + caller overrides
    const classNames = [
      interactive ? 'card-interactive' : 'card',
      tier !== 'secondary' ? `card--${tier}` : '', // secondary is the default — no extra class needed
      className || '',
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
