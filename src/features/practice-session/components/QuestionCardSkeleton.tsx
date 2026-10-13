import * as React from 'react';

export const QuestionCardSkeleton: React.FC = () => {
  return (
    <div style={{ width: '100%', marginBottom: 'var(--space-32)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      {/* Question Text Skeleton */}
      <div style={{ marginBottom: 'var(--space-64)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'flex-start' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 4,
            background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: '100%' }}>
            {/* Difficulty Badge Skeleton */}
            <div style={{
              width: '60px',
              height: '24px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.05)',
              alignSelf: 'flex-start',
            }}></div>
            {/* Header lines Skeleton */}
            <div style={{ width: '85%', height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
            <div style={{ width: '60%', height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>

      {/* Options Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', padding: 'var(--space-24)',
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Radio Button Skeleton */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginRight: 'var(--space-16)',
              background: 'rgba(255,255,255,0.05)',
            }} />

            {/* Option Letter Skeleton */}
            <span style={{
              marginRight: 'var(--space-12)',
              background: 'rgba(255,255,255,0.05)',
              width: 32, height: 32, display: 'flex', borderRadius: 'var(--radius-md)'
            }}></span>

            {/* Option Text Skeleton */}
            <div style={{ width: '50%', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
          </div>
        ))}
      </div>

      {/* Submit Button Skeleton */}
      <div style={{ marginTop: 'var(--space-48)', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '150px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-xl)' }}></div>
      </div>
    </div>
  );
};
