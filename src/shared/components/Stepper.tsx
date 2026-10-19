import * as React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  sublabel?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  className = '',
}) => {
  return (
    <nav aria-label="Progress Stepper" className={`w-full ${className}`}>
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = Boolean(onStepClick && index <= currentStepIndex);

          return (
            <li
              key={step.id}
              className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`flex items-center gap-2.5 text-left transition-colors duration-150 ${
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                }`}
              >
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums border transition-all duration-150 shrink-0 ${
                    isCompleted
                      ? 'bg-primary text-white border-primary'
                      : isCurrent
                      ? 'bg-primary-light text-primary border-primary ring-2 ring-primary/20'
                      : 'bg-surface-1 text-text-muted border-border'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                </span>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs sm:text-sm font-medium truncate ${
                      isCurrent
                        ? 'text-text-primary font-semibold'
                        : isCompleted
                        ? 'text-text-secondary'
                        : 'text-text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.sublabel && (
                    <span className="text-[11px] text-text-muted truncate hidden sm:inline">
                      {step.sublabel}
                    </span>
                  )}
                </div>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] rounded transition-colors duration-200 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
