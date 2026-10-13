import * as React from 'react';

interface IntegrityWarningBannerProps {
  violationType: 'tab_switch' | 'copy_paste' | null;
  onDismiss: () => void;
}

export const IntegrityWarningBanner: React.FC<IntegrityWarningBannerProps> = ({ 
  violationType, 
  onDismiss 
}) => {
  if (!violationType) return null;

  const messages = {
    tab_switch: "Warning: Leaving the exam tab is recorded. Please stay focused on this window.",
    copy_paste: "Warning: Copy-pasting is not permitted during the exam."
  };

  return (
    <div 
      role="alert"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--color-danger-light)',
        border: '1px solid var(--color-danger)',
        color: 'var(--color-danger)',
        padding: 'var(--space-12) var(--space-16)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-32)',
        boxShadow: 'var(--shadow-sm)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="body-base" style={{ fontWeight: 600 }}>{messages[violationType]}</span>
      </div>
      <button 
        onClick={onDismiss}
        aria-label="Dismiss warning"
        style={{ 
          background: 'none', border: 'none', color: 'currentColor', 
          cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s ease'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
};
