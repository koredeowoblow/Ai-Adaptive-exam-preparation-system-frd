import * as React from 'react';

export interface SessionProgressProps {
  questionsAnswered: number;
  totalQuestions: number;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  questionsAnswered,
  totalQuestions,
}) => {
  const progress = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;
  const currentQ = Math.min(questionsAnswered + 1, totalQuestions);

  return (
    <div style={{ marginBottom: 'var(--space-32)' }}>
      {/* Progress Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Question {currentQ} <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>/ {totalQuestions}</span>
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div style={{ height: 8, background: 'var(--color-background-soft)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', width: `${progress}%`, 
          background: 'var(--color-primary)', borderRadius: 4, 
          transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }} />
      </div>

      {/* Grid of question dots (optional premium feature) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--space-16)' }}>
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const isAnswered = idx < questionsAnswered;
          const isCurrent = idx === questionsAnswered;
          return (
            <div 
              key={idx}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                background: isCurrent ? 'var(--color-primary)' : isAnswered ? 'rgba(30,58,138,0.1)' : 'var(--color-background-soft)',
                color: isCurrent ? '#fff' : isAnswered ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: isCurrent ? 'none' : isAnswered ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              }}
            >
              {idx + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};
