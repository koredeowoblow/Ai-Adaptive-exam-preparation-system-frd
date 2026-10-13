import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useStudentDetailedAnalytics } from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { Skeleton } from '../../shared/components/Skeleton';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
  RotateCcw,
  BarChart2,
  Brain,
  Sparkles,
  GraduationCap,
  Layers,
  Award,
  Zap,
  Check,
  Copy,
} from 'lucide-react';

export const Route = createFileRoute('/admin/users_/$userId')({
  component: AdminStudentAnalyticsPage,
});

// Custom Recharts tooltip with theme awareness
const AnalyticsChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '10px 14px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          fontSize: '0.8125rem',
          minWidth: 140,
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          {label}
        </div>
        {payload.map((p: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{p.name}:</span>
            <span style={{ fontWeight: 700, color: p.color || 'var(--color-primary)' }}>
              {typeof p.value === 'number' ? (p.name.includes('%') || p.name.includes('Score') || p.name.includes('Accuracy') ? `${p.value}%` : p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminStudentAnalyticsPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const { data: analytics, isLoading, error, refetch, isRefetching } = useStudentDetailedAnalytics(userId);

  useDocumentTitle(
    analytics?.student?.name
      ? `${analytics.student.name} — Student In-Depth Analytics — EduAdapt`
      : 'Student In-Depth Analytics — EduAdapt'
  );

  const [activeTab, setActiveTab] = React.useState<'overview' | 'topics' | 'sessions' | 'integrity'>('overview');
  const [copiedId, setCopiedId] = React.useState(false);
  const [topicSearch, setTopicSearch] = React.useState('');

  const copyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
        {/* Top bar skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton style={{ height: 36, width: 180, borderRadius: 'var(--radius-md)' }} />
          <Skeleton style={{ height: 36, width: 120, borderRadius: 'var(--radius-md)' }} />
        </div>
        {/* Profile Card Skeleton */}
        <Skeleton style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
        {/* KPI Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} style={{ height: 110, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        {/* Main Content Skeleton */}
        <Skeleton style={{ height: 380, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <EmptyState
          title="Unable to load student analytics"
          description={error instanceof Error ? error.message : 'The student analytics profile could not be found or loaded.'}
          icon={<ShieldAlert size={40} color="var(--color-danger)" />}
          action={{
            label: 'Back to User Directory',
            onClick: () => navigate({ to: '/admin/users' }),
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RotateCcw size={14} style={{ marginRight: 6 }} /> Try Again
        </Button>
      </div>
    );
  }

  const {
    student,
    summary,
    performanceTrend = [],
    subjectPerformance = [],
    topicMasteryList = [],
    strengths = [],
    topicsToRevisit = [],
    recentSessions = [],
    integritySummary,
    insights = [],
  } = analytics;

  // Formatting calculations
  const elo = (summary as any)?.currentElo ?? 1200;
  const eloLevel = summary?.averageEloLevel || 'Novice';
  const readiness = Math.round(summary?.examReadinessScore ?? 0);
  const readinessLevel = summary?.examReadinessLevel || (readiness >= 75 ? 'Ready' : readiness >= 50 ? 'Marginal' : 'Needs Preparation');
  const avgScore = summary?.averageScore ? Math.round(summary.averageScore) : 0;
  const velocity = (summary as any)?.scoreVelocity ?? 0;
  const totalSessions = summary?.totalSessions ?? performanceTrend.length;
  const totalQuestions = summary?.totalQuestionsAnswered ?? 0;
  const accuracy = Math.round(summary?.overallAccuracy ?? (totalQuestions > 0 ? ((summary?.totalCorrectAnswers ?? 0) / totalQuestions) * 100 : 0));
  const avgTrust = Math.round(integritySummary?.avgTrustScore ?? summary?.averageTrustScore ?? 100);

  // Score Trend Chart data
  const trendChartData = performanceTrend.map((item, idx) => ({
    name: item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Session ${idx + 1}`,
    score: Math.round(item.score),
    passing: 50,
    mastery: 80,
  }));

  // Filtered topics for Topic Mastery tab
  const filteredTopics = topicMasteryList.filter((t) =>
    t.topicName.toLowerCase().includes(topicSearch.toLowerCase()) ||
    t.courseName.toLowerCase().includes(topicSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/admin/users' })}
            style={{
              padding: '0.4rem 0.65rem',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back to User Directory
          </Button>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Student Dossier & Analytics
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} className={isRefetching ? 'animate-spin' : ''} />
            {isRefetching ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>

          <button
            onClick={copyUserId}
            title="Copy Student ID"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {copiedId ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
            ID: {userId.slice(0, 8)}...
          </button>
        </div>
      </div>

      {/* 2. Student Identity Dossier Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar Initials */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                flexShrink: 0,
              }}
            >
              {(student?.name || 'S')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {student?.name || 'Student Name'}
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: student?.isOnboarded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: student?.isOnboarded ? 'var(--color-success)' : 'var(--color-warning)',
                    border: `1px solid ${student?.isOnboarded ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {student?.isOnboarded ? 'Onboarded' : 'Pending Onboarding'}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-background-soft)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {student?.level || '100L'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                <span>{student?.email}</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GraduationCap size={14} color="var(--color-primary)" />
                  {student?.department?.name || 'Department Unassigned'}
                </span>
                {student?.createdAt && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} /> Registered {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background-soft)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Diagnostic Status
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: readiness >= 75 ? 'var(--color-success)' : readiness >= 50 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                {readinessLevel} ({readiness}% Readiness)
              </span>
            </div>
            {readiness >= 75 ? (
              <ShieldCheck size={28} color="var(--color-success)" />
            ) : readiness >= 50 ? (
              <Target size={28} color="var(--color-primary)" />
            ) : (
              <ShieldAlert size={28} color="var(--color-warning)" />
            )}
          </div>
        </div>

        {/* Enrolled Courses Pills */}
        {student?.enrolledCourses && student.enrolledCourses.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Enrolled Curricula:
            </span>
            {student.enrolledCourses.map((c) => (
              <span
                key={c._id}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-background-soft)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <BookOpen size={12} color="var(--color-primary)" />
                {c.code ? `${c.code}: ${c.title}` : c.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Executive KPI Diagnostic Ribbon (6 Comprehensive Metric Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Calibrated ELO Rating */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Calibrated Elo Rating
            </span>
            <Award size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {elo}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--color-primary)',
              }}
            >
              {eloLevel}
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Baseline: 1200 • Adaptive tier
          </span>
        </div>

        {/* KPI 2: Exam Readiness Score */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Exam Readiness Index
            </span>
            <Target size={16} color={readiness >= 75 ? 'var(--color-success)' : 'var(--color-warning)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {readiness}%
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: readiness >= 75 ? 'var(--color-success)' : readiness >= 50 ? 'var(--color-primary)' : 'var(--color-warning)',
              }}
            >
              {readinessLevel}
            </span>
          </div>
          {/* Progress track */}
          <div
            style={{
              width: '100%',
              height: 4,
              backgroundColor: 'var(--color-background-soft)',
              borderRadius: 2,
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${readiness}%`,
                height: '100%',
                backgroundColor: readiness >= 75 ? 'var(--color-success)' : readiness >= 50 ? 'var(--color-primary)' : 'var(--color-warning)',
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* KPI 3: Average Score & Velocity */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Average Score
            </span>
            {velocity >= 0 ? <TrendingUp size={16} color="var(--color-success)" /> : <TrendingDown size={16} color="var(--color-danger)" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {avgScore}%
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: velocity >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {velocity >= 0 ? `+${velocity}%` : `${velocity}%`} vel.
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Across all practice sessions
          </span>
        </div>

        {/* KPI 4: Total Questions & Accuracy */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Total Questions
            </span>
            <Layers size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {totalQuestions}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              ({accuracy}% acc)
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {summary?.totalCorrectAnswers ?? 0} correct solutions
          </span>
        </div>

        {/* KPI 5: Practice Consistency & Streak */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Study Streak
            </span>
            <Flame size={16} color="#f97316" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary?.currentStreak ?? 0} Days
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              (Max {summary?.longestStreak ?? summary?.currentStreak ?? 0}d)
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {totalSessions} total sessions completed
          </span>
        </div>

        {/* KPI 6: Proctoring & Integrity Trust */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Integrity Trust Score
            </span>
            <Shield size={16} color={avgTrust >= 85 ? 'var(--color-success)' : 'var(--color-warning)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {avgTrust}/100
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: avgTrust >= 85 ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {integritySummary?.riskLevel || (avgTrust >= 85 ? 'LOW' : 'MEDIUM')} RISK
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {integritySummary?.totalLogs ?? 0} proctoring audits
          </span>
        </div>
      </div>

      {/* 4. Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          gap: '0.5rem',
          backgroundColor: 'var(--color-surface)',
          padding: '0.25rem 0.5rem 0 0.5rem',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BarChart2 size={15} /> Performance & Learning Velocity
        </button>

        <button
          onClick={() => setActiveTab('topics')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'topics' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'topics' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Brain size={15} /> Topic Mastery Calibration ({topicMasteryList.length})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'sessions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'sessions' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Clock size={15} /> Sessions Audit Log ({recentSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('integrity')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'integrity' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'integrity' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Shield size={15} /> Proctoring & Integrity ({integritySummary?.recentEvents?.length ?? 0})
        </button>
      </div>

      {/* 5. Tab Content Panes */}

      {/* TAB 1: OVERVIEW & LEARNING VELOCITY */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Pedagogical Diagnostics Card */}
          {insights.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Automated Pedagogical Diagnosis & AI Recommendations
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Score Velocity Area Chart */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>
                  Performance Trajectory & Score History
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Sequential session scores with 50% passing threshold and 80% mastery benchmark
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                  Session Score (%)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                  <span style={{ width: 12, height: 2, backgroundColor: '#10b981' }} /> Mastery (80%)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                  <span style={{ width: 12, height: 2, backgroundColor: '#f59e0b' }} /> Passing (50%)
                </span>
              </div>
            </div>

            {trendChartData.length > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                    <RechartsTooltip content={<AnalyticsChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreAreaGradient)"
                      activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No completed sessions logged for this student yet.
              </div>
            )}
          </div>

          {/* Course-level competency comparison */}
          {subjectPerformance.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>
                  Curriculum Competency Comparison
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Average proficiency across enrolled university courses
                </p>
              </div>

              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectPerformance.map((sp: any) => ({
                      course: sp.code || sp.courseTitle,
                      Score: Math.round(sp.avg ?? sp.averageScore ?? 0),
                      Questions: sp.questionsAttempted ?? 0,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                    <XAxis dataKey="course" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                    <RechartsTooltip content={<AnalyticsChartTooltip />} />
                    <Bar dataKey="Score" name="Avg Score (%)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TOPIC MASTERY CALIBRATION */}
      {activeTab === 'topics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Strengths & Weaknesses Split Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Mastered Strengths */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={18} color="var(--color-success)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Calibrated Strengths ({strengths.length})
                </h3>
              </div>

              {strengths.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  No topic strengths established yet. Requires further practice data.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {strengths.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-background-soft)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {s.topicName}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          Elo Rating: {Math.round(s.elo)} • Level: {s.level || 'Master'}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-success)',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {s.accuracy ? `${Math.round(s.accuracy)}%` : 'Strong'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* At-Risk Remediation Topics */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={18} color="var(--color-warning)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Topics Requiring Remediation ({topicsToRevisit.length})
                </h3>
              </div>

              {topicsToRevisit.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  No vulnerable topics identified. Student is currently on target.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {topicsToRevisit.map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-background-soft)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {w.topicName}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          Score: {Math.round((w as any).score ?? (w as any).accuracy ?? 0)}%
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: 'var(--color-warning)',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {w.recommendedAction || 'Remediate'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full Topic Mastery Calibration Table */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>
                  Comprehensive Topic Mastery Matrix
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Item Response Theory (IRT) and Elo ratings per curriculum topic
                </p>
              </div>

              <input
                type="text"
                placeholder="Filter topics or courses..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background-soft)',
                  color: 'var(--color-text)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  minWidth: 200,
                }}
              />
            </div>

            {filteredTopics.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No topics matching filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Topic Name</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Course</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Calibrated Elo</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Mastery Progress</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Attempted</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Accuracy</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.map((topic, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {topic.topicName}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                          {topic.courseName}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              color: 'var(--color-primary)',
                            }}
                          >
                            {Math.round(topic.eloRating)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                backgroundColor: 'var(--color-border)',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.round(topic.masteryScore))}%`,
                                  height: '100%',
                                  backgroundColor: topic.masteryScore >= 75 ? 'var(--color-success)' : topic.masteryScore >= 45 ? 'var(--color-primary)' : 'var(--color-warning)',
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
                              {Math.round(topic.masteryScore)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                          {topic.questionsAttempted} ({topic.questionsCorrect} correct)
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: topic.accuracy >= 75 ? 'var(--color-success)' : topic.accuracy >= 50 ? 'var(--color-primary)' : 'var(--color-danger)',
                            }}
                          >
                            {Math.round(topic.accuracy)}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {topic.lastAttemptedAt ? new Date(topic.lastAttemptedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SESSIONS AUDIT TRAIL */}
      {activeTab === 'sessions' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>
              Practice & Exam Sessions Audit Trail
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Complete log of all sessions, scores, proctoring trust scores, and completion status
            </p>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No practice or exam sessions recorded for this student yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Date & Time</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Course</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Accuracy</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Trust Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text)' }}>
                        {s.startedAt ? new Date(s.startedAt).toLocaleString() : 'Recent'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {s.courseCode ? `${s.courseCode} — ${s.courseTitle}` : s.courseTitle}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: s.score >= 70 ? 'var(--color-success)' : s.score >= 50 ? 'var(--color-primary)' : 'var(--color-danger)',
                          }}
                        >
                          {Math.round(s.score)}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {s.correctAnswers}/{s.questionsAnswered}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                        {s.durationMinutes ? `${s.durationMinutes} mins` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: (s.trustScore ?? 100) >= 85 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: (s.trustScore ?? 100) >= 85 ? 'var(--color-success)' : 'var(--color-danger)',
                            border: `1px solid ${(s.trustScore ?? 100) >= 85 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {s.trustScore ?? 100}/100
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-background-soft)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROCTORING & INTEGRITY */}
      {activeTab === 'integrity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trust Summary Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: avgTrust >= 85 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: avgTrust >= 85 ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                <Shield size={28} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Assessment Trust Index: {avgTrust} / 100
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.125rem 0 0 0' }}>
                  Anti-cheat event history, tab-switch frequency, and behavioral anomaly detection
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: integritySummary?.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: integritySummary?.riskLevel === 'HIGH' ? 'var(--color-danger)' : 'var(--color-success)',
                  border: `1px solid ${integritySummary?.riskLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  letterSpacing: '0.04em',
                }}
              >
                {integritySummary?.riskLevel || 'LOW'} RISK CLASSIFICATION
              </span>
            </div>
          </div>

          {/* Event Log Table */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>
                Proctoring & Audit Telemetry Events
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Logged security anomalies during proctored exams
              </p>
            </div>

            {(!integritySummary?.recentEvents || integritySummary.recentEvents.length === 0) ? (
              <div
                style={{
                  padding: '2.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-background-soft)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                }}
              >
                <CheckCircle2 size={32} color="var(--color-success)" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  Clean Proctoring Record
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  No suspicious tab switches, focus losses, or multi-device violations detected for this student.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Event Type</th>
                      <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integritySummary.recentEvents.map((evt, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text)' }}>
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {evt.eventType}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: evt.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: evt.severity === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)',
                            }}
                          >
                            {evt.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
