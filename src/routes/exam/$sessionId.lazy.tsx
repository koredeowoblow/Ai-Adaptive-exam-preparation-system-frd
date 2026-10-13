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
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { useAntiCheat } from "../../features/practice-session/hooks/useAntiCheat";
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

  useAntiCheat(sessionId, isMonitoring, theoryTextareaRef, activeQuestionId);

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
    saveCurrentTime();
    if (currentIndex < questionsList.length - 1) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questionsList.length, saveCurrentTime]);

  const handlePrev = React.useCallback(() => {
    saveCurrentTime();
    if (currentIndex > 0) {
      questionStartTimeRef.current = Date.now();
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, saveCurrentTime]);

  const handleJumpToQuestion = React.useCallback((index: number) => {
    saveCurrentTime();
    questionStartTimeRef.current = Date.now();
    setCurrentIndex(index);
  }, [saveCurrentTime]);

  const processSubmission = React.useCallback((answersToSubmit: Record<string, AnswerState>) => {
    const payload = {
      answers: Object.keys(answersToSubmit).map(qId => ({
        questionId: qId,
        selectedAnswer: answersToSubmit[qId].selectedAnswer,
        writtenAnswer: answersToSubmit[qId].writtenAnswer,
        timeTaken: answersToSubmit[qId].timeTaken
      }))
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
      onError: () => {
        toast.error("Failed to submit exam. Please try again.");
      }
    });
  }, [submitBatchAnswers, navigate, sessionId]);

  const handleSubmit = React.useCallback(() => {
    // Flush local answer if active question is THEORY to prevent data loss if submit is clicked before blur
    if (activeQuestionObj?.type === 'THEORY' && theoryTextareaRef.current) {
      const currentText = theoryTextareaRef.current.value;
      if (currentText !== answersMap[activeQuestionId]?.writtenAnswer) {
        setAnswersMap(prev => ({
          ...prev,
          [activeQuestionId]: {
            ...prev[activeQuestionId],
            writtenAnswer: currentText,
            timeTaken: (prev[activeQuestionId]?.timeTaken || 0) + getQuestionElapsedSeconds()
          }
        }));
      }
    }

    saveCurrentTime();
    
    // Process submit using functional state update to guarantee we have the freshly flushed state
    setAnswersMap(currentAnswersMap => {
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
  }, [activeQuestionObj, activeQuestionId, answersMap, questionsList.length, saveCurrentTime, processSubmission]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <Skeleton style={{ width: 400, height: 400, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (error || !responseData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <ErrorState message="We couldn't load your mock exam. Please check your connection." />
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
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
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
        <ExamTimer ref={timerRef} />
        <Button variant="accent" onClick={handleSubmit} isLoading={isSubmitting}>
          Submit Exam
        </Button>
      </div>
    </header>

    <main style={{ flex: 1, padding: 'var(--space-48) var(--space-24)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
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
