import * as React from 'react';
import { FocusTrap } from 'focus-trap-react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
}) => {
  const prevActiveRef = React.useRef<HTMLElement | null>(null);

  // Lock body scroll and listen for Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    prevActiveRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      prevActiveRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths: Record<string, string> = {
    sm: '440px',
    md: '560px',
    lg: '740px',
    xl: '920px',
  };

  return (
    <FocusTrap active={isOpen} focusTrapOptions={{ fallbackFocus: '#modal-title', allowOutsideClick: true }}>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          zIndex: 'var(--z-modal, 70)' as any,
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? 'modal-description' : undefined}
          style={{
            position: 'relative',
            margin: 'auto',
            padding: 0,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-border)',
            border: '1px solid var(--color-border)',
            maxWidth: maxWidths[size] || '560px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            outline: 'none',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 28px 20px 28px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              flexShrink: 0,
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div style={{ flex: 1, paddingRight: '8px' }}>
              <h2
                id="modal-title"
                tabIndex={-1}
                style={{
                  margin: 0,
                  color: 'var(--color-text)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  lineHeight: 1.3,
                  letterSpacing: '-0.015em',
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  id="modal-description"
                  style={{
                    margin: '6px 0 0 0',
                    color: 'var(--color-text-secondary, #94a3b8)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '-2px',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--color-text)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-raised, rgba(255, 255, 255, 0.08))';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '24px 28px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};
