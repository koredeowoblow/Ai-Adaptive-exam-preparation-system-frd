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
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, ShieldAlert, Maximize2, Check, Flag, Timer, WifiOff } from "lucide-react";
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

const QuestionNavigator = React.memo(({ questionsList, currentIndex, answersMap, flaggedIds, onJumpToQuestion }: any) => {
  return (
    <nav
      aria-label="Questions list"
      className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none"
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
        const isFlagged = flaggedIds?.has ? flaggedIds.has(qId) : Boolean(ans?.isFlagged);
        const isCurrent = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJumpToQuestion(i)}
            aria-label={`Question ${i + 1}${isFlagged ? ', flagged' : ''}, ${isCurrent ? 'current, ' : ''}${isAnswered ? 'answered' : 'unanswered'}`}
            aria-current={isCurrent ? 'step' : undefined}
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              fontSize: '0.8rem',
              fontWeight: isCurrent || isAnswered ? 700 : 500,
              cursor: 'pointer',
              border: isCurrent
                ? '2px solid var(--color-primary)'
                : isAnswered
                  ? '1px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
              background: isCurrent
                ? (isAnswered ? 'var(--color-primary)' : 'var(--color-surface-0)')
                : (isAnswered ? 'var(--color-primary-light, rgba(14, 107, 168, 0.1))' : 'var(--color-surface-0)'),
              color: isCurrent
                ? (isAnswered ? '#ffffff' : 'var(--color-primary)')
                : (isAnswered ? 'var(--color-primary)' : 'var(--color-text-secondary)'),
              boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <span>{i + 1}</span>
            {isFlagged ? (
              <Flag
                size={8}
                className="fill-amber-500 text-amber-500"
                style={{ position: 'absolute', top: 2, right: 2 }}
                aria-hidden="true"
              />
            ) : isAnswered ? (
              <Check
                size={8}
                strokeWidth={3}
                style={{
                  position: 'absolute',
                  bottom: 2,
                  color: isCurrent && isAnswered ? '#ffffff' : 'var(--color-primary)',
                }}
                aria-hidden="true"
              />
            ) : null}
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
  const [flaggedIds, setFlaggedIds] = React.useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`exam_flags_${sessionId}`);
        if (saved) return new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return new Set();
  });

  const toggleFlag = React.useCallback((qId: string) => {
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      try {
        localStorage.setItem(`exam_flags_${sessionId}`, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, [sessionId]);

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

  const sessionMode = (responseData?.session as any)?.mode || (questionsList.length >= 40 ? 'mock' : 'quick');
  const isMockMode = sessionMode === 'mock';

  // Offline PWA & Local Queue Synchronization
  const [isOnline, setIsOnline] = React.useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [hasOfflineSyncPending, setHasOfflineSyncPending] = React.useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(`pending_exam_submission_${sessionId}`));
    } catch {
      return false;
    }
  });

  const triggerOfflineSync = React.useCallback(() => {
    try {
      const pendingRaw = localStorage.getItem(`pending_exam_submission_${sessionId}`);
      if (!pendingRaw) return;
      const payload = JSON.parse(pendingRaw);
      toast.info("Syncing cached exam answers with server...");
      submitBatchAnswers(payload, {
        onSuccess: () => {
          localStorage.removeItem(`pending_exam_submission_${sessionId}`);
          localStorage.removeItem(`exam_answers_${sessionId}`);
          setHasOfflineSyncPending(false);
          toast.success("Exam synced and submitted successfully!");
          navigate({ to: `/practice/$sessionId/review`, params: { sessionId } });
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.message || "Failed to sync offline answers.";
          toast.error(`${message} Click 'Retry Sync' to try again.`);
        },
      });
    } catch {
      // ignore
    }
  }, [sessionId, submitBatchAnswers, navigate]);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored");
      triggerOfflineSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are currently offline. Your answers are safely stored locally on this device.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerOfflineSync]);

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
    flushEvents: flushAntiCheatEvents,
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

    flushAntiCheatEvents();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        localStorage.setItem(`pending_exam_submission_${sessionId}`, JSON.stringify(payload));
        setHasOfflineSyncPending(true);
      } catch {
        // ignore
      }
      toast.warning("You are currently offline. Your exam has been safely preserved locally and will automatically submit as soon as internet reconnects.");
      return;
    }

    submitBatchAnswers(payload, {
      onSuccess: () => {
        try {
          localStorage.removeItem(`exam_answers_${sessionId}`);
          localStorage.removeItem(`pending_exam_submission_${sessionId}`);
          setHasOfflineSyncPending(false);
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
  }, [questionsList, submitBatchAnswers, navigate, sessionId, flushAntiCheatEvents]);

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
        {/* Unified single-tier header at md and up (64-72px tall); two-row layout below md */}
        <div className="px-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between min-h-[64px] md:h-[68px] py-2.5 md:py-0 gap-2.5 md:gap-4">

          {/* Left: Course title and status cluster (proctored indicator, fullscreen state) */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 min-w-0 shrink-0">
            <h1
              className="text-sm md:text-base font-bold text-[var(--color-text)] tracking-tight truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[240px]"
              title={courseTitle}
            >
              {courseTitle}
            </h1>

            {/* Small status cluster: proctored indicator & fullscreen state (always visible) */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {isMockMode ? (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  title="Mock Examination Simulation"
                >
                  <Timer size={12} />
                  <span>Mock Exam</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                  title="Adaptive Practice Session"
                >
                  <span>Practice</span>
                </span>
              )}

              {/* Strict No Hints active indicator */}
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                title="Strict Exam Policy: No hints or assists available during assessment"
              >
                No Hints
              </span>

              {isMonitoring && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  title="Proctored Session"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px]">Proctored</span>
                </span>
              )}

              <button
                type="button"
                onClick={isFullscreen ? undefined : requestFullscreen}
                disabled={isFullscreen}
                title={isFullscreen ? "Fullscreen active" : "Enable full screen"}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border transition-colors ${isFullscreen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 cursor-default"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
                  }`}
              >
                <Maximize2 size={12} />
                <span className="text-[11px]">{isFullscreen ? "Fullscreen" : "Full Screen"}</span>
              </button>
            </div>

            {/* Mobile-only timer and submit button in top row */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <ExamTimer ref={timerRef} />
              <Button variant="accent" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
                Submit
              </Button>
            </div>
          </div>

          {/* Middle: Question navigator as a compact strip (scrolls horizontally on small screens) */}
          <div className="flex-1 min-w-0 w-full md:w-auto overflow-x-auto flex items-center md:justify-center py-1 md:py-0 scrollbar-none">
            <QuestionNavigator
              questionsList={questionsList}
              currentIndex={currentIndex}
              answersMap={answersMap}
              flaggedIds={flaggedIds}
              onJumpToQuestion={handleJumpToQuestion}
            />
          </div>

          {/* Right: Timer and Submit on md and up */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ExamTimer ref={timerRef} />
            <Button variant="accent" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit
            </Button>
          </div>

        </div>
      </header>

      {/* Offline Status & Local Queue Sync Banner */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Answers are safely saved locally on this device. Submissions will automatically sync when reconnected.
            </span>
          </div>
          {hasOfflineSyncPending && (
            <Button size="sm" variant="accent" onClick={triggerOfflineSync} isLoading={isSubmitting}>
              Retry Sync Now
            </Button>
          )}
        </div>
      )}

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

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Question {currentIndex + 1} of {questionsList.length} ({answeredCount} answered)
              </span>
              <button
                type="button"
                onClick={() => toggleFlag(activeQuestionId)}
                title={flaggedIds.has(activeQuestionId) ? "Remove flag" : "Flag question for review"}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${flaggedIds.has(activeQuestionId)
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-[var(--color-surface-0)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
              >
                <Flag size={13} className={flaggedIds.has(activeQuestionId) ? "fill-amber-500 text-amber-500" : ""} />
                <span>{flaggedIds.has(activeQuestionId) ? "Flagged" : "Flag"}</span>
              </button>
            </div>

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
