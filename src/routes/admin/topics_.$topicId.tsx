import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTopicDetailedAnalytics } from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { Skeleton } from '../../shared/components/Skeleton';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import { FormattedMathText, stripMathDelimiters } from '../../shared/components/FormattedMathText';
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
  BookOpen,
  TrendingUp,
  Target,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  BarChart2,
  Brain,
  Sparkles,
  Layers,
  Award,
  Zap,
  Check,
  Copy,
  Users,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const Route = createFileRoute('/admin/topics_/$topicId')({
  component: AdminTopicAnalyticsPage,
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
              {typeof p.value === 'number' ? (p.name.includes('%') || p.name.includes('Rate') ? `${p.value}%` : `${p.value} students`) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminTopicAnalyticsPage() {
  const { topicId } = Route.useParams();
  const navigate = useNavigate();

  const { data: analytics, isLoading, error, refetch, isRefetching } = useTopicDetailedAnalytics(topicId);

  useDocumentTitle(
    analytics?.topic?.name
      ? `${analytics.topic.name} - Topic In-Depth Analytics - EduAdapt`
      : 'Topic In-Depth Analytics - EduAdapt'
  );

  const [activeTab, setActiveTab] = React.useState<'mastery' | 'questions' | 'struggling'>('mastery');
  const [copiedId, setCopiedId] = React.useState(false);

  const copyTopicId = () => {
    if (!topicId) return;
    navigator.clipboard.writeText(topicId);
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
          title="Unable to load topic analytics"
          description={error instanceof Error ? error.message : 'The topic analytics dossier could not be found or loaded.'}
          icon={<ShieldAlert size={40} color="var(--color-danger)" />}
          action={{
            label: 'Back to Topics Directory',
            onClick: () => navigate({ to: '/admin/topics' }),
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RotateCcw size={14} style={{ marginRight: 6 }} /> Try Again
        </Button>
      </div>
    );
  }

  const {
    topic,
    summary,
    masteryTiers,
    questions = [],
    strugglingStudents = [],
    insights = [],
  } = analytics;

  const tierChartData = [
    { tier: 'Beginner (<1000)', count: masteryTiers.beginner, fill: '#ef4444' },
    { tier: 'Developing (1000-1200)', count: masteryTiers.developing, fill: '#f59e0b' },
    { tier: 'Competent (1200-1400)', count: masteryTiers.competent, fill: '#6366f1' },
    { tier: 'Master (>1400)', count: masteryTiers.master, fill: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/admin/topics' })}
            style={{
              padding: '0.4rem 0.65rem',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.35rem' }} /> Back to Topics
          </Button>

          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Topic & Subject Diagnostics
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
            onClick={copyTopicId}
            title="Copy Topic ID"
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
            ID: {topicId.slice(0, 8)}...
          </button>
        </div>
      </div>

      {/* 2. Topic Identity Dossier Banner */}
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                flexShrink: 0,
              }}
            >
              <Brain size={32} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Topic #{topic.order}
                </span>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {topic.name}
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
                  {summary.difficultyTier} Tier
                </span>
              </div>

              {topic.course && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                  <Link
                    to="/admin/courses/$courseId"
                    params={{ courseId: topic.course._id }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    <BookOpen size={14} />
                    {topic.course.code}: {topic.course.title}
                  </Link>
                  <span>•</span>
                  <span>{topic.course.department?.name || 'Department'}</span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={14} /> {summary.questionCount} Questions in Pool
                  </span>
                </div>
              )}
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
                Mastery Score
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: summary.masteryScore >= 70 ? 'var(--color-success)' : summary.masteryScore >= 45 ? 'var(--color-primary)' : 'var(--color-warning)' }}>
                {summary.masteryScore}% Calibrated
              </span>
            </div>
            {summary.masteryScore >= 70 ? (
              <CheckCircle2 size={28} color="var(--color-success)" />
            ) : (
              <Target size={28} color="var(--color-primary)" />
            )}
          </div>
        </div>
      </div>

      {/* 3. Executive KPI Diagnostics Ribbon (6 Metric Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Average Accuracy */}
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
              Student Accuracy
            </span>
            <TrendingUp size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.averageAccuracy}%
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
              success rate
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Across {summary.totalAttempts} total attempts
          </span>
        </div>

        {/* KPI 2: Calibrated Elo Rating */}
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
              Calibrated Elo
            </span>
            <Award size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.averageEloRating}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {summary.difficultyTier}
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Item difficulty index
          </span>
        </div>

        {/* KPI 3: Topic Mastery Score */}
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
              Mastery Progress
            </span>
            <Target size={16} color={summary.masteryScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.masteryScore}%
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: summary.masteryScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {summary.masteryScore >= 70 ? 'High' : 'Moderate'}
            </span>
          </div>
          <div style={{ width: '100%', height: 4, backgroundColor: 'var(--color-background-soft)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${summary.masteryScore}%`, height: '100%', backgroundColor: summary.masteryScore >= 70 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 2 }} />
          </div>
        </div>

        {/* KPI 4: Question Pool Scale */}
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
              Question Pool
            </span>
            <Layers size={16} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.questionCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              items
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Configured for this topic
          </span>
        </div>

        {/* KPI 5: Mastered Students */}
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
              Mastered Students
            </span>
            <CheckCircle2 size={16} color="var(--color-success)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.masteredStudentsCount}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-success)', fontWeight: 600 }}>
              Proficient
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Students with &ge;75% mastery
          </span>
        </div>

        {/* KPI 6: At-Risk Students */}
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
              At-Risk Students
            </span>
            <Zap size={16} color="var(--color-warning)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {summary.atRiskStudentsCount}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', fontWeight: 600 }}>
              Need Review
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Students scoring &lt;40%
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
          onClick={() => setActiveTab('mastery')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'mastery' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'mastery' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BarChart2 size={15} /> Mastery Tiers & Cohort Distribution
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'questions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'questions' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <HelpCircle size={15} /> Question Bank Items ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab('struggling')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: activeTab === 'struggling' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'struggling' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Users size={15} /> Students Requiring Remediation ({strugglingStudents.length})
        </button>
      </div>

      {/* 5. Tab Content Panes */}

      {/* TAB 1: MASTERY TIERS & COHORT DISTRIBUTION */}
      {activeTab === 'mastery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {insights.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#8b5cf6" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  Subject Pedagogical Diagnosis & AI Insights
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {insights.map((insight, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 700 }}>•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mastery Tiers Bar Chart */}
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
                Cohort Mastery Distribution Curve
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Number of students calibrated across Item Response Theory (IRT) proficiency tiers
              </p>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="tier" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<AnalyticsChartTooltip />} />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} maxBarSize={55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK ITEMS */}
      {activeTab === 'questions' && (
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
              Configured Question Bank Items ({questions.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Items calibrated for this topic including type and Elo difficulty index
            </p>
          </div>

          {questions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No questions created for this topic yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Question Text Preview</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Difficulty</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Item Elo</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr
                      key={q.questionId}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background-soft)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: q.type === 'THEORY' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                            color: q.type === 'THEORY' ? 'var(--color-warning)' : 'var(--color-primary)',
                          }}
                        >
                          {q.type}
                        </span>
                      </td>
                      <td 
                        style={{ 
                          padding: '0.75rem 0.5rem', 
                          fontWeight: 500, 
                          color: 'var(--color-text)', 
                          maxWidth: 400, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'normal',
                          lineHeight: 1.4,
                        }}
                        title={stripMathDelimiters(q.questionText)}
                      >
                        <FormattedMathText text={q.questionText} />
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
                          {q.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {q.eloRating}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>
                        {q.type === 'THEORY' ? 'Rubric Graded' : `${q.optionsCount} choices`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AT-RISK STUDENTS REQUIRING REMEDIATION */}
      {activeTab === 'struggling' && (
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
              Students Requiring Remediation ({strugglingStudents.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Learners with &lt;50% mastery on this subject who would benefit from targeted intervention
            </p>
          </div>

          {strugglingStudents.length === 0 ? (
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
                No Struggling Students Identified
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                All enrolled students are currently performing at or above baseline mastery expectations on this topic.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email Address</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Cohort Level</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Topic Mastery</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Calibrated Elo</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>Full Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {strugglingStudents.map((s, idx) => (
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
                            color: 'var(--color-danger)',
                          }}
                        >
                          {s.masteryScore}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {s.eloRating}
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
    </div>
  );
}
