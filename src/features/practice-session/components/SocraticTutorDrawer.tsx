import * as React from 'react';
import FocusTrap from 'focus-trap-react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { VoiceDictationButton } from '../../../shared/components/VoiceDictationButton';
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
  '💡 Why was my answer marked down?',
  '📝 Walk me through getting full marks step-by-step',
  '🧠 Explain this with an intuitive analogy',
  '🎯 Give me a similar problem to test myself',
];

export const SocraticTutorDrawer: React.FC<SocraticTutorDrawerProps> = ({
  isOpen,
  onClose,
  questionContext,
}) => {
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize or reset chat when opening with a new question
  React.useEffect(() => {
    if (isOpen && questionContext) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your AI Study Assistant. I've looked over your answer for this question. How can I help? You can ask me why something was wrong, ask for step-by-step working, or ask for a simple example!`,
        },
      ]);
    }
  }, [isOpen, questionContext?.questionText]);

  // Scroll to bottom on new message
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: query }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history (ignoring initial welcome message for brevity)
      const chatHistory = newMessages.slice(1);
      const res = await aiApi.tutorQuestion({
        questionContext,
        messages: chatHistory,
      });

      const reply = res.data?.reply || 'I reviewed your question. Could you clarify what specific part you would like to explore next?';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      console.error('Tutor chat failed:', err);
      toast.error('AI Tutor could not generate a response. Please try again.');
      setMessages((prev) => [
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
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Socratic AI Tutor"
        className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,23,42,0.85)] animate-in fade-in duration-200"
      >
      <div className="w-full max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground">AI Study Assistant</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Step-by-step help, explanations &amp; examples</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tutor drawer"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Context Pill / Banner */}
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
          <div className="flex items-center justify-between font-medium text-muted-foreground mb-1">
            <span className="truncate max-w-[280px]">Question Focus:</span>
            {questionContext.marksAwarded !== undefined && questionContext.maxMarks !== undefined && (
              <span className="font-semibold text-foreground">
                Score: {questionContext.marksAwarded} / {questionContext.maxMarks}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-foreground font-medium text-xs leading-relaxed">
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
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none shadow-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-none shadow-xs'
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

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                <span>AI Tutor is thinking through your question...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-border/50 flex flex-wrap gap-1.5 bg-muted/20">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-xs bg-card border border-border/70 hover:border-primary/50 text-foreground px-2.5 py-1 rounded-full transition-all hover:bg-muted text-left font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your tutor anything about this question..."
                disabled={isLoading}
                className="w-full text-xs sm:text-sm pl-3 pr-20 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
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
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
