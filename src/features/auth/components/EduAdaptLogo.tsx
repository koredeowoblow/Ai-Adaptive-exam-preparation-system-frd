import * as React from 'react';

interface EduAdaptLogoProps {
  className?: string;
  size?: number;
  rounded?: boolean;
}

export const EduAdaptLogo: React.FC<EduAdaptLogoProps> = ({
  className = '',
  size = 32,
  rounded = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <defs>
      <linearGradient id="eduGradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="tasselGradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="shadowLogo" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* App Icon Background */}
    {rounded && <rect width="64" height="64" rx="15" fill="url(#eduGradLogo)" />}
    {rounded && (
      <rect
        x="0.5"
        y="0.5"
        width="63"
        height="63"
        rx="14.5"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    )}

    {/* Graduation Cap */}
    <g filter={rounded ? 'url(#shadowLogo)' : undefined}>
      {/* Cap Skull Base */}
      <path
        d="M20 33 V41 C20 46.5, 44 46.5, 44 41 V33"
        fill="none"
        stroke={rounded ? '#ffffff' : 'currentColor'}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mortarboard Diamond Top */}
      <path
        d="M32 17 L52 26.5 L32 36 L12 26.5 Z"
        fill={rounded ? '#ffffff' : 'currentColor'}
      />

      {/* Tassel Ribbon & Drop */}
      <path
        d="M47.5 29 V42 M46 42 H49"
        stroke="url(#tasselGradLogo)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="26.5" r="2.2" fill={rounded ? '#0369a1' : 'var(--color-primary, #0284c7)'} />
    </g>

    {/* AI Adaptive Sparkle (top right) */}
    <path
      d="M50 9 Q50 15 56 15 Q50 15 50 21 Q50 15 44 15 Q50 15 50 9 Z"
      fill="#fbbf24"
    />
  </svg>
);
