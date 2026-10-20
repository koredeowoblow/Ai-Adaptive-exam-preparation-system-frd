import * as React from 'react';

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  width?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
  width = '320px',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const closePopover = React.useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      const focusable = triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]') || triggerRef.current;
      focusable?.focus();
    }
  }, []);

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePopover(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, closePopover]);

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePopover(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePopover]);

  const alignmentStyles: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    zIndex: 50,
    width,
    maxWidth: 'calc(100vw - 32px)',
    ...(align === 'right'
      ? { right: 0 }
      : align === 'center'
      ? { left: '50%', transform: 'translateX(-50%)' }
      : { left: 0 }),
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="false"
          style={alignmentStyles}
          className={`bg-surface-raised border border-border rounded-xl shadow-lg p-4 text-left animate-in fade-in zoom-in-95 duration-150 ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
