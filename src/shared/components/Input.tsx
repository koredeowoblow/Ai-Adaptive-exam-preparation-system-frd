import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    // Auto-generate a stable id so <label htmlFor> always works (WCAG SC 1.3.1)
    const autoId = React.useId();
    const inputId = id ?? autoId;

    const inputClassName = [
      'input',
      error ? 'border-danger' : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1.5 mb-2">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {props.required && (
              <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>
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
          {...props}
        />

        {error && (
          <span
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--color-danger)] mt-0.5"
          >
            {/* Inline error icon — no external dep needed */}
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
            className="text-[0.6875rem] text-[var(--color-text-muted)] mt-0.5"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
