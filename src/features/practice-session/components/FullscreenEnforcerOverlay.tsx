import * as React from 'react';
import { ShieldAlert, Maximize2 } from 'lucide-react';
import { Button } from '../../../shared/components/Button';

interface FullscreenEnforcerOverlayProps {
  isVisible: boolean;
  onRequestFullscreen: () => Promise<void>;
}

export const FullscreenEnforcerOverlay: React.FC<FullscreenEnforcerOverlayProps> = ({
  isVisible,
  onRequestFullscreen,
}) => {
  const [isReturning, setIsReturning] = React.useState(false);

  if (!isVisible) return null;

  const handleReturn = async () => {
    setIsReturning(true);
    try {
      await onRequestFullscreen();
    } catch (e) {
      console.warn('Fullscreen resume error:', e);
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
          maxWidth: 500,
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '2px solid var(--color-danger, #ef4444)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
          padding: 'var(--space-32)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-20)',
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
            You have exited full screen mode. In accordance with exam proctoring rules, you cannot view questions or continue the assessment until you return to full screen.
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
          Warning: Exiting full screen has been recorded on your session integrity log.
        </div>

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
      </div>
    </div>
  );
};
