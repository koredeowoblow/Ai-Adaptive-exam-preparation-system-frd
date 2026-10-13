import * as React from 'react';
import { Button } from './Button';
import { FocusTrap } from 'focus-trap-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isPending = false
}) => {
  const prevActiveRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    prevActiveRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onCancel();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      prevActiveRef.current?.focus?.();
    };
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen} focusTrapOptions={{ fallbackFocus: '#dialog-title', allowOutsideClick: true }}>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isPending) {
            onCancel();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16)',
          zIndex: 'var(--z-dialog, 80)' as any,
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          style={{
            position: 'relative',
            margin: 'auto',
            padding: '28px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border)',
            maxWidth: '460px',
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid var(--color-border)',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="dialog-title"
            tabIndex={-1}
            style={{
              margin: '0 0 10px 0',
              color: 'var(--color-text)',
              fontSize: '1.25rem',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.015em',
            }}
          >
            {title}
          </h2>
          <p
            id="dialog-description"
            style={{
              margin: '0 0 24px 0',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
              {cancelText}
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm} isLoading={isPending}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};
