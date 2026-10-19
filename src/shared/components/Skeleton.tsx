import * as React from 'react';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: number | string;
  height?: number | string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  style = {},
  variant = 'rect',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-lg',
    circle: 'rounded-full shrink-0',
    card: 'rounded-xl h-36 w-full',
  };

  const combinedStyles: React.CSSProperties = {
    ...style,
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={combinedStyles}
      aria-hidden="true"
      role="presentation"
    />
  );
};
