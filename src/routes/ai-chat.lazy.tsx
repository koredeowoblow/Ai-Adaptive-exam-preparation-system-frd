import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useAIChat } from '../features/ai-study/hooks/useAIStudy';
import type { ChatMessage } from '../features/ai-study/api/ai.api';
import { Bot, Send, User, BookOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useDepartmentCourses } from '../features/curriculum/hooks/useCurriculum';
import { getPromptsForCourse } from '../features/ai-study/utils/prompts';
import type { Course } from '../types/course.types';

export const Route = createLazyFileRoute('/ai-chat')({
  component: AIChatRoute,
});

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: 24 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? 'var(--color-surface-2)' : 'var(--color-primary-light)',
        color: isUser ? 'var(--color-text-secondary)' : 'var(--color-primary)',
      }}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`ai-message ${isUser ? 'user' : 'assistant'}`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
      }}>
        <Bot size={16} />
      </div>
      <div className="ai-message assistant flex gap-1.5 items-center px-6 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-text-muted)',
              opacity: 0.3,
              animation: `ai-typing-pulse 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

    </div>
  );
}

function AIChatRoute() {
  useDocumentTitle('AI Tutor EduAdapt');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: coursesData } = useDepartmentCourses(user?.departmentId || '');
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData?.pages) return [];
    return coursesData.pages
      .flatMap((p: any) => (Array.isArray(p) ? p : p?.items || []))
      .filter((c: any): c is Course => Boolean(c && c._id));
  }, [coursesData]);

  // Try to parse search safely
  const searchString = window.location.search;
  const searchParams = new URLSearchParams(searchString);
  const courseId = searchParams.get('courseId');

  const { mutate: sendToAI, isPending } = useAIChat();

  const selectedCourse: Course | undefined = React.useMemo(() => {
    if (!courseId && courses.length > 0) return courses[0];
    return courses.find((c) => c._id === courseId) || (courses.length > 0 ? courses[0] : undefined);
  }, [courseId, courses]);

  const initialMessage = `Hi! I'm your EduAdapt study buddy. ${selectedCourse ? `Ready to dive into ${selectedCourse.title}?` : 'Ask me anything about your coursework.'
    }\n\nI can explain concepts, solve problems step-by-step, help you prepare for exams, or quiz you on any topic.`;

  const [messages, setMessages] = React.useState<ChatMessage[]>([{
    role: 'assistant',
    content: initialMessage,
  }]);

  const [input, setInput] = React.useState('');
  const [lastPayload, setLastPayload] = React.useState<{ messages: ChatMessage[]; courseId?: string } | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Reset chat if course changes
  React.useEffect(() => {
    if (messages.length > 1) return; // Only update greeting if chat hasn't really started
    setMessages([{ role: 'assistant', content: initialMessage }]);
  }, [selectedCourse?.code]);

  const handleSend = React.useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const updatedMsgs = [...messages, userMsg];

    setMessages(updatedMsgs);
    setInput('');

    const historyForAPI = updatedMsgs.filter((_, i) => i > 0);
    // Send the courseId so backend can construct rich performance-aware context
    const payload = { messages: historyForAPI, courseId: selectedCourse?._id || undefined };
    setLastPayload(payload);

    sendToAI(
      payload,
      {
        onSuccess: (res) => { setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]); },
        onError: () => {
          toast.error("We couldn't connect to the AI Tutor.", {
            action: { label: 'Try again', onClick: handleRegenerate },
          });
        },
      }
    );
  }, [input, messages, isPending, selectedCourse, sendToAI]);

  const handleRegenerate = React.useCallback(() => {
    if (!lastPayload || isPending) return;
    sendToAI(
      lastPayload,
      {
        onSuccess: (res) => { setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]); },
        onError: () => { toast.error('Retry failed. Please try again later.'); },
      }
    );
  }, [lastPayload, isPending, sendToAI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSuggest = (prompt: string) => { setInput(prompt); inputRef.current?.focus(); };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: initialMessage }]);
  };

  const isEmptyState = messages.length === 1;
  const suggestedPrompts = React.useMemo(() => getPromptsForCourse(selectedCourse?.code), [selectedCourse]);

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-wide" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', minHeight: 600 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.75rem', margin: 0, color: 'var(--color-text-primary)' }}>
              AI Tutor {selectedCourse && `: ${selectedCourse.code}`}
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 600 }}>
              Your educational workspace. Ask questions, review topics, and prepare for exams
              {selectedCourse ? ` tailored to ${selectedCourse.title}.` : '.'}
            </p>

            {selectedCourse && (
              <div style={{
                marginTop: 16, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                maxWidth: 600
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={16} /> Course Context: {selectedCourse.code}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {selectedCourse.title}
                  </p>
                </div>
                <select
                  aria-label="Select course context"
                  value={selectedCourse._id}
                  onChange={(e) => {
                    if (e.target.value) {
                      navigate({ to: '/ai-chat', search: { courseId: e.target.value } });
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-0)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: 200,
                  }}
                >
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.code}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button onClick={handleClear} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> New chat
          </button>
        </div>

        {/* ── Chat Container ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'var(--color-surface-0)', border: '1px solid var(--color-border)',
          borderRadius: 12, overflow: 'hidden'
        }}>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 0 32px', display: 'flex', flexDirection: 'column' }}>
            {isEmptyState ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 40 }}>
                <div className="icon-float" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Bot size={24} />
                </div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
                  What are you working on?
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: '0 0 32px', textAlign: 'center' }}>
                  Ask about a concept, work through a problem, prepare for an exam, or review a topic.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, width: '100%', maxWidth: 1000 }}>
                  {suggestedPrompts.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSuggest(prompt.value)}
                        style={{
                          textAlign: 'left', padding: 16, borderRadius: 8,
                          border: '1px solid var(--color-border)', background: 'var(--color-surface-0)',
                          cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', gap: 12, alignItems: 'flex-start'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-surface-0)'}
                      >
                        <div style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>{prompt.label}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{prompt.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div aria-live="polite" aria-atomic="false" style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000, width: '100%', margin: '0 auto' }}>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {isPending && <TypingIndicator />}
                <div ref={bottomRef} style={{ height: 24 }} />
              </div>
            )}
          </div>

          {/* Composer Area */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-0)', flexShrink: 0 }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedCourse ? `Ask about ${selectedCourse.title} (${selectedCourse.code})...` : "Ask a question..."}
                  rows={1}
                  style={{
                    width: '100%', padding: '16px 56px 16px 16px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'var(--color-surface-1)',
                    color: 'var(--color-text-primary)', fontSize: '0.95rem', fontFamily: 'inherit',
                    resize: 'none', outline: 'none', minHeight: 54, maxHeight: 160,
                    lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                  aria-label="Send message"
                  onClick={handleSend}
                  disabled={!input.trim() || isPending}
                  style={{
                    position: 'absolute', right: 12, bottom: 12, width: 32, height: 32,
                    borderRadius: 6, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: input.trim() && !isPending ? 'var(--color-primary)' : 'var(--color-border)',
                    color: '#fff', cursor: input.trim() && !isPending ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

