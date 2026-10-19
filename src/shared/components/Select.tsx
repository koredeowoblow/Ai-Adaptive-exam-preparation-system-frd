import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  error?: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error,
      label,
      id,
      options,
      value: propValue,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      placeholder = 'Select an option',
      name,
      required,
      style,
      ...restProps
    },
    ref
  ) => {
    const autoId = React.useId();
    const selectId = id ?? autoId;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const nativeSelectRef = React.useRef<HTMLSelectElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      if (propValue !== undefined) return String(propValue);
      if (defaultValue !== undefined) return String(defaultValue);
      return '';
    });
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    // Sync external controlled value
    React.useEffect(() => {
      if (propValue !== undefined) {
        setInternalValue(String(propValue));
      }
    }, [propValue]);

    const activeValue = propValue !== undefined ? String(propValue) : internalValue;

    // Connect forwarded ref to native hidden select
    React.useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    const selectedOption = React.useMemo(() => {
      return options.find((opt) => String(opt.value) === String(activeValue));
    }, [options, activeValue]);

    const handleSelectOption = (optValue: string) => {
      if (propValue === undefined) {
        setInternalValue(optValue);
      }
      setIsOpen(false);
      setHighlightedIndex(-1);

      // Update native hidden select element
      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = optValue;
        const tracker = (nativeSelectRef.current as unknown as { _valueTracker?: { setValue: (val: string) => void } })._valueTracker;
        if (tracker) {
          tracker.setValue(optValue);
        }
        nativeSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Fire synthetic onChange for React state / react-hook-form
      if (onChange) {
        const syntheticEvent = {
          target: { value: optValue, name: name || selectId },
          currentTarget: { value: optValue, name: name || selectId },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }

      triggerRef.current?.focus();
    };

    const handleClose = React.useCallback(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (onBlur) {
        const syntheticBlurEvent = {
          target: { value: activeValue, name: name || selectId },
          currentTarget: { value: activeValue, name: name || selectId },
        } as unknown as React.FocusEvent<HTMLSelectElement>;
        onBlur(syntheticBlurEvent);
      }
    }, [activeValue, name, onBlur, selectId]);

    // Click outside listener
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, handleClose]);

    // Scroll active item into view
    React.useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && menuRef.current) {
        const child = menuRef.current.children[highlightedIndex] as HTMLElement;
        if (child && typeof child.scrollIntoView === 'function') {
          child.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIdx = options.findIndex((o) => String(o.value) === String(activeValue));
          setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
        } else {
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIdx = options.findIndex((o) => String(o.value) === String(activeValue));
          setHighlightedIndex(currentIdx >= 0 ? currentIdx : options.length - 1);
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            const opt = options[highlightedIndex];
            if (!opt.disabled) {
              handleSelectOption(opt.value);
            }
          } else {
            handleClose();
          }
        } else {
          setIsOpen(true);
          const currentIdx = options.findIndex((o) => String(o.value) === String(activeValue));
          setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
        }
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          handleClose();
          triggerRef.current?.focus();
        }
      } else if (e.key === 'Tab') {
        if (isOpen) {
          handleClose();
        }
      }
    };

    const hasSelection = selectedOption && selectedOption.value !== '';
    const displayText = hasSelection ? selectedOption.label : (selectedOption?.label || placeholder);

    return (
      <div
        ref={containerRef}
        className={`flex flex-col gap-[0.375rem] mb-2 relative ${className || ''}`}
        style={{ minWidth: 0 }}
      >
        {label && (
          <label
            htmlFor={selectId}
            onClick={() => {
              if (!disabled) {
                triggerRef.current?.focus();
                setIsOpen((prev) => !prev);
              }
            }}
            className="text-sm font-semibold select-none cursor-pointer"
            style={{ color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}

        {/* Hidden native select for form serialization and DOM accessibility */}
        <select
          ref={nativeSelectRef}
          id={`${selectId}-native`}
          name={name}
          value={activeValue}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
            margin: 0,
            padding: 0,
            border: 'none',
          }}
          onChange={(e) => {
            if (onChange) onChange(e);
          }}
          onBlur={onBlur}
          {...restProps}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom styled trigger button */}
        <button
          ref={triggerRef}
          type="button"
          id={selectId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${selectId}-popup`}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => {
                const nextState = !prev;
                if (nextState) {
                  const currentIdx = options.findIndex((o) => String(o.value) === String(activeValue));
                  setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
                } else {
                  setHighlightedIndex(-1);
                }
                return nextState;
              });
            }
          }}
          onKeyDown={handleKeyDown}
          className={`input ${error ? 'border-danger' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '44px',
            padding: '0.75rem 0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: error
              ? '2px solid var(--color-danger)'
              : isOpen
              ? '2px solid var(--color-primary)'
              : '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: hasSelection ? 'var(--color-text)' : 'var(--color-text-muted)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            boxShadow: isOpen
              ? '0 0 0 3px rgba(30, 64, 175, 0.12)'
              : undefined,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            ...style,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            {displayText}
          </span>
          <ChevronDown
            size={18}
            style={{
              flexShrink: 0,
              marginLeft: '0.5rem',
              color: 'var(--color-text-secondary)',
              transition: 'transform 200ms ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Custom styled popup dropdown menu */}
        {isOpen && (
          <div
            id={`${selectId}-popup`}
            role="listbox"
            ref={menuRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 90,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
              padding: '6px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                }}
              >
                No options available
              </div>
            ) : (
              options.map((opt, index) => {
                const isSelected = String(opt.value) === String(activeValue);
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={opt.value || `opt-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => {
                      if (!opt.disabled) {
                        handleSelectOption(opt.value);
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md, 8px)',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected
                        ? 'var(--color-primary)'
                        : opt.disabled
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      backgroundColor: isSelected
                        ? 'var(--color-primary-light, rgba(3, 105, 161, 0.12))'
                        : isHighlighted
                        ? 'var(--color-surface-1, #f1f5f9)'
                        : 'transparent',
                      opacity: opt.disabled ? 0.45 : 1,
                      transition: 'background-color 100ms ease, color 100ms ease',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check
                        size={16}
                        style={{
                          color: 'var(--color-primary)',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {error && (
          <span
            id={`${selectId}-error`}
            role="alert"
            className="text-danger text-[0.8125rem] font-medium mt-[0.125rem]"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
