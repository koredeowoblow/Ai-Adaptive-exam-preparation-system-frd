import * as React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export type IntegrityViolationType = 'tab_switch' | 'copy_paste' | 'screenshot' | 'right_click' | 'window_blur';

interface IntegrityWarningBannerProps {
  violationType: IntegrityViolationType | null;
  onDismiss: () => void;
}

export const IntegrityWarningBanner: React.FC<IntegrityWarningBannerProps> = ({ 
  violationType, 
  onDismiss 
}) => {
  if (!violationType) return null;

  const messages: Record<IntegrityViolationType, string> = {
    tab_switch: "Warning: Leaving the exam tab is recorded. Please stay focused on this window.",
    copy_paste: "Warning: Copying, cutting, or pasting is not permitted during proctored exams.",
    screenshot: "Security Alert: Screenshot attempt detected and blocked. Screen capture is strictly prohibited.",
    right_click: "Notice: Right-click context menus are disabled during proctored exams.",
    window_blur: "Warning: Exam window lost focus. Please remain in the exam window."
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
        marginBottom: 'var(--space-24)',
        boxShadow: 'var(--shadow-sm)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
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
        <X size={18} />
      </button>
    </div>
  );
};
