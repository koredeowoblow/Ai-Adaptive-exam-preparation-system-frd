import * as React from 'react';
import { ShieldAlert, Maximize2, LogOut, Eye, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/components/Button';

interface FullscreenEnforcerOverlayProps {
  isVisible: boolean;
  onRequestFullscreen: () => Promise<boolean | void>;
  onExitExam?: () => void;
  onContinueWindowed?: () => void;
}

export const FullscreenEnforcerOverlay: React.FC<FullscreenEnforcerOverlayProps> = ({
  isVisible,
  onRequestFullscreen,
  onExitExam,
  onContinueWindowed,
}) => {
  const [isReturning, setIsReturning] = React.useState(false);
  const [fullscreenError, setFullscreenError] = React.useState<string | null>(null);

  if (!isVisible) return null;

  const handleReturn = async () => {
    setIsReturning(true);
    setFullscreenError(null);
    try {
      const res = await onRequestFullscreen();
      // If it returned false, fullscreen request failed
      if (res === false) {
        setFullscreenError(
          'Your browser or window setup did not grant Full Screen permission. You can continue in windowed mode below.'
        );
      }
    } catch (e: any) {
      console.warn('Fullscreen resume error:', e);
      setFullscreenError(
        'Unable to enter full screen automatically. Please allow full screen permissions or continue in windowed mode.'
      );
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fullscreen-enforce-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-20)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '2px solid var(--color-danger, #ef4444)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
          padding: 'var(--space-32)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-16)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--color-danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <div>
          <h2
            id="fullscreen-enforce-title"
            className="h3"
            style={{ margin: '0 0 var(--space-8)', color: 'var(--color-text)' }}
          >
            Full Screen Mode Required
          </h2>
          <p
            className="body-base"
            style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}
          >
            You are currently outside full screen mode. In accordance with exam proctoring rules, you must either return to full screen or proceed with logged window monitoring.
          </p>
        </div>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '0.8125rem',
            color: 'var(--color-danger, #ef4444)',
            fontWeight: 600,
            width: '100%',
          }}
        >
          Warning: Window and tab activity is actively logged in your session integrity report.
        </div>

        {fullscreenError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.8125rem',
              color: 'var(--color-warning, #d97706)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{fullscreenError}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            disabled={isReturning}
            isLoading={isReturning}
            onClick={handleReturn}
            style={{ minHeight: 48, fontWeight: 700 }}
          >
            <Maximize2 size={18} style={{ marginRight: 8 }} />
            Return to Full Screen to Continue
          </Button>

          {onContinueWindowed && (
            <Button
              variant="outline"
              size="md"
              className="w-full"
              disabled={isReturning}
              onClick={onContinueWindowed}
              style={{ minHeight: 42 }}
            >
              <Eye size={16} style={{ marginRight: 8 }} />
              Continue in Windowed Mode (Monitored)
            </Button>
          )}

          {onExitExam && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isReturning}
              onClick={onExitExam}
              style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}
            >
              <LogOut size={14} style={{ marginRight: 6 }} />
              Exit Assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
