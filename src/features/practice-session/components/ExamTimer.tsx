import * as React from 'react';
import { useStopwatch } from '../../../shared/hooks/useStopwatch';

export interface ExamTimerRef {
  getElapsedSeconds: () => number;
  reset: () => void;
}

export const ExamTimer = React.memo(React.forwardRef<ExamTimerRef, {}>((_props, ref) => {
  const { getElapsedSeconds, reset, formattedTime } = useStopwatch();

  React.useImperativeHandle(ref, () => ({
    getElapsedSeconds,
    reset,
  }));

  return (
    <div 
      title="Continuous Real-Time Timer (Pausing Disabled)"
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.25rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '2rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-sm)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
      }}
      aria-live="off" // Prevent screen reader from announcing every second
    >
      <span 
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger)',
          display: 'inline-block',
          animation: 'pulse 1.5s infinite',
        }}
        aria-hidden="true"
      />
      <svg 
        width="16" height="16" viewBox="0 0 24 24" 
        fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formattedTime}</span>
    </div>
  );
}));

ExamTimer.displayName = 'ExamTimer';
