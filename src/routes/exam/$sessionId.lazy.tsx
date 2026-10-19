import * as React from "react";
import { toast } from "sonner";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { usePracticeSession, useSubmitBatchAnswers } from "../../features/practice-session/hooks/usePractice";
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

export const Route = createLazyFileRoute("/exam/$sessionId")({
  component: ExamSessionRoute,
});


type AnswerState = {
  selectedAnswer?: string;
  writtenAnswer?: string;
  timeTaken: number;
};

const QuestionNavigator = React.memo(({ questionsList, currentIndex, answersMap, onJumpToQuestion }: any) => {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', maxWidth: '60%' }}>
      {questionsList.map((q: any, i: number) => {
        const qId = q.questionId?._id || q.questionId;
        const isAnswered = !!answersMap[qId]?.selectedAnswer || !!answersMap[qId]?.writtenAnswer;
        const isCurrent = i === currentIndex;
        return (
          <button
            key={i}
            onClick={() => onJumpToQuestion(i)}
            aria-label={`Question ${i + 1}, ${isCurrent ? 'current, ' : ''}${isAnswered ? 'answered' : 'unanswered'}`}
            aria-current={isCurrent ? 'step' : undefined}
            style={{
              width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer',
              border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: isAnswered ? 'var(--color-primary-light)' : 'var(--color-surface-0)',
              color: isAnswered ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
});

function ExamSessionRoute() {
  useDocumentTitle("Mock Exam — EduAdapt");
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

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

    <header style={{
      background: 'var(--color-surface-0)',
      borderBottom: '1px solid var(--color-border)',
      padding: 'var(--space-16) var(--space-32)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <QuestionNavigator 
        questionsList={questionsList} 
        currentIndex={currentIndex} 
        answersMap={answersMap} 
        onJumpToQuestion={handleJumpToQuestion} 
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-24)' }}>
        {isMonitoring && !isFullscreen && (
          <Button variant="outline" size="sm" onClick={requestFullscreen}>
            <Maximize2 size={14} style={{ marginRight: 6 }} /> Enter Full Screen
          </Button>
        )}
        <ExamTimer ref={timerRef} />
        <Button variant="accent" onClick={handleSubmit} isLoading={isSubmitting}>
          Submit Exam
        </Button>
      </div>
    </header>

    <main style={{ flex: 1, padding: 'var(--space-48) var(--space-24)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
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
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger, #ef4444)',
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
              borderRadius: 8,
              background: 'var(--color-warning-light)',
              border: '1px solid var(--color-warning)',
              color: 'var(--color-text-primary)',
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
            selectedOptionId={currentAnswer.selectedAnswer || null}
            onOptionSelect={handleOptionSelect}
            writtenAnswer={currentAnswer.writtenAnswer || ""}
            onWrittenAnswerChange={handleWrittenAnswerChange}
            theoryTextareaRef={theoryTextareaRef}
            onSubmit={handleSubmit}
            hideSubmit={true}
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-32)' }}>
          <Button variant="outline" disabled={currentIndex === 0} onClick={handlePrev}>
            <ChevronLeft size={16} style={{ marginRight: 8 }} /> Previous
          </Button>
          <Button variant="primary" disabled={currentIndex === questionsList.length - 1} onClick={handleNext}>
            Next <ChevronRight size={16} style={{ marginLeft: 8 }} />
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
