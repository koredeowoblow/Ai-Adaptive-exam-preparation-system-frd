import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface RowActionsProps {
  actions: ActionItem[];
  label?: string;
}

export const RowActions: React.FC<RowActionsProps> = ({ actions, label = 'Row actions' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        const menuItems = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])');
        if (!menuItems || menuItems.length === 0) return;
        const currentActive = document.activeElement as HTMLButtonElement;
        const currentIndex = Array.from(menuItems).indexOf(currentActive);
        let nextIndex = 0;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex === -1 || currentIndex === menuItems.length - 1 ? 0 : currentIndex + 1;
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = menuItems.length - 1;
        }
        menuItems[nextIndex]?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: isOpen ? 'var(--color-surface-raised)' : 'transparent',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)';
          e.currentTarget.style.color = 'var(--color-text)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }
        }}
      >
        <MoreHorizontal size={15} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={label}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: '150px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
            padding: '4px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, idx) => {
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={idx}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isDanger ? 'var(--color-danger)' : 'var(--color-text)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  opacity: action.disabled ? 0.45 : 1,
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    e.currentTarget.style.backgroundColor = isDanger
                      ? 'var(--color-danger-light)'
                      : 'var(--color-surface-raised)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {action.icon && (
                  <span style={{ display: 'inline-flex', flexShrink: 0, opacity: isDanger ? 1 : 0.7 }}>
                    {action.icon}
                  </span>
                )}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
