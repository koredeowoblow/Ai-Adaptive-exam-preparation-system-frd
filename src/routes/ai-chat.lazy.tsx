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
import { PageHeader } from '../shared/components/PageHeader';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { Button } from '../shared/components/Button';
import { Skeleton } from '../shared/components/Skeleton';
import { ErrorState } from '../shared/components/ErrorState';
import { 
  Bot, 
  Send, 
  User as UserIcon, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import type { Course } from '../types/course.types';
import type { Topic } from '../types/topic.types';

export const Route = createLazyFileRoute('/ai-chat')({
  component: AIChatRoute,
});

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start my-2 max-w-lg mr-auto">
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

  // Dynamic suggestion chips (using topic names directly in 2x2 grid)
  const suggestionChips = React.useMemo(() => {
    if (!selectedCourse) {
      return [
        'Core Principles',
        'Step-by-Step Problem',
        'Practice Exam Questions',
        'Key Formulas & Concepts',
      ];
    }

    const topicNames = courseTopics.map((t) => t.name).filter(Boolean);
    const chips: string[] = [];

    for (let i = 0; i < Math.min(4, topicNames.length); i++) {
      chips.push(topicNames[i]);
    }

    if (chips.length < 1) chips.push('Overview & Fundamentals');
    if (chips.length < 2) chips.push('Core Theories & Principles');
    if (chips.length < 3) chips.push('Practical Problem Solving');
    if (chips.length < 4) chips.push('Exam Review & Key Formulas');

    return chips.slice(0, 4);
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
      <PageContainer className="flex flex-col h-[calc(100dvh-64px)] max-w-[1200px] w-full mx-auto px-4 sm:px-6 overflow-hidden">
        
        {/* Page Header: Course Title as H1 + Context Selector + New Chat */}
        <PageHeader
          title={selectedCourse ? selectedCourse.title : 'AI Study Session'}
          description={selectedCourse ? `${selectedCourse.code} · Interactive Course Tutor` : undefined}
          className="shrink-0 mb-2 sm:mb-3"
          actions={
            <div className="flex items-center gap-2">
              {courses.length > 0 && (
                <div className="relative">
                  <label htmlFor="course-context-select" className="sr-only">Course Context</label>
                  <select
                    id="course-context-select"
                    value={selectedCourse?._id || ''}
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    className="h-9 px-3 py-1 text-xs font-semibold rounded-lg border border-border bg-surface-0 text-text-primary hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-40 sm:max-w-56 truncate"
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
                className="h-9 px-3 text-xs text-text-secondary hover:text-text-primary"
                aria-label="Start new chat session"
              >
                <RefreshCw size={13} className="mr-1.5" />
                New Chat
              </Button>
            </div>
          }
        />

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
          <div className="flex-1 flex flex-col min-h-0 bg-surface-0 border border-border rounded-xl mb-2 shadow-xs overflow-hidden">
            
            {/* Scrollable Message List */}
            <div 
              role="log" 
              aria-live="polite" 
              aria-atomic="false"
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-none flex flex-col"
            >
              {isConversationEmpty ? (
                /* Empty State with Suggestion Chips (2x2 grid, topic names, max ~760px centered) */
                <div className="flex flex-col items-start justify-end mt-auto max-w-[760px] mx-auto w-full p-2 sm:p-4 space-y-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-[-0.005em]">
                      What would you like to explore?
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary mt-1">
                      Ask questions, review key concepts, or practice problem-solving for this course.
                    </p>
                  </div>

                  {/* Suggestion Chips in 2x2 grid */}
                  <div className="w-full space-y-2 pt-1">
                    <span className="text-xs font-semibold text-text-secondary block">
                      Suggested topics
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className="p-3 rounded-xl border border-border bg-surface-0 hover:border-primary/50 hover:bg-surface-1 transition-colors text-left text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs leading-snug"
                        >
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages Stream - max ~760px centered */
                <div className="max-w-[760px] mx-auto w-full space-y-4">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={i}
                        className={`flex gap-3 items-start ${
                          isUser ? 'flex-row-reverse ml-auto max-w-md sm:max-w-lg' : 'mr-auto max-w-xl sm:max-w-2xl'
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
                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
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
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-danger/40 bg-danger-light text-danger text-xs sm:text-sm max-w-lg mr-auto"
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

            {/* Pinned Composer with Mobile Tab-Bar Safe Area Padding - max ~760px centered */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-border bg-surface-0 pb-safe">
              <div className="max-w-[760px] mx-auto w-full">
                <div className="relative flex items-end gap-2 bg-surface-1 border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-xl p-2 transition-all">
                  <textarea
                    ref={composerRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedCourse ? `Ask about ${selectedCourse.title}... (Enter to send)` : 'Ask a question...'}
                    rows={1}
                    disabled={isPending}
                    className="w-full px-2.5 py-1.5 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none min-h-10 max-h-36 leading-relaxed scrollbar-none disabled:opacity-60"
                  />

                  <div className="shrink-0 p-0.5 rounded-xl bg-surface-0 border border-border/80">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || isPending}
                      aria-label="Send message to AI Tutor"
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        input.trim() && !isPending
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer font-bold'
                          : 'bg-surface-2 text-text-muted cursor-not-allowed opacity-50 border border-border/50'
                      }`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary mt-1.5 px-1 font-medium">
                  <span>Shift+Enter for newline</span>
                </div>
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
