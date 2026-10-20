import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useCourseDetailedAnalytics } from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { Skeleton } from '../../shared/components/Skeleton';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import {
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
  TrendingUp,
  Target,
  ShieldAlert,
  ShieldCheck,
  Clock,
  RotateCcw,
  BarChart2,
  Brain,
  Sparkles,
  GraduationCap,
  Layers,
  Award,
  Check,
  Copy,
  Users,
  ChevronRight,
} from 'lucide-react';

export const Route = createFileRoute('/admin/courses_/$courseId')({
  component: AdminCourseAnalyticsPage,
});

// Recharts tooltip with theme awareness
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
              {typeof p.value === 'number' ? (p.name.includes('%') || p.name.includes('Rate') || p.name.includes('Score') ? `${p.value}%` : p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminCourseAnalyticsPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();

  const { data: analytics, isLoading, error, refetch, isRefetching } = useCourseDetailedAnalytics(courseId);

  useDocumentTitle(
    analytics?.course?.code
      ? `${analytics.course.code}: ${analytics.course.title} - Course Analytics - EduAdapt`
      : 'Course In-Depth Analytics - EduAdapt'
  );

  const [activeTab, setActiveTab] = React.useState<'levels' | 'topics' | 'students' | 'sessions'>('levels');
  const [copiedId, setCopiedId] = React.useState(false);
  const [topicFilter, setTopicFilter] = React.useState('');

  const copyCourseId = () => {
    if (!courseId) return;
    navigator.clipboard.writeText(courseId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton style={{ height: 36, width: 180, borderRadius: 'var(--radius-md)' }} />
          <Skeleton style={{ height: 36, width: 120, borderRadius: 'var(--radius-md)' }} />
        </div>
        <Skeleton style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} style={{ height: 110, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <Skeleton style={{ height: 380, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <EmptyState
          title="Unable to load course analytics"
          description={error instanceof Error ? error.message : 'The course analytics dossier could not be found or loaded.'}
          icon={<ShieldAlert size={40} color="var(--color-danger)" />}
          action={{
            label: 'Back to Courses Directory',
            onClick: () => navigate({ to: '/admin/courses' }),
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RotateCcw size={14} style={{ marginRight: 6 }} /> Try Again
        </Button>
      </div>
    );
  }

  const {
    course,
    summary,
    cohortLevels = [],
    topics = [],
    questionBankHealth,
    enrolledStudents = [],
    recentSessions = [],
    insights = [],
  } = analytics;

  const readiness = summary.examReadinessScore;
  const filteredTopics = topics.filter((t) => t.name.toLowerCase().includes(topicFilter.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/admin/courses' })}
            style={{
              padding: '0.4rem 0.65rem',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back to Courses
          </Button>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Course & Subject Analytics
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
            onClick={copyCourseId}
            title="Copy Course ID"
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
            ID: {courseId.slice(0, 8)}...
          </button>
        </div>
      </div>

      {/* 2. Course Identity Dossier Banner */}
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
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              {course.code.slice(0, 4)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {course.code}
                </span>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {course.title}
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-background-soft)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {course.level}L Level
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GraduationCap size={14} color="var(--color-primary)" />
                  {course.department?.name || 'Department Unassigned'}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Layers size={14} /> {topics.length} Syllabus Topics
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> {summary.totalStudents} Enrolled Students
                </span>
              </div>
            </div>
          </div>

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
                Course Health Index
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: readiness >= 75 ? 'var(--color-success)' : readiness >= 50 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                {readiness}% Readiness ({readiness >= 75 ? 'On Target' : readiness >= 50 ? 'Moderate' : 'Needs Review'})
              </span>
            </div>
            {readiness >= 75 ? (
              <ShieldCheck size={28} color="var(--color-success)" />
            ) : (
              <Target size={28} color="var(--color-primary)" />
            )}
          </div>
        </div>

        {course.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
            {course.description}
          </p>
        )}
      </div>

      {/* 3. Executive KPI Diagnostics Ribbon (6 Metric Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Average Score & Pass Rate */}
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
              Course Average Score
            </span>
            <TrendingUp size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.averageScore}%
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {summary.passRate}% pass rate
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Across {summary.completedSessions} completed sessions
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
              Cohort Readiness
            </span>
            <Target size={16} color={readiness >= 75 ? 'var(--color-success)' : 'var(--color-warning)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {readiness}%
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: readiness >= 75 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {readiness >= 75 ? 'Exam Ready' : 'In Progress'}
            </span>
          </div>
          <div style={{ width: '100%', height: 4, backgroundColor: 'var(--color-background-soft)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${readiness}%`, height: '100%', backgroundColor: readiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 2 }} />
          </div>
        </div>

        {/* KPI 3: Calibrated Cohort Elo */}
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
              {summary.averageEloRating}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {summary.averageMastery}% mastery
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Baseline: 1200 calibrated
          </span>
        </div>

        {/* KPI 4: Question Bank Inventory */}
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
              Question Bank Volume
            </span>
            <Layers size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {questionBankHealth.totalQuestions}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              ({questionBankHealth.theory} Theory)
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {questionBankHealth.multipleChoice} Multiple choice items
          </span>
        </div>

        {/* KPI 5: Active Enrollment */}
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
              Enrolled Cohort
            </span>
            <Users size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalStudents}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
              ({summary.activeSessions} active)
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Students registered in course
          </span>
        </div>

        {/* KPI 6: Overall Assessment Volume */}
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
              Total Sessions Run
            </span>
            <Clock size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalSessions}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
              ({summary.overallAccuracy}% acc)
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Exam & practice attempts
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
          onClick={() => setActiveTab('levels')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'levels' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'levels' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BarChart2 size={15} /> Academic Level Cohorts (100L – 400L)
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
          <Brain size={15} /> Subjects & Topics Breakdown ({topics.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'students' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'students' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Users size={15} /> Enrolled Students ({enrolledStudents.length})
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
          <Clock size={15} /> Assessment Sessions Audit ({recentSessions.length})
        </button>
      </div>

      {/* 5. Tab Content Panes */}

      {/* TAB 1: ACADEMIC LEVEL COHORT BREAKDOWN */}
      {activeTab === 'levels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Pedagogical Insights */}
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
                  Course Pedagogical Diagnosis & AI Insights
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insights.map((insight, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level Comparison Chart */}
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
                Academic Level Performance Comparison (100L – 400L)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Comparing Average Score (%) and Exam Readiness (%) across undergraduate cohorts
              </p>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortLevels} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="level" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<AnalyticsChartTooltip />} />
                  <Bar dataKey="averageScore" name="Avg Score (%)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="examReadinessScore" name="Readiness (%)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Level Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {cohortLevels.map((lvl) => (
              <div
                key={lvl.level}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {lvl.level} Cohort
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: lvl.examReadinessScore >= 70 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: lvl.examReadinessScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  >
                    {lvl.examReadinessScore}% Ready
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span>Enrolled: <strong>{lvl.studentCount} students</strong></span>
                  <span>Sessions: <strong>{lvl.sessionsCount}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span>Avg Score: <strong>{lvl.averageScore}%</strong></span>
                  <span>Pass Rate: <strong>{lvl.passRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECTS & TOPICS BREAKDOWN */}
      {activeTab === 'topics' && (
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
                Course Topics & Cognitive Mastery Breakdown
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Granular mastery ratings and student accuracy for every syllabus topic
              </p>
            </div>

            <input
              type="text"
              placeholder="Search topics..."
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
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
              No topics matching filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Topic Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Sequence</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Questions</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Student Accuracy</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Mastery Progress</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Difficulty Tier</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopics.map((topic, idx) => (
                    <tr
                      key={topic.topicId}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Link
                          to="/admin/topics/$topicId"
                          params={{ topicId: topic.topicId }}
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            textDecoration: 'none',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                        >
                          {topic.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                        #{topic.order}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {topic.questionCount} items
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: topic.accuracy >= 70 ? 'var(--color-success)' : topic.accuracy >= 50 ? 'var(--color-primary)' : 'var(--color-danger)',
                          }}
                        >
                          {topic.accuracy}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 6, backgroundColor: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, topic.masteryScore)}%`,
                                height: '100%',
                                backgroundColor: topic.masteryScore >= 70 ? 'var(--color-success)' : topic.masteryScore >= 45 ? 'var(--color-primary)' : 'var(--color-warning)',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
                            {topic.masteryScore}%
                          </span>
                        </div>
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
                          }}
                        >
                          {topic.difficultyTier}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: '/admin/topics/$topicId', params: { topicId: topic.topicId } })}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Deep View <ChevronRight size={12} style={{ marginLeft: 2 }} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENROLLED STUDENTS ROSTER */}
      {activeTab === 'students' && (
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
              Enrolled Students Roster ({enrolledStudents.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Performance, level cohorts, and calibrated ratings of all students in this course
            </p>
          </div>

          {enrolledStudents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No students enrolled in this course yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Level</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Average Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Calibrated Elo</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Sessions Completed</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((s, idx) => (
                    <tr
                      key={s.studentId}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Link
                          to="/admin/users/$userId"
                          params={{ userId: s.studentId }}
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                          }}
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {s.email}
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
                            color: 'var(--color-text)',
                          }}
                        >
                          {s.level}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: s.averageScore >= 70 ? 'var(--color-success)' : s.averageScore >= 50 ? 'var(--color-primary)' : 'var(--color-danger)',
                          }}
                        >
                          {s.averageScore}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {s.eloRating}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {s.sessionsCount} sessions
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: s.studentId } })}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          View Student <ChevronRight size={12} style={{ marginLeft: 2 }} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSIONS AUDIT LOG */}
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
              Recent Practice & Examination Sessions Audit
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Chronological log of student sessions completed in {course.code}
            </p>
          </div>

          {recentSessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No completed sessions recorded for this course yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Date & Time</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Cohort Level</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Accuracy</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Trust Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s, idx) => (
                    <tr
                      key={s.sessionId}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text)' }}>
                        {s.endedAt ? new Date(s.endedAt).toLocaleString() : 'Recent'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {s.studentName}
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
                            color: 'var(--color-text)',
                          }}
                        >
                          {s.studentLevel}
                        </span>
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
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: s.trustScore >= 85 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: s.trustScore >= 85 ? 'var(--color-success)' : 'var(--color-danger)',
                            border: `1px solid ${s.trustScore >= 85 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {s.trustScore}/100
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
    </div>
  );
}
