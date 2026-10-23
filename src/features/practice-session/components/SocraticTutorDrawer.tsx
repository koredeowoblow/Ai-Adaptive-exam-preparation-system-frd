import * as React from 'react';
import { FocusTrap } from 'focus-trap-react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { VoiceDictationButton } from '../../../shared/components/VoiceDictationButton';
import { TypingIndicator } from '../../ai-study/components/TypingIndicator';
import { aiApi } from '../api/ai.api';
import { toast } from 'sonner';

export interface SocraticTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questionContext: {
    questionText: string;
    type?: string;
    studentAnswer?: string;
    correctAnswer?: string;
    modelAnswer?: string;
    rubric?: any;
    feedback?: string;
    marksAwarded?: number;
    maxMarks?: number;
  } | null;
}

const QUICK_PROMPTS = [
  'Walk through the solution step by step',
  'Why was my answer marked down?',
  'Explain the concept another way',
  'Give me a similar practice problem',
];

export const SocraticTutorDrawer: React.FC<SocraticTutorDrawerProps> = ({
  isOpen,
  onClose,
  questionContext,
}) => {
  const [conversationTurns, setConversationTurns] = React.useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [prevQuestionText, setPrevQuestionText] = React.useState(questionContext?.questionText);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Reset conversation turns during render when question changes
  if (prevQuestionText !== questionContext?.questionText) {
    setPrevQuestionText(questionContext?.questionText);
    setConversationTurns([]);
  }

  // Derive complete message stream during render
  const welcomeMessage = React.useMemo(() => ({
    role: 'assistant' as const,
    content: "Hello! I'm your AI Study Assistant. I've looked over your answer for this question. How can I help? You can ask me why something was wrong, ask for step-by-step working, or ask for a simple example!",
  }), []);

  const messages = React.useMemo(() => [
    welcomeMessage,
    ...conversationTurns,
  ], [welcomeMessage, conversationTurns]);

  // Lock body scroll while drawer is open
  React.useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll to bottom on new message
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading || !questionContext) return;

    const userMessage = { role: 'user' as const, content: query };
    const nextTurns = [...conversationTurns, userMessage];
    setConversationTurns(nextTurns);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.tutorQuestion({
        questionContext,
        messages: nextTurns,
      });

      const reply = res.data?.reply || 'I reviewed your question. Could you clarify what specific part you would like to explore next?';
      setConversationTurns((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      console.error('Tutor chat failed:', err);
      toast.error('AI Tutor could not generate a response. Please try again.');
      setConversationTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the AI tutor service. Please check your network or try asking again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !questionContext) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        returnFocusOnDeactivate: true,
        escapeDeactivates: false,
        allowOutsideClick: true,
        fallbackFocus: '#tutor-drawer-title',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-drawer-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,0.85)] animate-in fade-in duration-200"
      >
        <div
          className="w-full max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light border border-primary-border flex items-center justify-center text-primary shadow-xs">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 id="tutor-drawer-title" className="font-semibold text-sm text-text">
                    AI Study Assistant
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-light text-primary border border-primary-border">
                    Interactive
                  </span>
                </div>
                <p className="text-xs text-text-muted">Step-by-step help, explanations &amp; examples</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tutor drawer"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question Context Banner */}
          <div className="px-4 py-3 bg-surface-1 border-b border-border text-xs">
            <div className="flex items-center justify-between font-medium text-text-muted mb-1">
              <span className="truncate max-w-[280px]">Question Focus:</span>
              {questionContext.marksAwarded !== undefined && questionContext.maxMarks !== undefined && (
                <span className="font-semibold text-text">
                  Score: {questionContext.marksAwarded} / {questionContext.maxMarks}
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-text font-medium text-xs leading-relaxed">
              {questionContext.questionText}
            </p>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-primary-light border border-primary-border flex items-center justify-center text-primary flex-shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-none shadow-xs'
                      : 'bg-surface border border-border text-text rounded-tl-none shadow-xs'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="space-y-2">
                      <FormattedMathText text={m.content} />
                    </div>
                  ) : (
                    <span>{m.content}</span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-4 py-2.5 border-t border-border/70 flex flex-wrap gap-2 bg-surface-0">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="text-xs bg-surface border border-border hover:border-primary text-text hover:bg-surface-hover px-3 py-1.5 rounded-full transition-colors duration-150 text-left font-medium min-h-[32px] flex items-center shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3.5 border-t border-border bg-surface">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your tutor anything about this question..."
                  disabled={isLoading}
                  className="w-full text-xs sm:text-sm pl-3.5 pr-20 py-2.5 rounded-xl border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-colors"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <VoiceDictationButton
                    onTranscript={(txt) => setInput((prev) => (prev ? `${prev} ${txt}` : txt))}
                    disabled={isLoading}
                    label=""
                    className="px-1.5 py-0.5"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-xs flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};
