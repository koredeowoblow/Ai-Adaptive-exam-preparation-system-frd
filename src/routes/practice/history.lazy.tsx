import * as React from "react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useSessions } from "../../features/practice-session/hooks/usePractice";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { AppLayout } from "../../shared/components/layout/AppLayout";
import { Skeleton } from "../../shared/components/Skeleton";
import { ErrorState } from "../../shared/components/ErrorState";
import { EmptyState } from "../../shared/components/EmptyState";
import { Badge } from "../../shared/components/Badge";
import { useTopbar } from "../../shared/context/TopbarContext";
import { 
  Trophy, 
  Clock, 
  Target, 
  Calendar, 
  ChevronRight, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp,
  Filter
} from "lucide-react";
import type { PracticeSession } from "../../types/practice.types";

export const Route = createLazyFileRoute("/practice/history")({
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

function HistoryRoute() {
  useDocumentTitle("Session History - EduAdapt");
  useTopbar({
    title: "Session History",
    breadcrumbs: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Practice", to: "/exam-prep" },
      { label: "History" },
    ],
  });

  const { data: responseData, isLoading, error, refetch } = useSessions({ limit: 50 });
  const [modeFilter, setModeFilter] = React.useState<"all" | "quick" | "mock">("all");

  const sessions = responseData?.sessions || [];
  const completedSessions = sessions.filter((s: PracticeSession) => s.status === 'completed');
  
  const totalSessions = sessions.length;
  const avgScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc: number, s: PracticeSession) => acc + (s.score || 0), 0) / completedSessions.length) 
    : 0;
  const totalAnswered = sessions.reduce((acc: number, s: PracticeSession) => acc + (s.questionsAnswered || 0), 0);

  const filteredSessions = React.useMemo(() => {
    if (modeFilter === "quick") {
      return sessions.filter((s: PracticeSession) => s.mode === "adaptive" || (s.totalQuestions || 0) < 40);
    }
    if (modeFilter === "mock") {
      return sessions.filter((s: PracticeSession) => s.mode === "mock_exam" || (s.totalQuestions || 0) >= 40);
    }
    return sessions;
  }, [sessions, modeFilter]);

  return (
    <AppLayout>
      <div className="page-container" style={{ paddingBottom: 'calc(var(--space-48) + var(--bottom-nav-height, 0px))' }}>
        
        {/* Page Header */}
        <header style={{ marginBottom: 'var(--space-24)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', marginBottom: 'var(--space-4)' }}>
            <div 
              style={{ 
                width: 36, 
                height: 36, 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--color-primary-light, rgba(14, 107, 168, 0.1))', 
                color: 'var(--color-primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Session History
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem', paddingLeft: 48 }}>
            Review past practice sessions, mock exams, and evaluate performance trends over time.
          </p>
        </header>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-16)' }}>
              {[1, 2, 3].map(i => (
                <div key={`stat-${i}`} className="card" style={{ padding: 'var(--space-20)' }}>
                  <Skeleton style={{ height: 16, width: 80, marginBottom: 12 }} />
                  <Skeleton style={{ height: 32, width: 120 }} />
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 'var(--space-24)' }}>
              <Skeleton style={{ height: 24, width: 160, marginBottom: 16 }} />
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={`row-${i}`} style={{ height: 60, width: '100%', marginBottom: 12, borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: 'var(--space-32)', textAlign: 'center' }}>
            <ErrorState message="Failed to load session history. Please verify your connection." onRetry={() => refetch()} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-48) var(--space-24)', textAlign: 'center' }}>
            <EmptyState
              title="No Practice Sessions Yet"
              description="Complete a quick practice quiz or a full mock exam to start building your mastery history."
              actionLabel="Start Practicing"
              onAction={() => window.location.href = '/practice'}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            
            {/* Bento Metric Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-16)' }}>
              
              {/* Stat 1: Avg Score */}
              <div className="card" style={{ padding: 'var(--space-20)', display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                <div 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--color-primary-light, rgba(14, 107, 168, 0.1))', 
                    color: 'var(--color-primary)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Target size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Average Score
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                    {avgScore}%
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success, #10b981)' }}>
                    <TrendingUp size={12} />
                    <span>{completedSessions.length} completed</span>
                  </div>
                </div>
              </div>

              {/* Stat 2: Total Sessions */}
              <div className="card" style={{ padding: 'var(--space-20)', display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                <div 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    color: '#8b5cf6',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Clock size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Sessions
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                    {totalSessions}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                    Across all enrolled courses
                  </span>
                </div>
              </div>

              {/* Stat 3: Total Questions Answered */}
              <div className="card" style={{ padding: 'var(--space-20)', display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                <div 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    color: '#f59e0b',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Questions Answered
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                    {totalAnswered}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                    MCQ and written responses
                  </span>
                </div>
              </div>

            </div>

            {/* Activity Table Card */}
            <section className="card" style={{ padding: 'var(--space-24)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-16)', marginBottom: 'var(--space-20)' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                  <Calendar size={18} color="var(--color-primary)" />
                  Recent Sessions ({filteredSessions.length})
                </h2>

                {/* Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Filter size={12} /> Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setModeFilter("all")}
                    className={`btn btn-sm ${modeFilter === "all" ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', height: 28 }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeFilter("quick")}
                    className={`btn btn-sm ${modeFilter === "quick" ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', height: 28 }}
                  >
                    Quick Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeFilter("mock")}
                    className={`btn btn-sm ${modeFilter === "mock" ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', height: 28 }}
                  >
                    Full Mock
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
                {filteredSessions.map((session: PracticeSession) => {
                  const isMock = session.mode === "mock_exam" || (session.totalQuestions || 0) >= 40;
                  const isCompleted = session.status === 'completed';
                  const isFailed = session.status === 'FAILED';
                  const courseTitle = typeof session.courseId === 'object' && session.courseId 
                    ? (session.courseId as any).title 
                    : (session.courseCode || "General Practice");
                  const courseCode = typeof session.courseId === 'object' && session.courseId 
                    ? (session.courseId as any).code 
                    : (session.courseCode || "");
                  
                  return (
                    <Link 
                      key={session._id} 
                      to="/practice/$sessionId/review" 
                      params={{ sessionId: session._id }}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-16)',
                          padding: 'var(--space-14) var(--space-16)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        
                        {/* Icon */}
                        <div 
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: isFailed ? 'rgba(239, 68, 68, 0.1)' : isMock ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-primary-light, rgba(14, 107, 168, 0.1))',
                            color: isFailed ? 'var(--color-danger)' : isMock ? '#f59e0b' : 'var(--color-primary)',
                          }}
                        >
                          {isMock ? <Trophy size={18} /> : <Target size={18} />}
                        </div>

                        {/* Title, Course & Date */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {courseCode ? `${courseCode}: ` : ''}{courseTitle}
                            </span>
                            <Badge variant={isMock ? "warning" : "neutral"}>
                              {isMock ? "Mock Exam" : "Quick Practice"}
                            </Badge>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'block' }}>
                            {formatDate(session.startedAt)}
                          </span>
                        </div>

                        {/* Question metrics */}
                        <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-12)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }} className="sm-flex">
                          <span>{session.questionsAnswered || 0}/{session.totalQuestions || 0} Questions</span>
                          {session.trustScore !== undefined && session.trustScore < 80 && (
                            <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <ShieldAlert size={14} /> Integrity Warning
                            </span>
                          )}
                          {!isCompleted && !isFailed && (
                            <Badge variant="primary">In Progress</Badge>
                          )}
                          {isFailed && (
                            <Badge variant="danger">Cancelled</Badge>
                          )}
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                          <div 
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: 800,
                              lineHeight: 1,
                              color: isCompleted ? (session.score >= 70 ? 'var(--color-success, #10b981)' : session.score >= 50 ? 'var(--color-primary)' : 'var(--color-warning)') : 'var(--color-text-muted)'
                            }}
                          >
                            {isCompleted ? `${Math.round(session.score)}%` : '-'}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'block' }}>
                            {isCompleted ? 'Final' : session.status}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div 
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--color-surface-hover, rgba(0, 0, 0, 0.04))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                            flexShrink: 0
                          }}
                        >
                          <ChevronRight size={16} />
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

