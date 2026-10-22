import * as React from "react";
import { toast } from "sonner";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { usePracticeSession, useSubmitBatchAnswers } from "../../features/practice-session/hooks/usePractice";
import { practiceApi } from "../../features/practice-session/api/practice.api";
import { ExamTimer, type ExamTimerRef } from "../../features/practice-session/components/ExamTimer";
import type { Question } from "../../types/question.types";
import { Skeleton } from "../../shared/components/Skeleton";
import { ErrorState } from "../../shared/components/ErrorState";
import { EmptyState } from "../../shared/components/EmptyState";
import { Button } from "../../shared/components/Button";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, ShieldAlert, Maximize2 } from "lucide-react";
import { useAntiCheat } from "../../features/practice-session/hooks/useAntiCheat";
import { IntegrityWarningBanner } from "../../features/practice-session/components/IntegrityWarningBanner";
import { ExamNoticeModal } from "../../features/practice-session/components/ExamNoticeModal";
import { FullscreenEnforcerOverlay } from "../../features/practice-session/components/FullscreenEnforcerOverlay";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { QuestionCard } from "../../features/practice-session/components/QuestionCard";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { ExamWatermark } from "../../features/practice-session/components/ExamWatermark";

export const Route = createLazyFileRoute("/exam/$sessionId")({
  component: ExamSessionRoute,
});


type AnswerState = {
  selectedAnswer?: string;
  writtenAnswer?: string;
  subPartAnswers?: { partId: string; label?: string; writtenAnswer: string }[];
  timeTaken: number;
};

