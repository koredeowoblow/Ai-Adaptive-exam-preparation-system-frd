import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, options, ...props }, ref) => {
    const autoId = React.useId();
    const selectId = id ?? autoId;
    const classNames = `input ${error ? 'border-danger' : ''} ${className || ''}`;

    return (
      <div className="flex flex-col gap-[0.375rem] mb-2">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={classNames}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
          }}
          {...props}
        >
          <option value="" disabled style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
            Select an option
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span id={`${selectId}-error`} role="alert" className="text-danger text-[0.8125rem] font-medium mt-[0.125rem]">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
