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
import { useTopbar } from '../../shared/context/TopbarContext';
import { 
  Trophy, 
  Target, 
  ChevronRight, 
  Play, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Clock,
  BookOpen
} from 'lucide-react';
import type { PracticeSession } from '../../types/practice.types';

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
    title: 'Session History',
    breadcrumbs: [
      { label: 'Dashboard', to: '/dashboard' },
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
      <PageContainer className="py-6 sm:py-8 pb-32 sm:pb-20">
        
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Trophy size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Session History
            </h1>
          </div>
          <p className="text-sm text-text-secondary pl-12 max-w-xl">
            Track past mock exams, quick practice runs, and analyze learning pacing over time.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-6">
            {/* Stat Strip Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-36" />
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
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
          <div className="space-y-6 sm:space-y-8">
            
            {/* Stat Strip with Honest States */}
            <section aria-label="Session summary metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Metric 1: Average Score */}
              <div className="card p-5 flex flex-col justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Average Score
                </span>
                <div className="flex items-baseline gap-2 my-2">
                  {avgScore !== null ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                        {avgScore}%
                      </span>
                      {scoreTrend === 'up' && (
                        <span className="inline-flex items-center text-xs font-semibold text-success gap-0.5">
                          <TrendingUp size={13} />
                          <span>Improving</span>
                        </span>
                      )}
                      {scoreTrend === 'down' && (
                        <span className="inline-flex items-center text-xs font-semibold text-danger gap-0.5">
                          <TrendingDown size={13} />
                          <span>Declining</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-base font-semibold text-text-muted">
                      No scores yet
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-secondary">
                  {completedSessions.length > 0
                    ? `Based on ${completedSessions.length} completed session${completedSessions.length === 1 ? '' : 's'}`
                    : 'Complete a session to evaluate score'}
                </span>
              </div>

              {/* Metric 2: Questions Answered */}
              <div className="card p-5 flex flex-col justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Questions Answered
                </span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                    {totalAnswered}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  Across all attempted questions
                </span>
              </div>

              {/* Metric 3: Total Sessions */}
              <div className="card p-5 flex flex-col justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Sessions
                </span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                    {totalSessions}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  {inProgressSessions.length > 0 
                    ? `${inProgressSessions.length} in progress, ${completedSessions.length} completed`
                    : `${completedSessions.length} completed sessions`}
                </span>
              </div>
            </section>

            {/* Filter Pills & Session Groups */}
            <div className="card p-4 sm:p-6 space-y-6">
              
              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <h2 className="text-base font-bold text-text-primary">
                  All Activity
                </h2>

                <div 
                  role="radiogroup" 
                  aria-label="Filter sessions by mode"
                  className="inline-flex p-1 rounded-lg bg-surface-1 border border-border"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={modeFilter === 'all'}
                    onClick={() => setModeFilter('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      modeFilter === 'all'
                        ? 'bg-surface-0 text-text-primary shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    All ({sessions.length})
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={modeFilter === 'quick'}
                    onClick={() => setModeFilter('quick')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      modeFilter === 'quick'
                        ? 'bg-surface-0 text-text-primary shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Quick Practice
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={modeFilter === 'mock'}
                    onClick={() => setModeFilter('mock')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      modeFilter === 'mock'
                        ? 'bg-surface-0 text-text-primary shadow-xs'
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
                        className="text-xs font-bold text-text-muted uppercase tracking-wider px-1"
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
                          const answeredQ = session.questionsAnswered || (isCompleted ? totalQ : 0);
                          const progressPercent = Math.min(100, Math.round((answeredQ / totalQ) * 100));

                          return (
                            <div
                              key={session._id}
                              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-surface-0 hover:border-border-hover transition-colors gap-3 sm:gap-4"
                            >
                              {/* Left: Icon & Details */}
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  isMock
                                    ? 'bg-warning-light text-warning'
                                    : 'bg-primary-light text-primary'
                                }`}>
                                  {isMock ? <Trophy size={18} /> : <Target size={18} />}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-text-primary truncate">
                                      {courseCode ? `${courseCode}: ` : ''}{courseTitle}
                                    </span>
                                    <Badge variant={isMock ? 'warning' : 'neutral'} size="sm">
                                      {isMock ? 'Mock Exam' : 'Quick Practice'}
                                    </Badge>
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

                                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={12} className="text-text-muted" />
                                      {formatDate(session.startedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Middle: Progress Bar */}
                              <div className="w-full sm:w-44 shrink-0 flex flex-col justify-center">
                                <div className="flex items-center justify-between text-xs text-text-secondary mb-1 tabular-nums font-medium">
                                  <span>{answeredQ} of {totalQ} answered</span>
                                  {isCompleted && session.score !== undefined && (
                                    <span className="font-bold text-text-primary">{session.score}%</span>
                                  )}
                                </div>
                                <ProgressBar
                                  progress={progressPercent}
                                  variant={isCompleted ? 'success' : 'primary'}
                                  size="sm"
                                />
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                {isInProgress && (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleResume(session)}
                                      className="min-h-[36px]"
                                    >
                                      <Play size={14} className="mr-1.5" />
                                      Resume
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDiscardSession(session)}
                                      className="text-text-muted hover:text-danger min-h-[36px]"
                                      aria-label={`Discard in-progress session for ${courseCode || courseTitle}`}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </>
                                )}

                                {isCompleted && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(session._id)}
                                    className="min-h-[36px]"
                                  >
                                    Review
                                    <ChevronRight size={14} className="ml-1" />
                                  </Button>
                                )}

                                {isFailed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(session._id)}
                                    className="min-h-[36px]"
                                  >
                                    View Log
                                    <ChevronRight size={14} className="ml-1" />
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
