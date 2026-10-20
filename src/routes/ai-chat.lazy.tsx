import * as React from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { PageContainer } from '../shared/components/layout/PageContainer';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useTopbar } from '../shared/context/TopbarContext';
import { useAIChat } from '../features/ai-study/hooks/useAIStudy';
import type { ChatMessage } from '../features/ai-study/api/ai.api';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useDepartmentCourses, useCourseTopics } from '../features/curriculum/hooks/useCurriculum';
import { ChatMessageRenderer } from '../features/ai-study/components/ChatMessageRenderer';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { Button } from '../shared/components/Button';
import { Skeleton } from '../shared/components/Skeleton';
import { ErrorState } from '../shared/components/ErrorState';
import { 
  Bot, 
  Send, 
  User as UserIcon, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  Lightbulb
} from 'lucide-react';
import type { Course } from '../types/course.types';
import type { Topic } from '../types/topic.types';

export const Route = createLazyFileRoute('/ai-chat')({
  component: AIChatRoute,
});

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start my-2 max-w-[85%] mr-auto">
      <div 
        className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <Bot size={16} />
      </div>
      <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-surface-0 border border-border flex items-center gap-1.5 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce" />
        <span className="sr-only">AI Tutor is thinking...</span>
      </div>
    </div>
  );
}

