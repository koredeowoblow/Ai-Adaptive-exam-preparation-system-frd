import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, helperText, id, required, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    const inputClassName = [
      'w-full min-h-[40px] px-3.5 py-2 text-sm rounded-lg border bg-surface text-text-primary placeholder:text-text-muted/60 transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-1',
      error ? 'border-danger focus:ring-danger' : 'border-border hover:border-border-hover',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={inputClassName}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          disabled={disabled}
          required={required}
          {...props}
        />

        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-danger mt-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${inputId}-helper`}
            className="text-xs text-text-muted mt-0.5"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
