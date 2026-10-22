import * as React from 'react';
import FocusTrap from 'focus-trap-react';
import { X, Sparkles, Brain, CheckCircle2, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { aiApi } from '../api/ai.api';

interface CognitiveAutopsyModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionText: string;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  studentAnswer: string;
  modelAnswer?: string;
  subPartLabel?: string;
  explanation?: string;
}

export const CognitiveAutopsyModal: React.FC<CognitiveAutopsyModalProps> = ({
  isOpen,
  onClose,
  questionText,
  options,
  correctAnswer,
  studentAnswer,
  modelAnswer,
  subPartLabel,
  explanation,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [diagnostic, setDiagnostic] = React.useState<{
    misconceptionTitle: string;
    whyDistractorTempting: string;
    mentalModelFix: string;
    correctiveMicroDrill: {
      prompt: string;
      options: { id: string; text: string }[];
      correctOptionId: string;
      explanation: string;
    };
  } | null>(null);

  const [selectedDrillOption, setSelectedDrillOption] = React.useState<string | null>(null);
  const [hasCompletedDrill, setHasCompletedDrill] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setDiagnostic(null);
      setSelectedDrillOption(null);
      setHasCompletedDrill(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    aiApi
      .analyzeDistractor({
        questionText,
        options,
        correctAnswer,
        studentAnswer,
        modelAnswer,
        subPartLabel,
        explanation,
      })
      .then((res) => {
        if (isMounted && res.data) {
          setDiagnostic(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load cognitive autopsy:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, questionText, options, correctAnswer, studentAnswer, modelAnswer, subPartLabel, explanation]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        returnFocusOnDeactivate: true,
        escapeDeactivates: false,
        allowOutsideClick: true,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cognitive-autopsy-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-16) var(--space-20)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={18} />
            </div>
            <div>
              <h2 id="cognitive-autopsy-title" className="h4" style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                Why Did I Miss This? (Mistake Breakdown)
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Understand what went wrong and learn the key rule
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 'var(--space-20)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-32)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-12)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '3px solid var(--color-primary-light)',
                  borderTopColor: 'var(--color-primary)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p className="body-sm" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                Figuring out what caused the confusion and preparing your fix...
              </p>
            </div>
          ) : diagnostic ? (
            <>
              {/* Misconception Badge */}
              <div
                style={{
                  padding: 'var(--space-12) var(--space-16)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  <AlertCircle size={15} />
                  What Caused the Confusion
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {diagnostic.misconceptionTitle}
                </div>
              </div>

              {/* Why That Answer Was Tempting */}
              <div
                style={{
                  padding: 'var(--space-14) var(--space-16)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-warning)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>
                  <Sparkles size={15} />
                  Why Your Answer Looked Right at First
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text)' }}>
                  {diagnostic.whyDistractorTempting}
                </p>
              </div>

              {/* Golden Rule / Mental Model Fix */}
              <div
                style={{
                  padding: 'var(--space-14) var(--space-16)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>
                  <Lightbulb size={16} />
                  Simple Rule to Remember
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text)', fontWeight: 500 }}>
                  {diagnostic.mentalModelFix}
                </p>
              </div>

              {/* Corrective Micro-Drill */}
              {diagnostic.correctiveMicroDrill && (
                <div
                  style={{
                    padding: 'var(--space-16)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700 }}>
                      <Target size={15} />
                      Quick 1-Minute Practice Check
                    </div>
                    {hasCompletedDrill && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={13} />
                        Concept Mastered!
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 var(--space-12)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {diagnostic.correctiveMicroDrill.prompt}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {diagnostic.correctiveMicroDrill.options.map((opt) => {
                      const isSelected = selectedDrillOption === opt.id;
                      const isCorrect = opt.id === diagnostic.correctiveMicroDrill.correctOptionId;
                      const showResult = selectedDrillOption !== null;

                      let borderColor = 'var(--color-border)';
                      let bgColor = 'var(--color-surface)';
                      let textColor = 'var(--color-text)';

                      if (showResult) {
                        if (isCorrect) {
                          borderColor = 'var(--color-success)';
                          bgColor = 'rgba(16, 185, 129, 0.12)';
                          textColor = 'var(--color-success)';
                        } else if (isSelected) {
                          borderColor = 'var(--color-danger)';
                          bgColor = 'rgba(239, 68, 68, 0.12)';
                          textColor = 'var(--color-danger)';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={showResult}
                          onClick={() => {
                            setSelectedDrillOption(opt.id);
                            if (isCorrect) setHasCompletedDrill(true);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            color: textColor,
                            textAlign: 'left',
                            fontSize: '0.8125rem',
                            fontWeight: isSelected || isCorrect ? 600 : 500,
                            cursor: showResult ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>
                            <strong>{opt.id}.</strong> {opt.text}
                          </span>
                          {showResult && isCorrect && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDrillOption && (
                    <div style={{ marginTop: 'var(--space-10)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      <strong>Feedback:</strong> {diagnostic.correctiveMicroDrill.explanation}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-secondary)' }}>
              Could not load diagnostic for this question.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--space-12) var(--space-20)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--color-surface-1)',
          }}
        >
          <Button variant="primary" size="md" onClick={onClose}>
            Got it, Back to Review
          </Button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
};
