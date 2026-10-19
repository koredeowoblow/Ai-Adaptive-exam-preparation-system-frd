import * as React from 'react';
import { FocusTrap } from 'focus-trap-react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const prevActiveRef = React.useRef<HTMLElement | null>(null);

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

  const maxWidths = {
    sm: 'max-w-[420px]',
    md: 'max-w-[540px]',
    lg: 'max-w-[700px]',
    xl: 'max-w-[860px]',
  };

  return (
    <FocusTrap active={isOpen} focusTrapOptions={{ fallbackFocus: '#dialog-heading', allowOutsideClick: true }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 transition-opacity duration-150 animate-in fade-in-0 duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-heading"
          aria-describedby={description ? 'dialog-desc' : undefined}
          className={`relative w-full ${maxWidths[size]} bg-surface rounded-xl border border-border shadow-[0_16px_36px_rgba(0,0,0,0.18)] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-border/70 shrink-0">
            <div className="flex-1 pr-3">
              <h2
                id="dialog-heading"
                tabIndex={-1}
                className="text-lg font-bold text-text-primary tracking-tight leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p id="dialog-desc" className="mt-1 text-sm text-text-secondary leading-normal">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-1 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className = '' }) => (
  <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border/70 mt-4 ${className}`}>
    {children}
  </div>
);
