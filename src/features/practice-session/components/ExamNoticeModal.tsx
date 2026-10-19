import * as React from 'react';
import { ShieldCheck, Maximize2, Eye, MonitorOff, CopyX } from 'lucide-react';
import { Button } from '../../../shared/components/Button';

interface ExamNoticeModalProps {
  isOpen: boolean;
  onStartExam: (fullscreenGranted?: boolean) => void;
  onRequestFullscreen: () => Promise<boolean | void>;
  onExitExam?: () => void;
  courseTitle?: string;
  questionCount?: number;
}

export const ExamNoticeModal: React.FC<ExamNoticeModalProps> = ({
  isOpen,
  onStartExam,
  onRequestFullscreen,
  onExitExam,
  courseTitle,
  questionCount,
}) => {
  const [agreed, setAgreed] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    setIsEntering(true);
    let granted = false;
    try {
      const res = await onRequestFullscreen();
      granted = res !== false;
    } catch (e) {
      console.warn('Fullscreen request error:', e);
      granted = false;
    } finally {
      setIsEntering(false);
      onStartExam(granted);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-notice-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-20)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: 'var(--space-24) var(--space-32)',
            background: 'linear-gradient(135deg, rgba(3, 105, 161, 0.12) 0%, rgba(3, 105, 161, 0.04) 100%)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-16)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg, 12px)',
              backgroundColor: 'var(--color-primary-light, rgba(3, 105, 161, 0.15))',
              color: 'var(--color-primary, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(3, 105, 161, 0.12)',
                color: 'var(--color-primary, #0369a1)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              Proctored Environment Active
            </div>
            <h2
              id="exam-notice-title"
              className="h3"
              style={{ margin: 0, color: 'var(--color-text)' }}
            >
              Exam Rules & Security Agreement
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 'var(--space-24) var(--space-32)', display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
          {courseTitle && (
            <p className="body-base" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              You are about to start the examination for <strong>{courseTitle}</strong>
              {questionCount ? ` (${questionCount} questions)` : ''}. Please review the mandatory proctoring rules before proceeding:
            </p>
          )}

          {/* Rules List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-12)',
                padding: 'var(--space-12) var(--space-16)',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-surface-1, #f8fafc)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Maximize2 size={20} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  Mandatory Full Screen
                </strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  The exam must remain in full screen at all times. Exiting full screen pauses your exam and logs an integrity penalty.
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-12)',
                padding: 'var(--space-12) var(--space-16)',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-surface-1, #f8fafc)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Eye size={20} style={{ color: 'var(--color-warning, #f59e0b)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  Tab & Window Switching Monitored
                </strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  Switching to other browser tabs, minimizing the window, or navigating away is tracked and reported.
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-12)',
                padding: 'var(--space-12) var(--space-16)',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-surface-1, #f8fafc)',
                border: '1px solid var(--color-border)',
              }}
            >
              <MonitorOff size={20} style={{ color: 'var(--color-danger, #ef4444)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  Screenshots & Screen Captures Blocked
                </strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  Keyboard shortcuts for screenshots (PrintScreen, Snipping tool, etc.) are blocked and will trigger a security violation.
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-12)',
                padding: 'var(--space-12) var(--space-16)',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-surface-1, #f8fafc)',
                border: '1px solid var(--color-border)',
              }}
            >
              <CopyX size={20} style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  Copy, Paste & Context Menus Disabled
                </strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                  Copying exam questions or right-clicking is disabled. Formulas and calculation helpers are built directly into the exam editor.
                </span>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-12)',
              cursor: 'pointer',
              userSelect: 'none',
              padding: 'var(--space-12)',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: agreed ? 'var(--color-primary-light, rgba(3, 105, 161, 0.08))' : 'transparent',
              border: `1px solid ${agreed ? 'var(--color-primary)' : 'var(--color-border)'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              I understand and agree to adhere strictly to all exam integrity policies.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: 'var(--space-16) var(--space-32)',
            backgroundColor: 'var(--color-surface-0, #f8fafc)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: onExitExam ? 'space-between' : 'flex-end',
            gap: 'var(--space-12)',
          }}
        >
          {onExitExam && (
            <Button
              variant="ghost"
              size="md"
              disabled={isEntering}
              onClick={onExitExam}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel & Exit
            </Button>
          )}

          <Button
            variant="primary"
            size="lg"
            disabled={!agreed || isEntering}
            isLoading={isEntering}
            onClick={handleStart}
            style={{ minHeight: 48, fontWeight: 700, flex: onExitExam ? undefined : 1 }}
          >
            <Maximize2 size={18} style={{ marginRight: 8 }} />
            Enter Full Screen & Begin Exam
          </Button>
        </div>
      </div>
    </div>
  );
};
