import * as React from 'react';
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { usePracticeSession, useRequestMcqExplanation } from "../features/practice-session/hooks/usePractice";
import { useDocumentTitle } from "../shared/hooks/useDocumentTitle";
import { AppLayout } from "../shared/components/layout/AppLayout";
import { Skeleton } from "../shared/components/Skeleton";
import { ErrorState } from "../shared/components/ErrorState";
import { EmptyState } from "../shared/components/EmptyState";
import { Badge } from "../shared/components/Badge";
import { Button } from "../shared/components/Button";
import { useTopbar } from "../shared/context/TopbarContext";
import { FormattedMathText } from "../shared/components/FormattedMathText";
import { 
  Trophy, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  ClockAlert, 
  Timer, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  Award,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Question } from "../types/question.types";

export const Route = createLazyFileRoute("/practice_/$sessionId/review")({
  component: SessionReviewRoute,
});

function SessionReviewRoute() {
  useDocumentTitle("Session Review - EduAdapt");
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  useTopbar({
    title: "Session Review",
    breadcrumbs: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "History", to: "/practice/history" },
      { label: "Review" },
    ],
  });

  const [currentPage, setCurrentPage] = React.useState(0);
  const questionCardRef = React.useRef<HTMLDivElement>(null);
  const { data: responseData, isLoading, error, isFetching } = usePracticeSession(sessionId);
  const { mutate: requestExplanation } = useRequestMcqExplanation(sessionId);
  const [pendingExplanations, setPendingExplanations] = React.useState<Set<string>>(new Set());

  const handleRequestExplanation = (answerId: string) => {
    setPendingExplanations(prev => new Set(prev).add(answerId));
    requestExplanation(answerId, {
      onError: () => {
        setPendingExplanations(prev => {
          const next = new Set(prev);
          next.delete(answerId);
          return next;
        });
      }
    });
  };

  const goToPage = (idx: number) => {
    setCurrentPage(idx);
    questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container" style={{ padding: 'var(--space-32) var(--space-16)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-20)', marginBottom: 'var(--space-24)' }}>
            <Skeleton style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
            <Skeleton style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
          </div>
          <Skeleton style={{ height: 400, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </AppLayout>
    );
  }

  if (error || !responseData) {
    return (
      <AppLayout>
        <div className="page-container" style={{ padding: 'var(--space-48) var(--space-16)', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-32)' }}>
            <ErrorState 
              message="We could not load your session review. Please verify your connection." 
              onRetry={() => window.location.reload()} 
            />
            <Button variant="outline" onClick={() => navigate({ to: '/dashboard' })} style={{ marginTop: 'var(--space-16)' }}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const sessionData = responseData.session;

  if (sessionData?.status === 'PENDING_GRADING') {
    return (
      <AppLayout>
        <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-32) var(--space-16)' }}>
          <div className="card" style={{ maxWidth: 460, width: '100%', padding: 'var(--space-32)', textAlign: 'center' }}>
            <div 
              style={{ 
                width: 56, 
                height: 56, 
                margin: '0 auto var(--space-16)', 
                borderRadius: 'var(--radius-xl)', 
                background: 'var(--color-primary-light, rgba(14, 107, 168, 0.1))', 
                color: 'var(--color-primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Loader2 className="animate-spin" size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 var(--space-8)', color: 'var(--color-text-primary)' }}>
              Grading in Progress
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
              Your exam has been submitted and is currently being evaluated by the AI grader. Your results and detailed feedback will appear here shortly.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const finalScore = sessionData?.score ?? 0;
  const questionsSummary = responseData.questionsSummary ?? [];
  const correctCount = sessionData.correctAnswers ?? (questionsSummary.filter((q: any) => q.correct).length);
  const answeredCount = sessionData.questionsAnswered ?? 0;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const integrityScore = sessionData.trustScore ?? 100;

  const durationMs = sessionData.endedAt 
    ? new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()
    : 0;

  const questions: any[] = sessionData?.questionsServed ?? [];
  const total = questions.length || responseData.totalServed || 0;
  const currentAns = questions[currentPage] || questions[0];
  const currentQ = currentAns?.questionId as unknown as Question;

  const getPerformanceTier = (score: number) => {
    if (score >= 85) {
      return {
        label: "Excellent Performance",
        icon: TrendingUp,
        variant: "success" as const,
      };
    }
    if (score >= 70) {
      return {
        label: "Good Performance",
        icon: TrendingUp,
        variant: "primary" as const,
      };
    }
    if (score >= 50) {
      return {
        label: "Passing Score",
        icon: Award,
        variant: "warning" as const,
      };
    }
    return {
      label: "Needs Improvement",
      icon: AlertCircle,
      variant: "danger" as const,
    };
  };

  const tier = getPerformanceTier(finalScore);
  const TierIcon = tier.icon;

  return (
    <AppLayout>
      <div className="page-container" style={{ paddingBottom: 'calc(var(--space-48) + 80px)' }}>
        
        {/* Results Hero (Bento Layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-20)', marginBottom: 'var(--space-24)' }}>

          {/* Main Score Card */}
          <div 
            className="card" 
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #094770 100%)', 
              color: '#ffffff', 
              padding: 'var(--space-24) var(--space-28)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 180
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
                Final Score
              </span>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, margin: 'var(--space-8) 0' }}>
                {Math.round(finalScore)}<span style={{ fontSize: '2rem', opacity: 0.8 }}>%</span>
              </div>
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: 'rgba(255, 255, 255, 0.18)', 
                  padding: '4px 12px', 
                  borderRadius: 'var(--radius-full)', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <TierIcon size={16} />
                <span>{tier.label}</span>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.12, pointerEvents: 'none' }}>
              <Trophy size={160} />
            </div>
          </div>

          {/* Performance Summary Metrics Card */}
          <div className="card" style={{ padding: 'var(--space-24)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Session Performance
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                  Summary of your responses and integrity status.
                </p>
              </div>
              {sessionData.lateSubmission && (
                <Badge variant="warning">
                  <ClockAlert size={14} style={{ marginRight: 4 }} /> Late Submission
                </Badge>
              )}
            </div>

            {/* Performance Mini Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-12)' }}>
              
              <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover, rgba(0, 0, 0, 0.03))', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  <Target size={14} /> Accuracy
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {accuracy}%
                </div>
              </div>

              <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover, rgba(0, 0, 0, 0.03))', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  <HelpCircle size={14} /> Answered
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {answeredCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {sessionData.totalQuestions || total}</span>
                </div>
              </div>

              <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover, rgba(0, 0, 0, 0.03))', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  <Timer size={14} /> Avg Speed
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {Math.max(1, Math.round(durationMs / 1000 / (answeredCount || 1)))}s <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ q</span>
                </div>
              </div>

              <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover, rgba(0, 0, 0, 0.03))', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: integrityScore >= 80 ? 'var(--color-success, #10b981)' : 'var(--color-danger)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  <ShieldCheck size={14} /> Integrity
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: integrityScore >= 80 ? 'var(--color-success, #10b981)' : 'var(--color-danger)' }}>
                  {integrityScore}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Detailed Question Review Area */}
        <div style={{ position: 'relative' }}>
          {isFetching && !isLoading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xl)' }}>
              <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
          )}

          {total === 0 && (
            <div className="card" style={{ padding: 'var(--space-32)', textAlign: 'center' }}>
              <EmptyState
                title="No Review Data Available"
                description="There are no answered questions recorded for this session."
                actionLabel="Back to Dashboard"
                onAction={() => navigate({ to: '/dashboard' })}
              />
            </div>
          )}

          {currentAns && currentQ && (() => {
            const ans = currentAns;
            const q = currentQ;
            const isTheory = q.type === 'THEORY';

            return (
              <div 
                ref={questionCardRef} 
                className="card" 
                style={{ 
                  padding: 'var(--space-24)', 
                  marginBottom: 'var(--space-20)',
                  opacity: isFetching ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-16)', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                    <Badge variant="neutral">
                      Question {currentPage + 1} of {total}
                    </Badge>
                    {isTheory && (
                      <Badge variant="primary">
                        <Sparkles size={12} style={{ marginRight: 4 }} /> AI Graded
                      </Badge>
                    )}
                  </div>

                  {!isTheory && (
                    <Badge variant={ans.correct ? "success" : !ans.selectedAnswer ? "warning" : "danger"}>
                      {ans.correct ? "Correct" : !ans.selectedAnswer ? "Unanswered" : "Incorrect"}
                    </Badge>
                  )}
                </div>

                {!isTheory && !ans.selectedAnswer && (
                  <div 
                    style={{ 
                      padding: 'var(--space-12) var(--space-16)', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      border: '1px solid rgba(245, 158, 11, 0.3)', 
                      color: 'var(--color-warning)',
                      fontSize: '0.8rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-8)',
                      marginBottom: 'var(--space-16)'
                    }}
                  >
                    <HelpCircle size={16} style={{ flexShrink: 0 }} />
                    <span>This question was left unanswered. The correct answer is highlighted below.</span>
                  </div>
                )}

                {/* Question Prompt */}
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: 'var(--space-20)' }}>
                  <FormattedMathText text={q.questionText ? q.questionText.replace(/\s*\[Variant\s+\d+\]\s*$/i, '').trim() : ''} />
                </div>

                {/* MCQ Options */}
                {!isTheory && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)', marginBottom: 'var(--space-20)' }}>
                    {q.options.map((option: any) => {
                      const isChosen = option.id === ans.selectedAnswer;
                      const isCorrectOpt = option.id === q.correctAnswer;
                      
                      let borderStyle = '1px solid var(--color-border)';
                      let bgStyle = 'var(--color-surface)';
                      let iconColor = 'var(--color-text-muted)';

                      if (isCorrectOpt) {
                        borderStyle = '1px solid var(--color-success, #10b981)';
                        bgStyle = 'rgba(16, 185, 129, 0.08)';
                        iconColor = 'var(--color-success, #10b981)';
                      } else if (isChosen && !isCorrectOpt) {
                        borderStyle = '1px solid var(--color-danger)';
                        bgStyle = 'rgba(239, 68, 68, 0.08)';
                        iconColor = 'var(--color-danger)';
                      }

                      return (
                        <div
                          key={option.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-12)',
                            padding: 'var(--space-12) var(--space-16)',
                            borderRadius: 'var(--radius-lg)',
                            border: borderStyle,
                            background: bgStyle,
                            fontSize: '0.9rem',
                            fontWeight: 500
                          }}
                        >
                          <div 
                            style={{ 
                              width: 22, 
                              height: 22, 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: iconColor 
                            }}
                          >
                            {isCorrectOpt ? (
                              <CheckCircle2 size={18} />
                            ) : isChosen ? (
                              <XCircle size={18} />
                            ) : (
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--color-border)' }} />
                            )}
                          </div>
                          <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
                            <FormattedMathText text={option.text} />
                          </span>
                          {isChosen && (
                            <Badge variant={isCorrectOpt ? "success" : "danger"}>Your Answer</Badge>
                          )}
                          {isCorrectOpt && !isChosen && (
                            <Badge variant="success">Correct Answer</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Theory Answer Review */}
                {isTheory && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', marginBottom: 'var(--space-20)' }}>
                    {ans.writtenAnswer ? (
                      <div style={{ padding: 'var(--space-16)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                          Your Submitted Answer
                        </span>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          <FormattedMathText text={ans.writtenAnswer} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: 'var(--space-14)', borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--color-warning)', fontSize: '0.85rem' }}>
                        No answer was submitted for this question.
                      </div>
                    )}

                    {ans.gradingStatus === 'GRADED' && (
                      <div 
                        style={{ 
                          padding: 'var(--space-16)', 
                          borderRadius: 'var(--radius-lg)', 
                          border: `1px solid ${(ans.score ?? 0) >= 0.7 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          background: (ans.score ?? 0) >= 0.7 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: (ans.score ?? 0) >= 0.7 ? 'var(--color-success, #10b981)' : 'var(--color-danger)', marginBottom: 6 }}>
                          AI Evaluation Grade: {Math.round((ans.score ?? 0) * 100)}%
                        </div>
                        {ans.theoryFeedback && (
                          <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                            <FormattedMathText text={ans.theoryFeedback} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Explanation for MCQ */}
                {!isTheory && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
                    {ans.explanationStatus === 'READY' && ans.aiExplanation ? (
                      <div 
                        style={{ 
                          padding: 'var(--space-16)', 
                          borderRadius: 'var(--radius-lg)', 
                          background: 'var(--color-primary-light, rgba(14, 107, 168, 0.08))', 
                          border: '1px solid rgba(14, 107, 168, 0.2)' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
                          <Sparkles size={16} />
                          <span>AI Tutor Explanation</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                          <FormattedMathText text={ans.aiExplanation} />
                        </div>
                      </div>
                    ) : ans.explanationStatus === 'PENDING' || pendingExplanations.has((ans as any)._id) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: 'var(--space-12)' }}>
                        <Loader2 className="animate-spin" size={16} color="var(--color-primary)" />
                        Generating detailed AI explanation...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestExplanation((ans as any)._id)}
                        >
                          <Sparkles size={14} style={{ marginRight: 6 }} />
                          {ans.explanationStatus === 'FAILED' ? 'Retry AI Explanation' : 'Ask AI Tutor for Explanation'}
                        </Button>
                        {ans.explanationStatus === 'FAILED' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Generation failed. Please retry.</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pagination Controls */}
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft size={16} style={{ marginRight: 4 }} /> Previous
              </Button>

              {/* Dot Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {questionsSummary.map((item: any, i: number) => {
                  const isCur = i === currentPage;
                  const isCorrect = item?.correct;
                  const isUnans = item?.answered === false;
                  
                  let dotColor = 'var(--color-border)';
                  if (isCur) dotColor = 'var(--color-primary)';
                  else if (isCorrect) dotColor = 'var(--color-success, #10b981)';
                  else if (!isUnans) dotColor = 'var(--color-danger)';

                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => goToPage(i)}
                      aria-label={`Jump to question ${i + 1}`}
                      style={{
                        width: isCur ? 20 : 10,
                        height: 10,
                        borderRadius: 'var(--radius-full)',
                        background: dotColor,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => goToPage(Math.min(total - 1, currentPage + 1))}
                disabled={currentPage === total - 1}
              >
                Next <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </Button>
            </div>
          )}
        </div>

        {/* Floating Return Button */}
        <div 
          style={{ 
            position: 'fixed', 
            bottom: 24, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 40,
            boxShadow: 'var(--shadow-lg)' 
          }}
        >
          <Button
            variant="primary"
            onClick={() => navigate({ to: '/dashboard' })}
            style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px', fontSize: '0.9rem' }}
          >
            Back to Dashboard <ArrowRight size={16} style={{ marginLeft: 8 }} />
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}

