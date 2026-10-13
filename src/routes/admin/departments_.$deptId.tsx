import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useDepartmentDetailedAnalytics } from '../../features/admin/hooks/useAdmin';
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
  Building2,
  BookOpen,
  TrendingUp,
  Target,
  ShieldAlert,
  ShieldCheck,
  Clock,
  RotateCcw,
  BarChart2,
  Sparkles,
  Layers,
  Users,
  Check,
  Copy,
  ChevronRight,
} from 'lucide-react';

export const Route = createFileRoute('/admin/departments_/$deptId')({
  component: AdminDepartmentAnalyticsPage,
});

// Recharts tooltip
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

export function AdminDepartmentAnalyticsPage() {
  const { deptId } = Route.useParams();
  const navigate = useNavigate();

  const { data: analytics, isLoading, error, refetch, isRefetching } = useDepartmentDetailedAnalytics(deptId);

  useDocumentTitle(
    analytics?.department?.name
      ? `${analytics.department.name} — Department Analytics — EduAdapt`
      : 'Department In-Depth Analytics — EduAdapt'
  );

  const [activeTab, setActiveTab] = React.useState<'levels' | 'courses' | 'students'>('levels');
  const [copiedId, setCopiedId] = React.useState(false);
  const [courseFilter, setCourseFilter] = React.useState('');

  const copyDeptId = () => {
    if (!deptId) return;
    navigator.clipboard.writeText(deptId);
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
          title="Unable to load department analytics"
          description={error instanceof Error ? error.message : 'The department analytics dossier could not be found or loaded.'}
          icon={<ShieldAlert size={40} color="var(--color-danger)" />}
          action={{
            label: 'Back to Departments Directory',
            onClick: () => navigate({ to: '/admin/departments' }),
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RotateCcw size={14} style={{ marginRight: 6 }} /> Try Again
        </Button>
      </div>
    );
  }

  const {
    department,
    summary,
    levelBreakdown = [],
    courses = [],
    topStudents = [],
    insights = [],
  } = analytics;

  const readiness = summary.departmentReadinessScore;
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(courseFilter.toLowerCase()) ||
    c.code.toLowerCase().includes(courseFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/admin/departments' })}
            style={{
              padding: '0.4rem 0.65rem',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back to Departments
          </Button>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Department & Level Diagnostics
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
            onClick={copyDeptId}
            title="Copy Department ID"
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
            ID: {deptId.slice(0, 8)}...
          </button>
        </div>
      </div>

      {/* 2. Department Identity Dossier Banner */}
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
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                flexShrink: 0,
              }}
            >
              <Building2 size={32} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {department.name}
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--color-success)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  Academic Faculty
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={14} color="var(--color-primary)" />
                  {summary.totalCourses} Degree Courses
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> {summary.totalStudents} Active Students
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Layers size={14} /> {summary.totalTopics} Syllabus Topics
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
                Faculty Health
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: readiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                {readiness}% Readiness Index
              </span>
            </div>
            {readiness >= 75 ? (
              <ShieldCheck size={28} color="var(--color-success)" />
            ) : (
              <Target size={28} color="var(--color-primary)" />
            )}
          </div>
        </div>

        {department.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
            {department.description}
          </p>
        )}
      </div>

      {/* 3. Executive KPI Diagnostics Ribbon (6 Metric Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Department Proficiency Score */}
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
              Faculty Proficiency
            </span>
            <TrendingUp size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.averageScore}%
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {summary.passRate}% pass
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Average across all courses
          </span>
        </div>

        {/* KPI 2: Overall Exam Readiness */}
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
              Exam Readiness
            </span>
            <Target size={16} color={readiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {readiness}%
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: readiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)' }}>
              {readiness >= 75 ? 'Optimal' : 'Standard'}
            </span>
          </div>
          <div style={{ width: '100%', height: 4, backgroundColor: 'var(--color-background-soft)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${readiness}%`, height: '100%', backgroundColor: readiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 2 }} />
          </div>
        </div>

        {/* KPI 3: Total Enrolled Students */}
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
              Student Body
            </span>
            <Users size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalStudents}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Undergraduates
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Active across 100L – 400L
          </span>
        </div>

        {/* KPI 4: Course Offerings */}
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
              Degree Curricula
            </span>
            <BookOpen size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalCourses}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Courses
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {summary.totalTopics} active topics
          </span>
        </div>

        {/* KPI 5: Assessment Activity */}
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
              Assessment Volume
            </span>
            <Clock size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalSessions}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Sessions
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {summary.overallAccuracy}% overall accuracy
          </span>
        </div>

        {/* KPI 6: Question Bank Items */}
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
              Item Bank Scale
            </span>
            <Layers size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.totalQuestions}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Questions
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Curated item response bank
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
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'courses' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'courses' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BookOpen size={15} /> Department Courses Matrix ({courses.length})
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
          <Users size={15} /> Department Student Body ({topStudents.length})
        </button>
      </div>

      {/* 5. Tab Content Panes */}

      {/* TAB 1: ACADEMIC LEVEL COHORTS (100L - 400L) */}
      {activeTab === 'levels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Insights Card */}
          {insights.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-success)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Department Executive Diagnosis & Pedagogical Guidance
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insights.map((insight, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level Comparison Bar Chart */}
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
                Academic Level Cohort Comparison (100L – 400L)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Proficiency, exam readiness, and active engagement by undergraduate level
              </p>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* Level Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {levelBreakdown.map((lvl) => (
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
                    {lvl.level} Undergraduate Cohort
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
                  <span>Active Sessions: <strong>{lvl.activeCount}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span>Average Score: <strong>{lvl.averageScore}%</strong></span>
                  <span>Pass Rate: <strong>{lvl.passRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT COURSES MATRIX */}
      {activeTab === 'courses' && (
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
                Accredited Course Curriculum Matrix
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Performance surveillance and student enrollment across degree courses
              </p>
            </div>

            <input
              type="text"
              placeholder="Search courses..."
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
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

          {filteredCourses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No courses matching search filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Code</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Course Title</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Level</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Topics</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Students</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Average Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pass Rate</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((c, idx) => (
                    <tr
                      key={c.courseId}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Link
                          to="/admin/courses/$courseId"
                          params={{ courseId: c.courseId }}
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {c.level}L
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {c.topicCount} topics
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                        {c.enrolledStudents} students
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: c.averageScore >= 70 ? 'var(--color-success)' : c.averageScore >= 50 ? 'var(--color-primary)' : 'var(--color-danger)',
                          }}
                        >
                          {c.averageScore}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {c.passRate}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: '/admin/courses/$courseId', params: { courseId: c.courseId } })}
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

      {/* TAB 3: DEPARTMENT STUDENTS DIRECTORY */}
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
              Department Student Body ({topStudents.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Undergraduate students registered within {department.name}
            </p>
          </div>

          {topStudents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No students enrolled in this department yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email Address</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Academic Level</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Average Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Sessions Completed</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Full Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((s, idx) => (
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
                          Student Dossier <ChevronRight size={12} style={{ marginLeft: 2 }} />
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
    </div>
  );
}
