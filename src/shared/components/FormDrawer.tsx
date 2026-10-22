import * as React from 'react';
import { FocusTrap } from 'focus-trap-react';
import { X } from 'lucide-react';

export interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}

export const FormDrawer: React.FC<FormDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = '480px',
}) => {
  React.useEffect(() => {
    if (!isOpen) return;

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
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen} focusTrapOptions={{ fallbackFocus: '#drawer-title', allowOutsideClick: true }}>
      <div
        className="drawer-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 'var(--z-drawer, 60)' as any,
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          aria-describedby={description ? 'drawer-description' : undefined}
          style={{
            width: '100%',
            maxWidth: width,
            height: '100%',
            backgroundColor: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg, -4px 0 24px rgba(0,0,0,0.12))',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            outline: 'none',
            animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                id="drawer-title"
                tabIndex={-1}
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  letterSpacing: '-0.01em',
                  outline: 'none',
                }}
              >
                {title}
              </h2>
              {description && (
                <p
                  id="drawer-description"
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};
