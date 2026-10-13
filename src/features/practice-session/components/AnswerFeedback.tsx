import * as React from 'react';
import { Button } from '../../../shared/components/Button';
import { useAITutor } from '../hooks/useAITutor';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export interface AnswerFeedbackProps {
  isCorrect?: boolean;
  explanation?: string;
  onNext: () => void;
  isCompleted: boolean;
  
  // AI Tutor props
  aiInterventionRequired?: boolean;
  questionText?: string;
  correctAnswer?: string;
  studentAnswer?: string;
  
  // Theory props
  isTheory?: boolean;
  score?: number;
  feedback?: string;
  theoryFeedback?: string;
  gradingStatus?: 'PENDING' | 'GRADED';

  hideNextBtn?: boolean;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  isCorrect = false,
  explanation = '',
  onNext,
  isCompleted,
  aiInterventionRequired,
  questionText,
  correctAnswer,
  studentAnswer,
  isTheory = false,
  score = 0,
  theoryFeedback = '',
  hideNextBtn = false,
}) => {
  const { mutate: generateAIExplanation, data: aiResponse, isPending: isGeneratingAI } = useAITutor();

  const handleAskAITutor = () => {
    if (questionText && correctAnswer && studentAnswer) {
      generateAIExplanation({
        questionText,
        correctAnswer,
        studentAnswer,
      });
    }
  };

  if (isTheory) {
    const isPassing = score >= 0.7;
    return (
      <div 
        className="animate-fade-in card"
        style={{ 
          width: '100%',
          padding: 'var(--space-48)',
          background: isPassing 
            ? 'var(--color-success-light)' 
            : 'var(--color-danger-light)',
          border: isPassing ? '1px solid var(--color-success)' : '1px solid var(--color-danger)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0 }}>
            {isPassing ? (
              <div style={{ background: 'var(--color-success)', borderRadius: '50%', padding: 8, color: 'var(--color-surface)', boxShadow: 'var(--shadow-green)' }}>
                <CheckCircle2 size={32} />
              </div>
            ) : (
              <div style={{ background: 'var(--color-danger)', borderRadius: '50%', padding: 8, color: 'var(--color-surface)', boxShadow: 'var(--shadow-1)' }}>
                <Sparkles size={32} />
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 className="h3" style={{ 
              color: isPassing ? 'var(--color-success)' : 'var(--color-danger)', 
              marginBottom: 'var(--space-12)', fontWeight: 700 
            }}>
              AI Grade: {Math.round(score * 100)}%
            </h3>
            <div style={{ fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
              {theoryFeedback}
            </div>
          </div>
        </div>

        {!hideNextBtn && (
          <div style={{ marginTop: 'var(--space-48)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={onNext} 
              variant={isCompleted ? "accent" : "primary"}
              size="lg"
            >
              {isCompleted ? 'Complete Assessment' : 'Next Question'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="animate-fade-in card"
      style={{ 
        width: '100%',
        padding: 'var(--space-48)',
        background: isCorrect 
          ? 'var(--color-success-light)' 
          : 'var(--color-danger-light)',
        border: isCorrect ? '1px solid var(--color-success)' : '1px solid var(--color-danger)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-24)', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {isCorrect ? (
            <div style={{ background: 'var(--color-success)', borderRadius: '50%', padding: 8, color: 'var(--color-surface)', boxShadow: 'var(--shadow-green)' }}>
              <CheckCircle2 size={32} />
            </div>
          ) : (
            <div style={{ background: 'var(--color-danger)', borderRadius: '50%', padding: 8, color: 'var(--color-surface)', boxShadow: 'var(--shadow-1)' }}>
              <XCircle size={32} />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 className="h3" style={{ 
            color: isCorrect ? 'var(--color-success)' : 'var(--color-danger)', 
            marginBottom: 'var(--space-12)', fontWeight: 700 
          }}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h3>
          <div style={{ fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
            {explanation}
          </div>
        </div>
      </div>

      {/* AI Deep Review Section */}
      {!isCorrect && aiInterventionRequired && (
        <div style={{ 
          marginTop: 'var(--space-48)', 
          padding: 'var(--space-32)', 
          background: 'var(--color-surface)', 
          borderRadius: 'var(--radius-xl)',
          borderLeft: '4px solid var(--color-accent)',
        }}>
          {!aiResponse ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                <Sparkles size={20} color="var(--color-accent)" />
                <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>AI Learning Insight Available</h4>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                EduAdapt AI has detected a conceptual gap. Request a detailed analysis to understand exactly where you went wrong.
              </p>
              <Button 
                variant="outline" 
                onClick={handleAskAITutor} 
                isLoading={isGeneratingAI}
                style={{ alignSelf: 'flex-start', marginTop: 'var(--space-8)' }}
              >
                Request AI Analysis
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
                <Sparkles size={20} color="var(--color-accent)" />
                <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>AI Concept Review</h4>
              </div>
              <div style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {aiResponse.data.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {!hideNextBtn && (
        <div style={{ marginTop: 'var(--space-48)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={onNext} 
            variant={isCompleted ? "accent" : "primary"}
            size="lg"
            disabled={isGeneratingAI}
          >
            {isCompleted ? 'Complete Assessment' : 'Next Question'}
          </Button>
        </div>
      )}
    </div>
  );
};
