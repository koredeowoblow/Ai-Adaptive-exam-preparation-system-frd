import * as React from 'react';

export const EduAdaptLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.35" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.65" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
    <path
      d="M10 6.5H14M6.5 10V14M17.5 10V14M10 17.5H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