const QuestionNavigator = React.memo(({ questionsList, currentIndex, answersMap, onJumpToQuestion }: any) => {
  return (
    <nav
      aria-label="Questions list"
      className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none"
      style={{
        maxWidth: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {questionsList.map((q: any, i: number) => {
        const qId = q.questionId?._id || q.questionId;
        const ans = answersMap[qId];
        const hasSubPartAns = Array.isArray(ans?.subPartAnswers) && ans.subPartAnswers.some((sp: any) => sp.writtenAnswer?.trim().length > 0);
        const isAnswered = !!ans?.selectedAnswer || !!ans?.writtenAnswer || hasSubPartAns;
        const isCurrent = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJumpToQuestion(i)}
            aria-label={`Question ${i + 1}, ${isCurrent ? 'current, ' : ''}${isAnswered ? 'answered' : 'unanswered'}`}
            aria-current={isCurrent ? 'step' : undefined}
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: isCurrent || isAnswered ? 700 : 500,
              cursor: 'pointer',
              border: isCurrent
                ? '2px solid var(--color-primary)'
                : isAnswered
                  ? '1px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
              background: isCurrent
                ? (isAnswered ? 'var(--color-primary)' : 'var(--color-surface-0)')
                : (isAnswered ? 'var(--color-primary-light)' : 'var(--color-surface-0)'),
              color: isCurrent
                ? (isAnswered ? '#ffffff' : 'var(--color-primary)')
                : (isAnswered ? 'var(--color-primary)' : 'var(--color-text-secondary)'),
              boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </nav>
  );
});

function ExamSessionRoute() {
  useDocumentTitle("Mock Exam - EduAdapt");
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: responseData, isLoading, error } = usePracticeSession(sessionId);
  const { mutate: submitBatchAnswers, isPending: isSubmitting } = useSubmitBatchAnswers(sessionId);

  const isMonitoring = responseData?.session?.status === "active";
  const theoryTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const timerRef = React.useRef<ExamTimerRef>(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answersMap, setAnswersMap] = React.useState<Record<string, AnswerState>>(() => {
    try {
      const saved = localStorage.getItem(`exam_answers_${sessionId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage read failures
    }
    return {};
  });
  const [confirmState, setConfirmState] = React.useState({ isOpen: false, message: '' });

  // Sync answers to localStorage on change
  React.useEffect(() => {
    if (Object.keys(answersMap).length > 0) {
      try {
        localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(answersMap));
      } catch {
        // Ignore storage write failures
      }
    }
  }, [answersMap, sessionId]);

  const questionsList = React.useMemo(() => responseData?.session?.questionsServed || [], [responseData?.session?.questionsServed]);
  const activeQuestionId = typeof questionsList[currentIndex]?.questionId === 'object'
    ? (questionsList[currentIndex]?.questionId as any)?._id
    : questionsList[currentIndex]?.questionId;

  const courseTitle = React.useMemo(() => {
    const c = responseData?.session?.courseId;
    if (typeof c === 'object' && c !== null) {
      return (c as any).title || (c as any).name || 'Mock Examination';
    }
    return 'Mock Examination';
  }, [responseData?.session?.courseId]);

  const answeredCount = React.useMemo(() => {
    return questionsList.filter((q: any) => {
      const qId = typeof q.questionId === 'object' ? q.questionId?._id : q.questionId;
      return !!answersMap[qId]?.selectedAnswer || !!answersMap[qId]?.writtenAnswer;
    }).length;
  }, [questionsList, answersMap]);

  const [hasStartedExam, setHasStartedExam] = React.useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`exam_answers_${sessionId}`);
        if (saved && Object.keys(JSON.parse(saved)).length > 0) return true;
        return sessionStorage.getItem(`exam_started_${sessionId}`) === 'true';
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [bypassFullscreenOverlay, setBypassFullscreenOverlay] = React.useState(false);

  const handleStartExam = React.useCallback((fullscreenGranted?: boolean) => {
    try {
      sessionStorage.setItem(`exam_started_${sessionId}`, 'true');
    } catch {
      // ignore
    }
    if (fullscreenGranted === false) {
      setBypassFullscreenOverlay(true);
    }
    setHasStartedExam(true);
  }, [sessionId]);

  const {
    isFullscreen,
    requestFullscreen,
    lastViolationType,
    clearViolation,
    isProtectionFlashing,
  } = useAntiCheat(
    sessionId,
    isMonitoring && hasStartedExam,
    theoryTextareaRef,
    activeQuestionId
  );

  React.useEffect(() => {
    if (isFullscreen) {
      setBypassFullscreenOverlay(false);
    }
  }, [isFullscreen]);

  // Extract full question object
  const activeQuestionObj = React.useMemo(() => questionsList[currentIndex]?.questionId as unknown as Question, [questionsList, currentIndex]);

  const difficultyLabel = React.useMemo<'EASY' | 'MEDIUM' | 'HARD' | undefined>(() => {
    if (!activeQuestionObj) return undefined;
    if (typeof activeQuestionObj.difficulty === 'number') {
      if (activeQuestionObj.difficulty <= 2) return 'EASY';
      if (activeQuestionObj.difficulty <= 4) return 'MEDIUM';
      return 'HARD';
    }
    if (typeof activeQuestionObj.eloRating === 'number') {
      if (activeQuestionObj.eloRating < 1200) return 'EASY';
      if (activeQuestionObj.eloRating <= 1600) return 'MEDIUM';
      return 'HARD';
    }
    return undefined;
  }, [activeQuestionObj]);

  const currentAnswer = answersMap[activeQuestionId] || { timeTaken: 0 };
  const questionStartTimeRef = React.useRef<number>(Date.now());

  const getQuestionElapsedSeconds = React.useCallback(() => {
    const elapsed = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    questionStartTimeRef.current = Date.now();
    return elapsed;
  }, []);

  const handleOptionSelect = React.useCallback((optionId: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [activeQuestionId]: {
        ...prev[activeQuestionId],
        selectedAnswer: optionId,
        timeTaken: (prev[activeQuestionId]?.timeTaken || 0) + getQuestionElapsedSeconds()
      }
    }));
  }, [activeQuestionId, getQuestionElapsedSeconds]);

  const handleWrittenAnswerChange = React.useCallback((text: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [activeQuestionId]: {
        ...prev[activeQuestionId],
        writtenAnswer: text,
      }
    }));
  }, [activeQuestionId]);

  const flushCurrentDraft = React.useCallback(() => {
    if (activeQuestionId && theoryTextareaRef.current && activeQuestionObj?.type === 'THEORY') {
      const currentText = theoryTextareaRef.current.value;
      setAnswersMap(prev => {
        if (prev[activeQuestionId]?.writtenAnswer === currentText) return prev;
        const updated = {
          ...prev,
          [activeQuestionId]: {
            ...prev[activeQuestionId],
            writtenAnswer: currentText,
          }
        };
        try {
          localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(updated));
        } catch {
          // Ignore storage write failure
        }
        return updated;
      });
    }
  }, [activeQuestionId, activeQuestionObj, sessionId]);

  // Synchronously persist draft to localStorage on tab switch or page close
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      flushCurrentDraft();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushCurrentDraft();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushCurrentDraft]);

  const saveCurrentTime = React.useCallback(() => {
    if (activeQuestionId) {
      setAnswersMap(prev => ({
        ...prev,
        [activeQuestionId]: {
          ...prev[activeQuestionId],
          timeTaken: (prev[activeQuestionId]?.timeTaken || 0) + getQuestionElapsedSeconds()
        }
      }));
    }
  }, [activeQuestionId, getQuestionElapsedSeconds]);

  const handleNext = React.useCallback(() => {
    flushCurrentDraft();
    saveCurrentTime();
    if (currentIndex < questionsList.length - 1) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questionsList.length, saveCurrentTime, flushCurrentDraft]);

  const handlePrev = React.useCallback(() => {
    flushCurrentDraft();
    saveCurrentTime();
    if (currentIndex > 0) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, saveCurrentTime, flushCurrentDraft]);

  const handleJumpToQuestion = React.useCallback((index: number) => {
    flushCurrentDraft();
    saveCurrentTime();
    questionStartTimeRef.current = Date.now();
    setCurrentIndex(index);
  }, [saveCurrentTime, flushCurrentDraft]);

  const processSubmission = React.useCallback((answersToSubmit: Record<string, AnswerState>) => {
    const payload = {
      answers: questionsList.map((q: any) => {
        const qId = typeof q.questionId === 'object' ? q.questionId?._id : q.questionId;
        const ans = answersToSubmit[qId] || {};
        return {
          questionId: String(qId),
          selectedAnswer: ans.selectedAnswer || undefined,
          writtenAnswer: ans.writtenAnswer || undefined,
          subPartAnswers: ans.subPartAnswers || undefined,
          timeTaken: Math.max(0, Math.round(ans.timeTaken || 0)),
        };
      })
    };

    submitBatchAnswers(payload, {
      onSuccess: () => {
        try {
          localStorage.removeItem(`exam_answers_${sessionId}`);
        } catch {
          // Ignore storage cleanup failure
        }
        toast.success("Exam submitted successfully");
        navigate({ to: `/practice/$sessionId/review`, params: { sessionId } });
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "Failed to submit exam. Please try again.";
        toast.error(message);
      }
    });
  }, [questionsList, submitBatchAnswers, navigate, sessionId]);

  const handleSubmit = React.useCallback(() => {
    flushCurrentDraft();
    saveCurrentTime();

    // Process submit using functional state update to guarantee we have the freshly flushed state
    setAnswersMap(currentAnswersMap => {
      // Ensure the latest text in theory textarea is included even if focused
      if (activeQuestionObj?.type === 'THEORY' && theoryTextareaRef.current) {
        const liveVal = theoryTextareaRef.current.value;
        if (currentAnswersMap[activeQuestionId]?.writtenAnswer !== liveVal) {
          currentAnswersMap = {
            ...currentAnswersMap,
            [activeQuestionId]: {
              ...currentAnswersMap[activeQuestionId],
              writtenAnswer: liveVal,
            }
          };
          try {
            localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(currentAnswersMap));
          } catch {
            // Ignore storage write failure
          }
        }
      }

      const answeredCount = Object.keys(currentAnswersMap).filter(id => currentAnswersMap[id].selectedAnswer || currentAnswersMap[id].writtenAnswer).length;

      if (answeredCount < questionsList.length) {
        setConfirmState({
          isOpen: true,
          message: `You have ${questionsList.length - answeredCount} unanswered questions. Are you sure you want to submit?`
        });
        return currentAnswersMap;
      }

      processSubmission(currentAnswersMap);
      return currentAnswersMap;
    });
  }, [activeQuestionObj, activeQuestionId, questionsList.length, saveCurrentTime, processSubmission, flushCurrentDraft, sessionId]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <Skeleton style={{ width: 400, height: 400, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (error || !responseData?.session) {
    const errorMsg = (error as any)?.response?.data?.message || "We couldn't load your mock exam. Please check your connection.";
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', gap: 16, padding: '0 20px' }}>
        <ErrorState
          message={errorMsg}
          onRetry={() => window.location.reload()}
        />
        <Button variant="outline" onClick={() => navigate({ to: '/exam-prep' })}>
          Return to Exam Prep
        </Button>
      </div>
    );
  }

  if (responseData.session.status === 'completed') {
    navigate({ to: `/practice/$sessionId/review`, params: { sessionId }, replace: true });
    return null;
  }

  if (responseData.session.status === 'TERMINATED_BY_PROCTOR') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-danger, #ef4444)' }}>
          Exam Terminated by Invigilator
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: 480, marginBottom: 24, lineHeight: 1.6 }}>
          {responseData.session.terminatedReason || 'This exam was forcibly terminated by the proctor for integrity non-compliance or repeated unauthorized tab switching.'}
        </p>
        <Button variant="primary" onClick={() => navigate({ to: '/dashboard' })}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (responseData.session.status === 'PENDING_GRADING') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" style={{ marginBottom: 24 }} />
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>Grading your exam...</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Please wait while we evaluate your submission and update your mastery.</p>
      </div>
    );
  }

  if (responseData.session.status === 'FAILED') {
    const handleRetryGrading = () => {
      const payload = {
        answers: responseData.session.questionsServed.map((q: any) => ({
          questionId: q.questionId?._id || q.questionId,
          selectedAnswer: q.selectedAnswer,
          writtenAnswer: q.writtenAnswer,
          timeTaken: q.timeTaken
        }))
      };
      submitBatchAnswers(payload, {
        onSuccess: () => {
          toast.success("Retrying grading...");
        },
        onError: () => {
          toast.error("Failed to enqueue retry.");
        }
      });
    };

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <ErrorState message="An error occurred while grading your exam. Your answers have been saved." />
        <Button variant="primary" onClick={handleRetryGrading} isLoading={isSubmitting} style={{ marginTop: 24 }}>
          Retry Grading
        </Button>
      </div>
    );
  }

  if (questionsList.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <EmptyState
          title="No Questions in Exam"
          description="This exam session has no questions. Please start a new session."
          actionLabel="Return to Exam Prep"
          onAction={() => navigate({ to: '/exam-prep' })}
        />
      </div>
    );
  }

  const clampedMessage = (() => {
    try {
      return sessionStorage.getItem(`exam_clamped_message_${sessionId}`);
    } catch {
      return null;
    }
  })();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Blackout Flash Screen on Screenshot Attempt */}
      {isProtectionFlashing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            backgroundColor: '#000000',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Pre-Exam Anti-Cheat Notice & Gatekeeper Modal */}
      <ExamNoticeModal
        isOpen={!hasStartedExam && isMonitoring}
        onStartExam={handleStartExam}
        onRequestFullscreen={requestFullscreen}
        onExitExam={() => navigate({ to: '/exam-prep' })}
        courseTitle={
          typeof responseData?.session?.courseId === 'object'
            ? (responseData?.session?.courseId as any)?.title
            : 'Assessment'
        }
        questionCount={questionsList.length}
      />

      {/* Forensic Diagonal Security Watermark */}
      <ExamWatermark studentName={user?.name} studentEmail={user?.email} sessionId={sessionId} />

      {/* Strict Fullscreen Enforcer Overlay during Exam */}
      <FullscreenEnforcerOverlay
        isVisible={hasStartedExam && isMonitoring && !isFullscreen && !bypassFullscreenOverlay}
        onRequestFullscreen={async () => {
          const success = await requestFullscreen();
          if (success) {
            setBypassFullscreenOverlay(false);
          }
          return success;
        }}
        onContinueWindowed={() => {
          setBypassFullscreenOverlay(true);
        }}
        onExitExam={() => {
          navigate({ to: '/exam-prep' });
        }}
      />

      <header className="sticky top-0 z-30 bg-[var(--color-surface-0)] border-b border-[var(--color-border)] shadow-xs">
        {/* Top Tier: Course title + Proctoring badge + Timer + Actions */}
        <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-[var(--color-text)] tracking-tight truncate max-w-[180px] sm:max-w-md">
              {courseTitle}
            </h1>
            {isMonitoring && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Proctored
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {isMonitoring && !isFullscreen && (
              <Button variant="outline" size="sm" onClick={requestFullscreen}>
                <Maximize2 size={14} style={{ marginRight: 6 }} /> Full Screen
              </Button>
            )}
            <ExamTimer ref={timerRef} />
            <Button variant="accent" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Secondary Tier: Horizontal question pill strip + answer count */}
        <div className="px-4 sm:px-8 py-2 flex items-center justify-between gap-3 bg-[var(--color-surface-1)]">
          <div className="flex-1 min-w-0">
            <QuestionNavigator
              questionsList={questionsList}
              currentIndex={currentIndex}
              answersMap={answersMap}
              onJumpToQuestion={handleJumpToQuestion}
            />
          </div>
          <div className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-0)] border border-[var(--color-border)] px-2.5 py-1 rounded-md">
            {answeredCount} / {questionsList.length} answered
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-20 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Live Proctor Warning Banner */}
          {responseData?.session?.proctorWarning && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                color: 'var(--color-warning, #d97706)',
              }}
            >
              <AlertTriangle size={22} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '0.875rem' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  ⚠️ Official Invigilator Warning
                </strong>
                <span>{responseData.session.proctorWarning}</span>
              </div>
            </div>
          )}

          {/* Anti-Cheat Fullscreen Requirement Banner */}
          {isMonitoring && !isFullscreen && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 16px',
                marginBottom: 20,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-danger-light)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.875rem' }}>Anti-Cheat Proctoring Active</strong>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    This exam requires full screen mode. Leaving fullscreen or switching windows is logged.
                  </span>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={requestFullscreen}>
                <Maximize2 size={14} style={{ marginRight: 6 }} /> Full Screen
              </Button>
            </div>
          )}

          {/* Integrity Violation Warning Banner */}
          {lastViolationType && (
            <IntegrityWarningBanner
              violationType={lastViolationType}
              onDismiss={clearViolation}
            />
          )}

          {clampedMessage && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                marginBottom: 20,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-warning-light)',
                border: '1px solid var(--color-warning)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, color: 'var(--color-warning)' }} />
              <span>{clampedMessage}</span>
            </div>
          )}

          {activeQuestionObj && (
            <QuestionCard
              question={activeQuestionObj}
              difficulty={difficultyLabel}
              selectedOptionId={currentAnswer.selectedAnswer || null}
              onOptionSelect={handleOptionSelect}
              writtenAnswer={currentAnswer.writtenAnswer || ""}
              onWrittenAnswerChange={handleWrittenAnswerChange}
              subPartAnswers={currentAnswer.subPartAnswers || []}
              onSubPartAnswersChange={(subParts) => {
                setAnswersMap((prev) => {
                  const updated = {
                    ...prev,
                    [activeQuestionId]: {
                      ...prev[activeQuestionId],
                      timeTaken: prev[activeQuestionId]?.timeTaken || 0,
                      subPartAnswers: subParts,
                      writtenAnswer: subParts.map((sp) => `**${sp.label}:**\n${sp.writtenAnswer}`).join('\n\n'),
                    },
                  };
                  try {
                    localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                  return updated;
                });
              }}
              theoryTextareaRef={theoryTextareaRef}
              onSubmit={handleSubmit}
              hideSubmit={true}
              onSecurityViolation={(violation) => {
                practiceApi.logAntiCheatEvents(sessionId, {
                  events: [
                    {
                      type: (violation.type as any) || 'MULTIPLE_VOICES_DETECTED',
                      questionId: activeQuestionId,
                      timestamp: new Date().toISOString(),
                      metadata: { details: violation.details },
                    },
                  ],
                }).catch(() => { });
              }}
              isSubmitting={isSubmitting}
              disabled={isSubmitting}
            />
          )}

          {/* Bottom Question Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)] mt-8">
            <Button variant="outline" disabled={currentIndex === 0} onClick={handlePrev}>
              <ChevronLeft size={16} style={{ marginRight: 6 }} /> Previous
            </Button>

            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Question {currentIndex + 1} of {questionsList.length}
            </span>

            <Button
              variant="primary"
              disabled={currentIndex === questionsList.length - 1}
              onClick={handleNext}
            >
              Next <ChevronRight size={16} style={{ marginLeft: 6 }} />
            </Button>
          </div>

          <ConfirmDialog
            isOpen={confirmState.isOpen}
            title="Submit Exam?"
            message={confirmState.message}
            confirmText="Submit Anyway"
            cancelText="Keep Working"
            onCancel={() => setConfirmState(s => ({ ...s, isOpen: false }))}
            onConfirm={() => {
              setConfirmState(s => ({ ...s, isOpen: false }));
              processSubmission(answersMap);
            }}
            isPending={isSubmitting}
          />
        </div>
      </main>
    </div>
  );
}
