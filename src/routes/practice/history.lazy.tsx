import * as React from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useSessions } from '../../features/practice-session/hooks/usePractice';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { AppLayout } from '../../shared/components/layout/AppLayout';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import { Skeleton } from '../../shared/components/Skeleton';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { PageHeader } from '../../shared/components/PageHeader';
import { useTopbar } from '../../shared/context/TopbarContext';
import { 
  ChevronRight, 
  Play, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BookOpen,
  RotateCcw
} from 'lucide-react';
import type { PracticeSession } from '../../types/practice.types';
import { practiceApi } from '../../features/practice-session/api/practice.api';

export const Route = createLazyFileRoute('/practice/history')({
  component: HistoryRoute,
});

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function groupSessionsByDate(sessions: PracticeSession[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneWeekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const today: PracticeSession[] = [];
  const thisWeek: PracticeSession[] = [];
  const earlier: PracticeSession[] = [];

  for (const session of sessions) {
    const sessionTime = new Date(session.startedAt).getTime();
    if (sessionTime >= startOfToday) {
      today.push(session);
    } else if (sessionTime >= oneWeekAgo) {
      thisWeek.push(session);
    } else {
      earlier.push(session);
    }
  }

  const groups: { label: string; items: PracticeSession[] }[] = [];
  if (today.length > 0) groups.push({ label: 'Today', items: today });
  if (thisWeek.length > 0) groups.push({ label: 'This week', items: thisWeek });
  if (earlier.length > 0) groups.push({ label: 'Earlier', items: earlier });

  return groups;
}

function HistoryRoute() {
  useDocumentTitle('Session History - EduAdapt');
  const navigate = useNavigate();

  useTopbar({
    title: 'History',
    breadcrumbs: [
      { label: 'Practice', to: '/exam-prep' },
      { label: 'History' },
    ],
  });

  const { data: responseData, isLoading, error, refetch } = useSessions({ limit: 50 });
  const [modeFilter, setModeFilter] = React.useState<'all' | 'quick' | 'mock'>('all');
  
  // Guard against duplicate session creation or double navigation
  const isStartingRef = React.useRef(false);

  // Discard dialog state
  const [discardSession, setDiscardSession] = React.useState<PracticeSession | null>(null);
  const [discardedIds, setDiscardedIds] = React.useState<Set<string>>(new Set());

  // Retry grading state
  const [retryingSessionId, setRetryingSessionId] = React.useState<string | null>(null);

  const handleRetryGrading = async (sessionId: string) => {
    try {
      setRetryingSessionId(sessionId);
      await practiceApi.retrySession(sessionId);
      await refetch();
    } catch (err: any) {
      console.error('Failed to retry grading:', err);
    } finally {
      setRetryingSessionId(null);
    }
  };

  const rawSessions: PracticeSession[] = responseData?.sessions || [];
  const sessions = React.useMemo(() => {
    return rawSessions.filter((s: PracticeSession) => !discardedIds.has(s._id));
  }, [rawSessions, discardedIds]);

  const completedSessions = React.useMemo(() => {
    return sessions.filter((s: PracticeSession) => s.status === 'completed');
  }, [sessions]);

  const inProgressSessions = React.useMemo(() => {
    return sessions.filter((s: PracticeSession) => s.status === 'active');
  }, [sessions]);

  const totalSessions = sessions.length;
  const totalAnswered = React.useMemo(() => {
    return sessions.reduce((acc: number, s: PracticeSession) => acc + (s.questionsAnswered || 0), 0);
  }, [sessions]);

  // Honest score calculation
  const avgScore = React.useMemo(() => {
    if (completedSessions.length === 0) return null;
    const total = completedSessions.reduce((acc: number, s: PracticeSession) => acc + (s.score || 0), 0);
    return Math.round(total / completedSessions.length);
  }, [completedSessions]);

  // Honest trend calculation: requires at least 4 completed sessions to establish an older vs newer trend
  const scoreTrend = React.useMemo<'up' | 'down' | 'neutral' | null>(() => {
    if (completedSessions.length < 4) return null;
    const mid = Math.floor(completedSessions.length / 2);
    const recent = completedSessions.slice(0, mid);
    const older = completedSessions.slice(mid);
    
    const recentAvg = recent.reduce((a, s) => a + (s.score || 0), 0) / recent.length;
    const olderAvg = older.reduce((a, s) => a + (s.score || 0), 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff >= 3) return 'up';
    if (diff <= -3) return 'down';
    return 'neutral';
  }, [completedSessions]);

  const filteredSessions = React.useMemo(() => {
    if (modeFilter === 'quick') {
      return sessions.filter((s: PracticeSession) => s.mode === 'quick' || s.mode === 'adaptive' || ((s.totalQuestions || 0) < 40 && s.mode !== 'mock'));
    }
    if (modeFilter === 'mock') {
      return sessions.filter((s: PracticeSession) => s.mode === 'mock' || s.mode === 'exam' || s.mode === 'mock_exam' || (s.totalQuestions || 0) >= 40);
    }
    return sessions;
  }, [sessions, modeFilter]);

  const groupedSessions = React.useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  const handleResume = React.useCallback((session: PracticeSession) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    const isMock = session.mode === 'mock' || session.mode === 'exam' || session.mode === 'mock_exam';
    const targetRoute = isMock ? `/exam/${session._id}` : `/practice/${session._id}`;
    navigate({ to: targetRoute });
  }, [navigate]);

  const handleReview = React.useCallback((sessionId: string) => {
    navigate({ to: '/practice/$sessionId/review', params: { sessionId } });
  }, [navigate]);

  const handleConfirmDiscard = React.useCallback(() => {
    if (!discardSession) return;
    try {
      localStorage.removeItem(`exam_answers_${discardSession._id}`);
      sessionStorage.removeItem(`exam_started_${discardSession._id}`);
    } catch {
      // Ignore local storage error
    }
    setDiscardedIds(prev => new Set(prev).add(discardSession._id));
    setDiscardSession(null);
  }, [discardSession]);

  return (
    <AppLayout>
      <PageContainer className="py-5 sm:py-6 pb-32 sm:pb-20">
        
        {/* Page Header */}
        <PageHeader
          title="History"
          description="Track past mock exams, quick practice runs, and analyze learning pacing over time."
          className="mb-4 sm:mb-6"
        />

        {isLoading ? (
          <div className="space-y-4">
            {/* Stat Strip Skeleton */}
            <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ))}
            </div>

            {/* Rows Skeleton */}
            <div className="card p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-center pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card p-8 text-center max-w-lg mx-auto">
            <ErrorState
              message={(error as any)?.response?.data?.message || 'Failed to load session history. Please check your connection.'}
              onRetry={() => refetch()}
            />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <EmptyState
              icon={<BookOpen size={24} />}
              title="No Practice Sessions Yet"
              description="Start a quick practice session or a proctored mock exam to begin tracking your mastery and performance history."
              actionLabel="Start Practicing"
              onAction={() => navigate({ to: '/exam-prep' })}
            />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            
            {/* Compact Stat Strip */}
            <section aria-label="Session summary metrics" className="card p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border gap-3 sm:gap-0">
              
              {/* Metric 1: Average Score */}
              <div className="sm:px-4 first:sm:pl-0 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
                <span className="text-xs font-semibold text-text-muted tracking-[-0.005em]">
                  Average score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  {avgScore !== null ? (
                    <>
                      <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                        {avgScore}%
                      </span>
                      {scoreTrend === 'up' && (
                        <span className="inline-flex items-center text-xs font-semibold text-success gap-0.5">
                          <TrendingUp size={12} />
                          <span>Improving</span>
                        </span>
                      )}
                      {scoreTrend === 'down' && (
                        <span className="inline-flex items-center text-xs font-semibold text-danger gap-0.5">
                          <TrendingDown size={12} />
                          <span>Declining</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-text-muted">No scores yet</span>
                  )}
                </div>
              </div>

              {/* Metric 2: Questions Answered */}
              <div className="pt-2 sm:pt-0 sm:px-4 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
                <span className="text-xs font-semibold text-text-muted tracking-[-0.005em]">
                  Questions answered
                </span>
                <div className="mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                    {totalAnswered}
                  </span>
                </div>
              </div>

              {/* Metric 3: Total Sessions */}
              <div className="pt-2 sm:pt-0 sm:px-4 last:sm:pr-0 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
                <span className="text-xs font-semibold text-text-muted tracking-[-0.005em]">
                  Total sessions
                </span>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
                    {totalSessions}
                  </span>
                  <span className="text-xs text-text-secondary">
                    ({completedSessions.length} completed, {inProgressSessions.length} active)
                  </span>
                </div>
              </div>
            </section>

            {/* Filter Pills & Session Groups */}
            <div className="card p-4 sm:p-6 space-y-6">
              
              {/* Filter Row */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
                <div 
                  role="tablist" 
                  aria-label="Filter sessions by mode"
                  className="inline-flex p-1 rounded-lg bg-surface-1 border border-border"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={modeFilter === 'all'}
                    tabIndex={0}
                    onClick={() => setModeFilter('all')}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setModeFilter('quick');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                      modeFilter === 'all'
                        ? 'bg-surface-0 text-text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    All ({sessions.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={modeFilter === 'quick'}
                    tabIndex={0}
                    onClick={() => setModeFilter('quick')}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setModeFilter('mock');
                      if (e.key === 'ArrowLeft') setModeFilter('all');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                      modeFilter === 'quick'
                        ? 'bg-surface-0 text-text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Quick Practice
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={modeFilter === 'mock'}
                    tabIndex={0}
                    onClick={() => setModeFilter('mock')}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') setModeFilter('quick');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                      modeFilter === 'mock'
                        ? 'bg-surface-0 text-text-primary shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Mock Exams
                  </button>
                </div>
              </div>

              {/* Grouped Lists (Skip Empty Groups) */}
              {groupedSessions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-text-secondary">
                    No sessions match the selected filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedSessions.map((group) => (
                    <section key={group.label} aria-labelledby={`heading-${group.label.replace(/\s+/g, '-')}`} className="space-y-3">
                      <h3
                        id={`heading-${group.label.replace(/\s+/g, '-')}`}
                        className="text-xs font-bold text-text-muted tracking-[-0.005em] px-1"
                      >
                        {group.label}
                      </h3>

                      <div className="space-y-2.5">
                        {group.items.map((session) => {
                          const isMock = session.mode === 'mock' || session.mode === 'exam' || session.mode === 'mock_exam' || (session.totalQuestions || 0) >= 40;
                          const isCompleted = session.status === 'completed';
                          const isFailed = session.status === 'FAILED';
                          const isInProgress = session.status === 'active';

                          const courseObj = typeof session.courseId === 'object' ? session.courseId : null;
                          const courseCode = courseObj?.code || session.courseCode || '';
                          const courseTitle = courseObj?.title || courseObj?.name || (courseCode ? 'Course Assessment' : 'General Practice');

                          const totalQ = session.totalQuestions || 1;
                          const answeredQ = session.questionsAnswered > 0
                            ? session.questionsAnswered
                            : (session.questionsServed?.filter((q: any) => q.selectedAnswer !== undefined || q.writtenAnswer !== undefined).length || 0);
                          const progressPercent = Math.min(100, Math.round((answeredQ / totalQ) * 100));

                          return (
                            <div
                              key={session._id}
                              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-surface-0 hover:border-border-hover transition-colors gap-3 sm:gap-4"
                            >
                              {/* Left: Title First, Mode as Plain Muted Text, Status as ONLY Badge */}
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-text-primary tracking-[-0.005em] truncate">
                                    {courseCode ? `${courseCode}: ` : ''}{courseTitle}
                                  </span>
                                  {isCompleted && (
                                    <Badge variant="success" size="sm">
                                      Completed
                                    </Badge>
                                  )}
                                  {isInProgress && (
                                    <Badge variant="warning" size="sm">
                                      In Progress
                                    </Badge>
                                  )}
                                  {isFailed && (
                                    <Badge variant="danger" size="sm">
                                      Failed
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-text-secondary mt-1 flex-wrap">
                                  <span className="font-medium text-text-muted">
                                    {isMock ? 'Mock Exam' : 'Quick Practice'}
                                  </span>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 text-text-muted">
                                    <Clock size={12} />
                                    {formatDate(session.startedAt)}
                                  </span>
                                </div>
                              </div>

                              {/* Middle: Progress Bar appears ONLY for in-progress sessions (no 0% next to 0 of 10) */}
                              {isInProgress && (
                                <div className="w-full sm:w-44 shrink-0 flex flex-col justify-center">
                                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1 tabular-nums font-medium">
                                    <span>{answeredQ} of {totalQ} answered</span>
                                  </div>
                                  <ProgressBar
                                    progress={progressPercent}
                                    variant="primary"
                                    size="sm"
                                  />
                                </div>
                              )}

                              {/* Completed Session: Score shown as its own number */}
                              {isCompleted && (
                                <div className="flex flex-col items-start sm:items-end justify-center shrink-0">
                                  <span className="text-base sm:text-lg font-bold text-text-primary tabular-nums">
                                    {session.score !== undefined ? `${session.score}%` : '0%'}
                                  </span>
                                  <span className="text-xs text-text-muted tabular-nums">
                                    {answeredQ} of {totalQ} answered
                                  </span>
                                </div>
                              )}

                              {/* Failed Session: Outcome */}
                              {isFailed && (
                                <div className="flex flex-col items-start sm:items-end justify-center shrink-0">
                                  <span className="text-xs font-semibold text-danger">
                                    Grading failed, your answers are saved
                                  </span>
                                  <span className="text-xs text-text-muted tabular-nums">
                                    {answeredQ} of {totalQ} answered
                                  </span>
                                </div>
                              )}

                              {/* Right: Actions */}
                              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                {isInProgress && (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleResume(session)}
                                    >
                                      <Play size={13} className="mr-1.5" />
                                      Resume
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDiscardSession(session)}
                                      className="text-text-muted hover:text-danger text-xs font-medium"
                                      aria-label={`Discard in-progress session for ${courseCode || courseTitle}`}
                                    >
                                      <Trash2 size={13} className="mr-1" />
                                      Discard
                                    </Button>
                                  </>
                                )}

                                {isCompleted && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(session._id)}
                                  >
                                    Review
                                    <ChevronRight size={14} className="ml-1" />
                                  </Button>
                                )}

                                {isFailed && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleRetryGrading(session._id)}
                                    disabled={retryingSessionId === session._id}
                                    className="gap-1 text-xs"
                                  >
                                    <RotateCcw size={13} className={retryingSessionId === session._id ? 'animate-spin' : ''} />
                                    {retryingSessionId === session._id ? 'Requeuing...' : 'Retry'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discard In-Progress Session Dialog */}
        <ConfirmDialog
          isOpen={!!discardSession}
          title="Discard In-Progress Session?"
          message="Discarding this in-progress session will abandon your current answers, elapsed timer, and question progress. This action cannot be undone."
          confirmText="Discard Session"
          cancelText="Keep Session"
          onConfirm={handleConfirmDiscard}
          onCancel={() => setDiscardSession(null)}
        />
      </PageContainer>
    </AppLayout>
  );
}
