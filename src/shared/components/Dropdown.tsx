import * as React from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  header?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  header,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  // Filter items that can receive focus (non-disabled, non-divider)
  const interactiveItems = React.useMemo(() => {
    return items.filter((item) => !item.disabled);
  }, [items]);

  const closeMenu = React.useCallback((restoreFocus = true) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    if (restoreFocus) {
      // Return focus to the trigger button/container
      const focusable = triggerRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]') || triggerRef.current;
      focusable?.focus();
    }
  }, []);

  const openMenu = React.useCallback(() => {
    setIsOpen(true);
    setFocusedIndex(0);
  }, []);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, closeMenu]);

  // Focus the item when focusedIndex changes
  React.useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !menuRef.current) return;
    const buttons = menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
    if (buttons[focusedIndex]) {
      buttons[focusedIndex].focus();
    }
  }, [isOpen, focusedIndex]);

  // Handle keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeMenu(true);
        break;

      case 'Tab':
        // Tab closes menu without forcing focus back to trigger
        closeMenu(false);
        break;

      case 'ArrowDown': {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % (interactiveItems.length || 1));
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + interactiveItems.length) % (interactiveItems.length || 1));
        break;
      }

      case 'Home': {
        e.preventDefault();
        setFocusedIndex(0);
        break;
      }

      case 'End': {
        e.preventDefault();
        setFocusedIndex(interactiveItems.length - 1);
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? closeMenu(false) : openMenu())}
        className="cursor-pointer inline-flex items-center select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-50 mt-1.5 min-w-[220px] rounded-xl border border-border bg-surface p-1 shadow-[0_10px_25px_rgba(0,0,0,0.12)] focus:outline-none animate-in fade-in-0 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
        >
          {header && (
            <div className="px-3 py-2.5 border-b border-border/70 mb-1">
              {header}
            </div>
          )}

          {items.map((item, index) => {
            const itemKey = item.id || `dropdown-item-${index}`;
            return (
              <React.Fragment key={itemKey}>
                {item.divider && <div className="my-1 border-t border-border/60" role="separator" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  tabIndex={-1}
                  onClick={() => {
                    item.onClick();
                    closeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-lg text-left transition-colors font-medium select-none focus:outline-none ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : item.destructive
                      ? 'text-danger hover:bg-danger-light hover:text-danger focus:bg-danger-light focus:text-danger'
                      : 'text-text-primary hover:bg-surface-1 focus:bg-surface-1'
                  }`}
                >
                  {item.icon && <span className="shrink-0 text-text-muted" aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
