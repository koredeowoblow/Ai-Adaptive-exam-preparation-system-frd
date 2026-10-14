import React from 'react';
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { usePracticeSession } from "../features/practice-session/hooks/usePractice";
import { useDocumentTitle } from "../shared/hooks/useDocumentTitle";
import { AppLayout } from "../shared/components/layout/AppLayout";
import { Skeleton } from "../shared/components/Skeleton";
import { ErrorState } from "../shared/components/ErrorState";
import { EmptyState } from "../shared/components/EmptyState";
import { Trophy, ArrowRight, Sparkles, Loader2, ClockAlert, Timer, Target, TrendingUp, ShieldCheck, HelpCircle, AlertCircle, Award } from "lucide-react";
import type { Question } from "../types/question.types";
import { useRequestMcqExplanation } from "../features/practice-session/hooks/usePractice";
import { clsx } from "clsx";
import { FormattedMathText } from "../shared/components/FormattedMathText";

export const Route = createLazyFileRoute("/practice_/$sessionId/review")({
  component: SessionReviewRoute,
});

function SessionReviewRoute() {
  useDocumentTitle("Session Review — EduAdapt");
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = React.useState(0);
  const { data: responseData, isLoading, error, isFetching } = usePracticeSession(sessionId, currentPage, 1);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Skeleton style={{ width: 400, height: 400, borderRadius: '1.5rem' }} />
      </div>
    );
  }

  if (error || !responseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState message="We couldn't load your session review. Please check your connection." />
      </div>
    );
  }

  const sessionData = responseData.session;

  if (sessionData?.status === 'PENDING_GRADING') {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grading in Progress</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Your exam has been submitted and is currently being evaluated. Your results and detailed feedback will appear here in just a moment.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const finalScore = sessionData?.score ?? 0;
  const isFullExam = sessionData.totalQuestions >= 40;
  void isFullExam;

  const questionsSummary = responseData.questionsSummary ?? [];
  const correctCount = sessionData.correctAnswers ?? (questionsSummary.filter((q: any) => q.correct).length);
  const answeredCount = sessionData.questionsAnswered ?? 0;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const integrityScore = sessionData.trustScore ?? 100;

  const durationMs = sessionData.endedAt 
    ? new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()
    : 0;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  void timeString;

  const questions: any[] = sessionData?.questionsServed ?? [];
  const total = responseData.totalServed ?? questions.length;
  const currentAns = questions[0]; // Array only contains 1 item because of limit=1
  const currentQ = currentAns?.questionId as unknown as Question;

  const getPerformanceTier = (score: number) => {
    if (score >= 85) {
      return {
        label: "Excellent Performance",
        icon: TrendingUp,
        badgeClass: "bg-white/20 text-white",
      };
    }
    if (score >= 70) {
      return {
        label: "Good Performance",
        icon: TrendingUp,
        badgeClass: "bg-white/20 text-white",
      };
    }
    if (score >= 50) {
      return {
        label: "Passing / Fair",
        icon: Award,
        badgeClass: "bg-white/20 text-white",
      };
    }
    return {
      label: "Needs Improvement",
      icon: AlertCircle,
      badgeClass: "bg-rose-500/30 text-rose-100 border border-rose-300/30",
    };
  };

  const tier = getPerformanceTier(finalScore);
  const TierIcon = tier.icon;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">

          {/* Results Hero (Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">

            {/* Main Score Card */}
            <div className="md:col-span-4 bg-primary text-white p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-[0_8px_30px_rgba(14,165,233,0.3)]">
              <div className="relative z-10">
                <p className="text-sm font-bold opacity-80 mb-2 uppercase tracking-widest">Final Score</p>
                <h2 className="text-7xl font-black leading-none mb-6">{Math.round(finalScore)}<span className="text-4xl opacity-80">%</span></h2>
                <div className={clsx("mt-4 inline-flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-sm", tier.badgeClass)}>
                  <TierIcon size={18} />
                  <span>{tier.label}</span>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 opacity-10">
                <Trophy size={200} />
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            </div>

            {/* Performance Summary Card */}
            <div className="md:col-span-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Session Completed!</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Here's a breakdown of how you performed.</p>
                </div>
                {sessionData.lateSubmission && (
                  <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-bold border border-orange-100 dark:border-orange-800/30">
                    <ClockAlert size={18} />
                    Late Submission
                  </div>
                )}
              </div>

              {/* Performance Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{accuracy}%</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                    <HelpCircle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Answered</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{answeredCount} <span className="text-sm font-medium text-gray-400">/ {sessionData.totalQuestions}</span></p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                    <Timer size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Avg Speed</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{Math.max(1, Math.round(durationMs / 1000 / (answeredCount || 1)))}s <span className="text-sm font-medium text-gray-400">/ q</span></p>
                </div>

                <div className={clsx(
                  "p-4 rounded-2xl border",
                  integrityScore >= 80 ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" :
                  integrityScore >= 50 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30" :
                  "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                )}>
                  <div className={clsx(
                    "flex items-center gap-2 mb-2",
                    integrityScore >= 80 ? "text-green-600 dark:text-green-400" :
                    integrityScore >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Integrity</span>
                  </div>
                  <p className={clsx(
                    "text-2xl font-black",
                    integrityScore >= 80 ? "text-green-700 dark:text-green-400" :
                    integrityScore >= 50 ? "text-amber-700 dark:text-amber-400" :
                    "text-red-700 dark:text-red-400"
                  )}>{integrityScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review Area */}
          <div className="space-y-4 relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {total === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
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
                <div className={clsx("bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-700", isFetching && "opacity-50")}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full tracking-wider uppercase">
                        Question {currentPage + 1} <span className="font-normal opacity-60">of {total}</span>
                      </span>
                      {isTheory && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold rounded-full tracking-wider uppercase flex items-center gap-1">
                          <Sparkles size={12} /> AI Graded
                        </span>
                      )}
                    </div>
                    {!isTheory && (
                      <span className={clsx(
                        "text-xs font-bold px-3 py-1 rounded-full",
                        ans.correct
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : !ans.selectedAnswer
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {ans.correct ? '✓ Correct' : !ans.selectedAnswer ? '○ Unanswered' : '✗ Incorrect'}
                      </span>
                    )}
                  </div>

                  {!isTheory && !ans.selectedAnswer && (
                    <div className="mb-6 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                      <HelpCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>This question was left unanswered. The correct answer is highlighted in green below.</span>
                    </div>
                  )}

                  {/* Question text */}
                  <div className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
                    <FormattedMathText text={q.questionText} />
                  </div>

                  {/* MCQ options */}
                  {!isTheory && q.options && (
                    <div className="space-y-2 mb-6">
                      {q.options.map((option: any) => {
                        const isChosen = option.id === ans.selectedAnswer;
                        const isCorrectOpt = option.id === q.correctAnswer;
                        return (
                          <div
                            key={option.id}
                            className={clsx(
                              "flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all",
                              isCorrectOpt
                                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                : isChosen && !isCorrectOpt
                                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300"
                                : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            <div className={clsx(
                              "w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                              isCorrectOpt ? "border-green-500 bg-green-500"
                                : isChosen && !isCorrectOpt ? "border-red-500 bg-red-500"
                                : "border-gray-300 dark:border-gray-600"
                            )}>
                              {isCorrectOpt && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {isChosen && !isCorrectOpt && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                            <span className="flex-1">
                              <FormattedMathText text={option.text} />
                            </span>
                            {isChosen && (
                              <span className={clsx(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                isCorrectOpt ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}>Your answer</span>
                            )}
                            {isCorrectOpt && !isChosen && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Theory answer */}
                  {isTheory && (
                    <div className="mb-6 space-y-3">
                      {ans.writtenAnswer ? (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Answer</p>
                          <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            <FormattedMathText text={ans.writtenAnswer} />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">No answer was submitted for this question.</p>
                        </div>
                      )}
                      {ans.gradingStatus === 'GRADED' && (
                        <div className={clsx(
                          "p-4 rounded-xl border",
                          (ans.score ?? 0) >= 0.7
                            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                            : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
                        )}>
                          <p className={clsx(
                            "text-xs font-bold uppercase tracking-wider mb-1",
                            (ans.score ?? 0) >= 0.7 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          )}>AI Grade: {Math.round((ans.score ?? 0) * 100)}%</p>
                          {ans.theoryFeedback && <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{ans.theoryFeedback}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Explanation (MCQ only) */}
                  {!isTheory && (
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      {ans.explanationStatus === 'READY' && ans.aiExplanation ? (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Sparkles size={80} />
                          </div>
                          <div className="flex items-center gap-2 mb-3 text-primary font-bold relative z-10">
                            <Sparkles size={18} className="animate-pulse" />
                            <span>AI Tutor Explanation</span>
                          </div>
                          <div className="text-sm md:text-base leading-relaxed text-gray-700 dark:text-gray-300 relative z-10">
                            <FormattedMathText text={ans.aiExplanation} />
                          </div>
                        </div>
                      ) : ans.explanationStatus === 'PENDING' || pendingExplanations.has((ans as any)._id) ? (
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                          <Loader2 className="animate-spin text-primary" size={20} />
                          Generating personalized AI explanation...
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <button
                            onClick={() => handleRequestExplanation((ans as any)._id)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                          >
                            <Sparkles size={16} className="text-primary" />
                            {ans.explanationStatus === 'FAILED' ? 'Retry AI Explanation' : 'Ask AI Tutor for Explanation'}
                          </button>
                          {ans.explanationStatus === 'FAILED' && (
                            <span className="text-sm text-red-500 font-medium">Failed to generate. Please try again.</span>
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
              <div className="flex items-center justify-between gap-4 mt-2">
                <button
                  onClick={() => goToPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {questionsSummary.map((item: any, i: number) => {
                    const isTheory2 = item?.type === 'THEORY';
                    const isCorrect2 = item?.correct;
                    const isUnanswered2 = item?.answered === false;
                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(i)}
                        title={`Question ${i + 1} - ${isCorrect2 ? 'Correct' : isUnanswered2 ? 'Unanswered' : 'Incorrect'}`}
                        className={clsx(
                          "transition-all rounded-full",
                          i === currentPage
                            ? "w-6 h-2.5 bg-primary"
                            : isTheory2
                            ? "w-2.5 h-2.5 bg-purple-400 hover:bg-purple-500"
                            : isCorrect2
                            ? "w-2.5 h-2.5 bg-green-400 hover:bg-green-500"
                            : isUnanswered2
                            ? "w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                            : "w-2.5 h-2.5 bg-red-400 hover:bg-red-500"
                        )}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(Math.min(total - 1, currentPage + 1))}
                  disabled={currentPage === total - 1}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 md:bottom-8 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto px-4 md:px-0 z-40">
          <div className="bg-white dark:bg-gray-800 md:border border-gray-200 dark:border-gray-700 md:rounded-full shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-xl p-3 flex items-center justify-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl md:rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              Back to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
