import * as React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton loader with shimmer animation.
 * Uses the `.skeleton` CSS class defined in index.css which applies a
 * left-to-right shimmer gradient (brief spec: skeleton loading pattern).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
};