function AIChatRoute() {
  useDocumentTitle('AI Tutor - EduAdapt');
  
  useTopbar({
    title: 'AI Tutor',
    breadcrumbs: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'AI Tutor' },
    ],
  });

  const { user } = useAuth();
  const { data: coursesData, isLoading: isCoursesLoading, error: coursesError, refetch: refetchCourses } = useDepartmentCourses(user?.departmentId || '');
  
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData?.pages) return [];
    return coursesData.pages
      .flatMap((p: any) => (Array.isArray(p) ? p : p?.items || []))
      .filter((c: any): c is Course => Boolean(c && c._id));
  }, [coursesData]);

  // Selected course state
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>('');
  const [pendingCourseId, setPendingCourseId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  const selectedCourse: Course | undefined = React.useMemo(() => {
    return courses.find((c) => c._id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Fetch topics for the selected course to derive context-grounded suggestion chips
  const { data: topicsData } = useCourseTopics(selectedCourse?._id || '');
  const courseTopics: Topic[] = React.useMemo(() => {
    if (!topicsData?.pages) return [];
    return topicsData.pages
      .flatMap((p: any) => (Array.isArray(p) ? p : p?.items || []))
      .filter((t: any): t is Topic => Boolean(t && (t._id || t.name)));
  }, [topicsData]);

  const initialGreeting = React.useMemo(() => {
    if (!selectedCourse) {
      return "Hi! I'm your EduAdapt AI Tutor. Ask me any questions about your coursework, formulas, or concepts.";
    }
    return `Hi! I'm your EduAdapt study tutor for **${selectedCourse.code}: ${selectedCourse.title}**.\n\nAsk me to break down complex concepts, work through sample calculations, generate exam practice questions, or explain tricky theory topics.`;
  }, [selectedCourse]);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'assistant', content: initialGreeting },
  ]);

  // Keep greeting synced when course initializes on first load
  React.useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: initialGreeting }]);
    }
  }, [initialGreeting]);

  // Dynamic suggestion chips (derived strictly from course title and its real curriculum topics)
  const suggestionChips = React.useMemo(() => {
    if (!selectedCourse) {
      return [
        'Explain a foundational concept in simple terms',
        'Walk me through a step-by-step problem',
        'Quiz me on key principles for my upcoming exam',
        'Help me identify common pitfalls in my study plan',
      ];
    }

    if (courseTopics.length > 0) {
      // Pick 3 to 4 distinct topics from the selected course
      const topTopics = courseTopics.slice(0, 4);
      const chips: string[] = [];
      
      if (topTopics[0]) chips.push(`Explain ${topTopics[0].name} in simple terms`);
      if (topTopics[1]) chips.push(`Quiz me on ${topTopics[1].name}`);
      if (topTopics[2]) chips.push(`Walk me through an exam problem on ${topTopics[2].name}`);
      if (topTopics[3]) {
        chips.push(`What are common pitfalls in ${topTopics[3].name}?`);
      } else {
        chips.push(`Give me an exam-style question for ${selectedCourse.code}`);
      }
      return chips;
    }

    // Fallback: strictly build from course title (never show unrelated CS prompts for non-CS course)
    return [
      `Explain the core concepts of ${selectedCourse.title}`,
      `Quiz me on key principles in ${selectedCourse.code}`,
      `Give me an exam-style practice question for ${selectedCourse.title}`,
      `Break down the most difficult theories in ${selectedCourse.code}`,
    ];
  }, [selectedCourse, courseTopics]);

  const [input, setInput] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [failedMessage, setFailedMessage] = React.useState<string | null>(null);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const composerRef = React.useRef<HTMLTextAreaElement>(null);

  const { mutate: sendToAI, isPending } = useAIChat();

  // Scroll to bottom smoothly when messages update
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // Handle course switch request
  const handleCourseSelect = (newCourseId: string) => {
    if (newCourseId === selectedCourseId) return;

    // If chat has progressed beyond the greeting, confirm before discarding conversation
    if (messages.length > 1) {
      setPendingCourseId(newCourseId);
    } else {
      setSelectedCourseId(newCourseId);
    }
  };

  const confirmCourseSwitch = () => {
    if (pendingCourseId) {
      setSelectedCourseId(pendingCourseId);
      setPendingCourseId(null);
      setErrorMessage(null);
      setFailedMessage(null);
      // Greeting will reset via the initialGreeting effect
    }
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      setPendingCourseId(selectedCourseId); // trigger confirmation
    } else {
      setMessages([{ role: 'assistant', content: initialGreeting }]);
      setErrorMessage(null);
      setFailedMessage(null);
    }
  };

  const executeSend = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput('');
    setErrorMessage(null);
    setFailedMessage(null);

    // Auto-resize textarea back to single line
    if (composerRef.current) {
      composerRef.current.style.height = 'auto';
    }

    const historyForAPI = nextMessages.filter((_, i) => i > 0);
    const payload = {
      messages: historyForAPI,
      courseId: selectedCourse?._id || undefined,
    };

    sendToAI(payload, {
      onSuccess: (res) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
        setErrorMessage(null);
        setFailedMessage(null);
        // Accessibility: return focus to composer
        composerRef.current?.focus();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || "We couldn't connect to the AI Tutor. Please try again.";
        setErrorMessage(msg);
        setFailedMessage(trimmed);
        // Retain text if sending failed
        setInput(trimmed);
        composerRef.current?.focus();
      },
    });
  };

  const handleSend = () => {
    executeSend(input);
  };

  const handleRetry = () => {
    if (failedMessage) {
      executeSend(failedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (promptText: string) => {
    setInput(promptText);
    composerRef.current?.focus();
  };

  // Auto-grow textarea handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const isConversationEmpty = messages.length <= 1;

  return (
    <AppLayout>
      <PageContainer className="flex flex-col h-[calc(100dvh-64px)] max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Compact Header: Title + Context Selector + New Chat */}
        <header className="flex items-center justify-between gap-4 py-3 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Bot size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-primary truncate leading-tight">
                AI Tutor
              </h1>
              <p className="text-xs text-text-secondary truncate">
                {selectedCourse ? `${selectedCourse.code}: ${selectedCourse.title}` : 'Interactive Academic Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {courses.length > 0 && (
              <div className="relative">
                <label htmlFor="course-context-select" className="sr-only">Course Context</label>
                <select
                  id="course-context-select"
                  value={selectedCourse?._id || ''}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="h-8 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-surface-0 text-text-primary hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code}: {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="h-8 px-2.5 text-xs text-text-secondary hover:text-text-primary"
              aria-label="Start new chat session"
            >
              <RefreshCw size={13} className="mr-1.5" />
              New Chat
            </Button>
          </div>
        </header>

        {isCoursesLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center p-8 space-y-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : coursesError ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <ErrorState
              message="Failed to load your course curriculum. Please verify your connection."
              onRetry={() => refetchCourses()}
            />
          </div>
        ) : (
          /* Main Chat Area */
          <div className="flex-1 flex flex-col min-h-0 bg-surface-0 border border-border rounded-xl mt-3 mb-2 shadow-xs overflow-hidden">
            
            {/* Scrollable Message List */}
            <div 
              role="log" 
              aria-live="polite" 
              aria-atomic="false"
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-none"
            >
              {isConversationEmpty ? (
                /* Empty State with Suggestion Chips */
                <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12 px-4 max-w-xl mx-auto my-auto">
                  <div 
                    className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4 shadow-xs"
                    aria-hidden="true"
                  >
                    <Sparkles size={24} />
                  </div>

                  <h2 className="text-lg font-bold text-text-primary mb-1">
                    What would you like to learn today?
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
                    {selectedCourse
                      ? `Ask questions, work through exercises, or prepare for exams in ${selectedCourse.title}.`
                      : 'Ask questions, review topics, and prepare for your university examinations.'}
                  </p>

                  {/* Suggestion Chips */}
                  <div className="w-full space-y-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block text-left px-1">
                      Suggested Prompts
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-surface-0 hover:border-primary/40 hover:bg-surface-1 transition-all text-left text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
                        >
                          <Lightbulb size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="line-clamp-2 leading-snug">{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages Stream */
                <div className="space-y-4">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={i}
                        className={`flex gap-3 items-start ${
                          isUser ? 'flex-row-reverse ml-auto max-w-[85%] sm:max-w-[75%]' : 'mr-auto max-w-[95%] sm:max-w-[88%]'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                            isUser
                              ? 'bg-surface-2 text-text-secondary'
                              : 'bg-primary-light text-primary'
                          }`}
                          aria-hidden="true"
                        >
                          {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-2xl shadow-xs ${
                            isUser
                              ? 'bg-primary-light text-text-primary border border-primary/20 rounded-tr-xs'
                              : 'bg-surface-0 text-text-primary border border-border rounded-tl-xs'
                          }`}
                        >
                          {isUser ? (
                            <p className="text-sm sm:text-[0.9375rem] whitespace-pre-wrap leading-relaxed break-words">
                              {msg.content}
                            </p>
                          ) : (
                            <ChatMessageRenderer content={msg.content} />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isPending && <TypingIndicator />}

                  {/* Inline Error State with Retry Button */}
                  {errorMessage && (
                    <div 
                      role="alert"
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-danger/40 bg-danger-light text-danger text-xs sm:text-sm max-w-[85%] mr-auto"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleRetry}
                        className="h-7 px-2.5 text-xs font-bold shrink-0"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  <div ref={bottomRef} className="h-2" />
                </div>
              )}
            </div>

            {/* Pinned Composer with Mobile Tab-Bar Safe Area Padding */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-border bg-surface-0 pb-safe">
              <div className="relative flex items-end gap-2 bg-surface-1 border border-border focus-within:border-primary rounded-xl p-1.5 transition-colors">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedCourse ? `Ask about ${selectedCourse.code}... (Enter to send)` : 'Ask a question...'}
                  rows={1}
                  disabled={isPending}
                  className="w-full px-2.5 py-1.5 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none min-h-[40px] max-h-36 leading-relaxed scrollbar-none disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isPending}
                  aria-label="Send message to AI Tutor"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    input.trim() && !isPending
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-xs cursor-pointer'
                      : 'bg-surface-2 text-text-muted cursor-not-allowed opacity-60'
                  }`}
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted mt-1.5 px-1">
                <span>Shift+Enter for newline</span>
                {selectedCourse && (
                  <span className="truncate max-w-[200px]">Context: {selectedCourse.code}</span>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Course Switch Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!pendingCourseId}
          title="Switch Course Context?"
          message="Switching courses will clear your current conversation history and start a fresh session with the new course materials."
          confirmText="Switch Course"
          cancelText="Keep Current Chat"
          onConfirm={confirmCourseSwitch}
          onCancel={() => setPendingCourseId(null)}
        />
      </PageContainer>
    </AppLayout>
  );
}
