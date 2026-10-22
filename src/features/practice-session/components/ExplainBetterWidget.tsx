import React, { useState } from 'react';
import { Sparkles, Lightbulb, ListOrdered, CheckSquare, MessageCircle, Loader2, X, Send } from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { Button } from '../../../shared/components/Button';

interface ExplainBetterWidgetProps {
  questionText: string;
  studentAnswer?: string;
  correctAnswer?: string;
  modelAnswer?: string;
  currentExplanation?: string;
}

type ExplainStyle = 'ANALOGY' | 'STEP_BY_STEP' | 'SUMMARY' | 'CUSTOM';

export const ExplainBetterWidget: React.FC<ExplainBetterWidgetProps> = ({
  questionText,
  studentAnswer,
  correctAnswer,
  modelAnswer,
  currentExplanation,
}) => {
  const [activeStyle, setActiveStyle] = useState<ExplainStyle | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; text: string } | null>(null);

  const handleRequestRefinement = async (style: ExplainStyle, queryText?: string) => {
    setActiveStyle(style);
    setLoading(true);
    setError(null);

    try {
      const res = await aiApi.refineExplanation({
        questionText,
        studentAnswer,
        correctAnswer,
        modelAnswer,
        currentExplanation,
        style,
        customPrompt: queryText || customQuery,
      });

      if (res.data) {
        setResult({
          title: res.data.title || 'Simple Explanation',
          text: res.data.refinedExplanation,
        });
      }
    } catch (err: any) {
      console.error('Failed to refine explanation:', err);
      setError('Could not update explanation right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || loading) return;
    handleRequestRefinement('CUSTOM', customQuery);
  };

  return (
    <div style={{ marginTop: 'var(--space-12)' }}>
      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(14, 107, 168, 0.04)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed rgba(14, 107, 168, 0.25)',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginRight: '4px',
          }}
        >
          <Sparkles size={14} />
          Need a simpler explanation?
        </span>

        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            handleRequestRefinement('ANALOGY');
          }}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            border: activeStyle === 'ANALOGY' && result ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: activeStyle === 'ANALOGY' && result ? 'rgba(14, 107, 168, 0.12)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Lightbulb size={13} color="#f59e0b" />
          Real-Life Example
        </button>

        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            handleRequestRefinement('STEP_BY_STEP');
          }}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            border: activeStyle === 'STEP_BY_STEP' && result ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: activeStyle === 'STEP_BY_STEP' && result ? 'rgba(14, 107, 168, 0.12)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ListOrdered size={13} color="#3b82f6" />
          Step-by-Step
        </button>

        <button
          type="button"
          onClick={() => {
            setShowCustomInput(false);
            handleRequestRefinement('SUMMARY');
          }}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            border: activeStyle === 'SUMMARY' && result ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: activeStyle === 'SUMMARY' && result ? 'rgba(14, 107, 168, 0.12)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <CheckSquare size={13} color="#10b981" />
          Key Points
        </button>

        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            border: showCustomInput ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: showCustomInput ? 'rgba(14, 107, 168, 0.12)' : 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageCircle size={13} color="#8b5cf6" />
          Ask Your Question
        </button>
      </div>

      {/* Inline Doubt Input */}
      {showCustomInput && (
        <form
          onSubmit={handleCustomSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
            background: 'var(--color-surface)',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Type your question (e.g. Why isn't option B correct?)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.825rem',
              color: 'var(--color-text-primary)',
              background: 'transparent',
              padding: '4px 8px',
            }}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!customQuery.trim() || loading}
            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span style={{ marginLeft: 4 }}>Ask AI</span>
          </Button>
        </form>
      )}

      {/* Loading indicator */}
      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            marginTop: '8px',
            background: 'rgba(14, 107, 168, 0.05)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <Loader2 size={16} className="animate-spin" color="var(--color-primary)" />
          <span>Rewriting this in simple terms for you...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--color-danger)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div
          style={{
            marginTop: '10px',
            padding: '14px 16px',
            background: 'rgba(14, 107, 168, 0.04)',
            border: '1px solid rgba(14, 107, 168, 0.2)',
            borderRadius: 'var(--radius-lg)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(14, 107, 168, 0.1)',
              paddingBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Lightbulb size={14} />
              {result.title}
            </span>
            <button
              type="button"
              onClick={() => setResult(null)}
              aria-label="Hide explanation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                minHeight: 36,
                padding: '8px',
                margin: '-8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--color-text-primary)',
            }}
          >
            <FormattedMathText text={result.text} />
          </div>
        </div>
      )}
    </div>
  );
};
