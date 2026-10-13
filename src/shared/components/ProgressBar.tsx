import * as React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string; // CSS color string or var
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color = 'var(--color-primary)', 
  height = '0.5rem'
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div 
      role="progressbar"
      aria-valuenow={safeProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', height, width: '100%', overflow: 'hidden' }}
    >
      <div 
        style={{ 
          width: `${safeProgress}%`, 
          backgroundColor: color,
          height: '100%',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.3s ease-in-out'
        }}
      />
    </div>
  );
};
