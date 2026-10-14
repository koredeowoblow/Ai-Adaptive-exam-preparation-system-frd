import * as React from 'react';
import { Button } from '../../../shared/components/Button';
import type { Question } from '../../../types/question.types';
import { HelpCircle, Eye } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { MathToolbar } from '../../../shared/components/MathToolbar';
import { insertSymbolIntoTextarea, insertTemplateIntoInputOrTextarea } from '../../../shared/utils/mathInsert';
import type { MathSymbolItem } from '../../../shared/constants/mathSymbols';

export interface QuestionCardProps {
  question: Question;
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string) => void;
  writtenAnswer?: string;
  onWrittenAnswerChange?: (value: string) => void;
  theoryTextareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  error?: string | null;
  hideSubmit?: boolean;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'Easy' | 'Medium' | 'Hard';
  onRetry?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
  question,
  selectedOptionId,
  onOptionSelect,
  writtenAnswer = '',
  onWrittenAnswerChange,
  theoryTextareaRef,
  onSubmit,
  isSubmitting,
  disabled = false,
  error = null,
  hideSubmit = false,
  difficulty,
  onRetry,
}) => {
  const isTheory = question.type === 'THEORY';

  // Local state for theory answer to prevent keystrokes from re-rendering the entire exam route
  const [localText, setLocalText] = React.useState(writtenAnswer);
  const [showPreview, setShowPreview] = React.useState(true);

  React.useEffect(() => {
    setLocalText(writtenAnswer);
  }, [writtenAnswer]);

  const handleInsertSymbol = React.useCallback((sym: MathSymbolItem) => {
    insertSymbolIntoTextarea(
      theoryTextareaRef?.current || null,
      localText,
      sym,
      (newVal) => {
        setLocalText(newVal);
        onWrittenAnswerChange?.(newVal);
      }
    );
  }, [localText, onWrittenAnswerChange, theoryTextareaRef]);

  const insertTemplate = React.useCallback(() => {
    insertTemplateIntoInputOrTextarea(
      theoryTextareaRef?.current || null,
      localText,
      (newVal) => {
        setLocalText(newVal);
        onWrittenAnswerChange?.(newVal);
      }
    );
  }, [localText, onWrittenAnswerChange, theoryTextareaRef]);

  const isSubmitDisabled = disabled || isSubmitting || (isTheory ? !localText.trim() : !selectedOptionId);

  return (
    <div style={{ width: '100%', marginBottom: 'var(--space-32)' }}>
      {/* Question Text */}
      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'flex-start' }}>
          <div
            aria-label="Question"
            role="img"
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <HelpCircle size={16} color="var(--color-surface)" aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', flex: 1 }}>
            {difficulty && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                alignSelf: 'flex-start',
                background: difficulty.toUpperCase() === 'HARD' ? 'var(--color-danger-light)' :
                  difficulty.toUpperCase() === 'MEDIUM' ? 'var(--color-warning-light)' :
                    'var(--color-success-light)',
                color: difficulty.toUpperCase() === 'HARD' ? 'var(--color-danger)' :
                  difficulty.toUpperCase() === 'MEDIUM' ? 'var(--color-warning)' :
                    'var(--color-success)',
                border: `1px solid ${difficulty.toUpperCase() === 'HARD' ? 'var(--color-danger)' :
                  difficulty.toUpperCase() === 'MEDIUM' ? 'var(--color-warning)' :
                    'var(--color-success)'
                  }`
              }}>
                {difficulty}
              </div>
            )}
            <h2 style={{
              lineHeight: '1.6', color: 'var(--color-text)', fontWeight: 600,
              fontSize: '1.4rem', fontFamily: "'Outfit', sans-serif"
            }}>
              <FormattedMathText text={question.questionText} />
            </h2>
          </div>
        </div>
      </div>

      {isTheory ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {/* Categorized Math & Science Symbol Toolbar */}
          <MathToolbar
            onInsertSymbol={handleInsertSymbol}
            onInsertTemplate={insertTemplate}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview((prev) => !prev)}
            disabled={disabled || isSubmitting}
          />

          {/* Theory Textarea */}
          <textarea
            ref={theoryTextareaRef}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            disabled={disabled || isSubmitting}
            placeholder="Type your explanation, formula steps, or calculations here..."
            style={{
              width: '100%',
              minHeight: '180px',
              padding: 'var(--space-20)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surface-0)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              outline: 'none',
              opacity: disabled ? 0.6 : 1,
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--color-primary)')}
            onBlur={(e) => {
              e.target.style.border = '1px solid var(--color-border)';
              onWrittenAnswerChange?.(e.target.value);
            }}
          />

          {/* Live Math Preview when active */}
          {showPreview && localText.trim().length > 0 && (
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-0)]/60 text-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                <Eye size={12} className="text-primary" />
                <span>Live Formatted Math Preview</span>
              </div>
              <div className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                <FormattedMathText text={localText} />
              </div>
            </div>
          )}

          <div style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            paddingRight: 'var(--space-8)'
          }}>
            <span>Tip: Click symbols above or type <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">x^2</code>, <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">\frac&#123;a&#125;&#123;b&#125;</code>, or <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">\sqrt&#123;x&#125;</code></span>
            <span>{localText.length} characters</span>
          </div>
        </div>
      ) : (
        /* Options — fieldset/legend gives native radio grouping without ARIA hacks */
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Select your answer</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            {question.options?.map((option) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <label
                  key={option.id}
                  className={!disabled && !isSelected ? 'hover:bg-white/5 hover:border-[var(--color-border-hover)]' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', padding: 'var(--space-24)',
                    borderRadius: 'var(--radius-xl)', cursor: disabled ? 'default' : 'pointer',
                    background: isSelected ? 'var(--color-surface)' : 'var(--color-surface-0)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    opacity: disabled && !isSelected ? 0.6 : 1,
                  }}
                >
                  {/* Radio Button */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginRight: 'var(--space-16)',
                    border: isSelected ? '7px solid var(--color-primary)' : '2px solid var(--color-text-muted)',
                    background: isSelected ? 'var(--color-surface)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }} />

                  <input
                    type="radio"
                    name="question-option"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onOptionSelect(option.id)}
                    disabled={disabled || isSubmitting}
                    className="sr-only"
                  />

                  {/* Option Letter */}
                  <span style={{
                    marginRight: 'var(--space-12)', fontWeight: 800, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)'
                  }}>
                    {option.id}
                  </span>

                  {/* Option Text with Mathematical Formatting */}
                  <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 600 : 500, color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <FormattedMathText text={option.text} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {error && (
        <div style={{
          color: 'var(--color-danger)', marginTop: 'var(--space-32)', padding: 'var(--space-16)',
          background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8
        }}>
          ⚠️ {error}
        </div>
      )}

      {!hideSubmit && (
        <div style={{ marginTop: 'var(--space-48)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant={error ? "danger" : "accent"} size="lg" onClick={error && onRetry ? onRetry : onSubmit} disabled={isSubmitDisabled} isLoading={isSubmitting}
          >
            {error ? 'Retry Submission' : 'Submit Answer'}
          </Button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.question._id === nextProps.question._id &&
    prevProps.selectedOptionId === nextProps.selectedOptionId &&
    prevProps.writtenAnswer === nextProps.writtenAnswer &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.error === nextProps.error &&
    prevProps.difficulty === nextProps.difficulty
  );
});
