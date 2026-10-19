import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useExamSessions,
  useExamSessionDetails,
  useCourses,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { RowActions, type ActionItem } from '../../shared/components/RowActions';
import { FormDrawer } from '../../shared/components/FormDrawer';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  Check,
  Copy,
  TrendingUp,
} from 'lucide-react';
import type { AdminExamSession } from '../../types/practice.types';
import type { Course } from '../../types/course.types';
import { toast } from 'sonner';
import { FormattedMathText } from '../../shared/components/FormattedMathText';

interface SessionSearch {
  q?: string;
  courseId?: string;
  status?: 'all' | 'active' | 'completed' | 'PENDING_GRADING' | 'FAILED';
  trust?: 'all' | 'flagged' | 'clean';
  page?: number;
  limit?: number;
  sortBy?: 'startedAt' | 'score' | 'trustScore' | 'questionsAnswered';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/admin/sessions')({
  validateSearch: (search: Record<string, unknown>): SessionSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      courseId: typeof search.courseId === 'string' && search.courseId ? search.courseId : undefined,
      status: (['all', 'active', 'completed', 'PENDING_GRADING', 'FAILED'].includes(search.status as string)
        ? search.status
        : 'all') as SessionSearch['status'],
      trust: (['all', 'flagged', 'clean'].includes(search.trust as string)
        ? search.trust
        : 'all') as SessionSearch['trust'],
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['startedAt', 'score', 'trustScore', 'questionsAnswered'].includes(search.sortBy as string)
        ? search.sortBy
        : 'startedAt') as SessionSearch['sortBy'],
      sortOrder: search.sortOrder === 'asc' ? 'asc' : 'desc',
    };
  },
  component: ExamSessionsAdminRoute,
});

function formatDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 0) return '—';
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function ExamSessionsAdminRoute() {
  useDocumentTitle('Admin: Exam & Session Monitor');
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  // Local filter states
  const [searchInput, setSearchInput] = React.useState(search.q || '');
  const [selectedCourse, setSelectedCourse] = React.useState(search.courseId || '');
  const [selectedStatus, setSelectedStatus] = React.useState<SessionSearch['status']>(search.status || 'all');
  const [selectedTrust, setSelectedTrust] = React.useState<SessionSearch['trust']>(search.trust || 'all');

  // Inspection drawer state
  const [inspectingSessionId, setInspectingSessionId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Debounced search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if ((search.q || '') !== searchInput.trim()) {
        navigate({
          search: (prev: any) => ({
            ...prev,
            q: searchInput.trim() || undefined,
            page: 1,
          }),
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate, search.q]);

  // Fetch Courses for filter dropdown
  const { data: coursesData } = useCourses();
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData) return [];
    return coursesData.pages.flatMap((page) => page.items);
  }, [coursesData]);

  // Query API parameters
  const apiParams = React.useMemo(() => {
    return {
      page: search.page || 1,
      limit: search.limit || 10,
      courseId: search.courseId || undefined,
      status: search.status && search.status !== 'all' ? search.status : undefined,
      minTrust: search.trust === 'clean' ? 80 : undefined,
      maxTrust: search.trust === 'flagged' ? 79 : undefined,
      sortBy: search.sortBy || 'startedAt',
      sortOrder: search.sortOrder || 'desc',
    };
  }, [search]);

  const { data: sessionsResponse, isLoading, refetch } = useExamSessions(apiParams);

  // Detailed session data for inspection
  const { data: inspectedSessionData, isLoading: isLoadingDetails } = useExamSessionDetails(
    inspectingSessionId || undefined
  );

  const rawSessions = sessionsResponse?.items;
  const sessions = React.useMemo(() => rawSessions || [], [rawSessions]);
  const totalItems = sessionsResponse?.total || 0;
  const totalPages = sessionsResponse?.totalPages || 1;
  const currentPage = search.page || 1;

  // Filter client-side if student search is typed
  const filteredSessions = React.useMemo(() => {
    if (!search.q) return sessions;
    const qLower = search.q.toLowerCase();
    return sessions.filter((s) => {
      const studentName = typeof s.studentId === 'object' ? s.studentId?.name || '' : '';
      const studentEmail = typeof s.studentId === 'object' ? s.studentId?.email || '' : '';
      const courseTitle = typeof s.courseId === 'object' ? s.courseId?.title || '' : '';
      const courseCode = typeof s.courseId === 'object' ? s.courseId?.code || '' : '';
      return (
        studentName.toLowerCase().includes(qLower) ||
        studentEmail.toLowerCase().includes(qLower) ||
        courseTitle.toLowerCase().includes(qLower) ||
        courseCode.toLowerCase().includes(qLower)
      );
    });
  }, [sessions, search.q]);

  // Surveillance Metrics
  const metrics = React.useMemo(() => {
    const activeCount = sessions.filter((s) => s.status === 'active').length;
    const flaggedCount = sessions.filter(
      (s) => (s.trustScore !== undefined && s.trustScore < 80) || (s.antiCheatEvents && s.antiCheatEvents.length > 0)
    ).length;
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const avgScore =
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedSessions.length
          )
        : null;

    return {
      total: totalItems,
      active: activeCount,
      flagged: flaggedCount,
      avgScore,
    };
  }, [sessions, totalItems]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Session ID copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFilterChange = (updates: Partial<SessionSearch>) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        ...updates,
        page: 1,
      }),
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSelectedCourse('');
    setSelectedStatus('all');
    setSelectedTrust('all');
    navigate({
      search: () => ({
        page: 1,
        limit: 10,
        status: 'all',
        trust: 'all',
      }),
    });
  };

  // Columns definition
  const columns: Column<AdminExamSession>[] = [
    {
      header: 'Student',
      accessorKey: 'studentId',
      cell: (session) => {
        const student = typeof session.studentId === 'object' ? session.studentId : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {student?.name || 'Unknown Student'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {student?.email || '—'}
              </span>
              {student?.level && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface-hover)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {student.level}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Course',
      accessorKey: 'courseId',
      cell: (session) => {
        const course = typeof session.courseId === 'object' ? session.courseId : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {course?.title || 'Course'}
            </span>
            {course?.code && (
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                {course.code}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (session) => {
        const statusMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
          active: {
            label: 'In Progress',
            bg: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.25)',
          },
          completed: {
            label: 'Completed',
            bg: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            border: 'rgba(16, 185, 129, 0.25)',
          },
          PENDING_GRADING: {
            label: 'Grading...',
            bg: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            border: 'rgba(245, 158, 11, 0.25)',
          },
          FAILED: {
            label: 'Aborted / Failed',
            bg: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: 'rgba(239, 68, 68, 0.25)',
          },
        };

        const config = statusMap[session.status] || {
          label: session.status,
          bg: 'var(--color-surface-hover)',
          color: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {session.status === 'active' && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  animation: 'pulse 1.8s infinite',
                }}
              />
            )}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
              }}
            >
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Score',
      accessorKey: 'score',
      cell: (session) => {
        if (session.status === 'active') {
          return (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Pending
            </span>
          );
        }
        const scoreVal = Math.round(session.score ?? 0);
        const scoreColor =
          scoreVal >= 70 ? 'var(--color-success, #10b981)' : scoreVal >= 50 ? '#f59e0b' : '#ef4444';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '45px',
                height: '5px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, scoreVal)}%`,
                  height: '100%',
                  backgroundColor: scoreColor,
                  borderRadius: '3px',
                }}
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: scoreColor }}>
              {scoreVal}%
            </span>
          </div>
        );
      },
    },
    {
      header: 'Integrity Trust',
      accessorKey: 'trustScore',
      cell: (session) => {
        const trust = session.trustScore ?? 100;
        const eventsCount = session.antiCheatEvents?.length || 0;

        let badgeBg = 'rgba(16, 185, 129, 0.1)';
        let badgeColor = '#10b981';
        let badgeBorder = 'rgba(16, 185, 129, 0.25)';
        let Icon = ShieldCheck;

        if (trust < 60) {
          badgeBg = 'rgba(239, 68, 68, 0.12)';
          badgeColor = '#ef4444';
          badgeBorder = 'rgba(239, 68, 68, 0.3)';
          Icon = ShieldAlert;
        } else if (trust < 80) {
          badgeBg = 'rgba(245, 158, 11, 0.12)';
          badgeColor = '#f59e0b';
          badgeBorder = 'rgba(245, 158, 11, 0.3)';
          Icon = AlertTriangle;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeBorder}`,
              }}
            >
              <Icon size={12} />
              {trust}%
            </span>
            {eventsCount > 0 && (
              <span
                title={`${eventsCount} anti-cheat incidents flagged`}
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  fontWeight: 600,
                }}
              >
                {eventsCount} alert{eventsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Questions',
      accessorKey: 'questionsAnswered',
      cell: (session) => {
        const answered = session.questionsAnswered ?? session.questionsServed?.length ?? 0;
        const total = session.totalQuestions ?? 10;
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {answered} / {total}
          </span>
        );
      },
    },
    {
      header: 'Timing',
      accessorKey: 'startedAt',
      cell: (session) => {
        const started = formatDate(session.startedAt);
        const duration = formatDuration(session.startedAt, session.endedAt);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>{started}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Duration: {duration}
            </span>
          </div>
        );
      },
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (session) => {
        const actions: ActionItem[] = [
          {
            label: 'Inspect Session',
            icon: <Eye size={14} />,
            onClick: () => setInspectingSessionId(session._id),
          },
          {
            label: copiedId === session._id ? 'Copied!' : 'Copy Session ID',
            icon: copiedId === session._id ? <Check size={14} /> : <Copy size={14} />,
            onClick: () => handleCopyId(session._id),
          },
        ];
        return <RowActions actions={actions} />;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      {/* Header */}
      <PageHeader
        title="Exam & Session Monitor"
        description="Surveillance feed of real-time student practice attempts, AI grading status, and proctoring integrity trust metrics."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RotateCcw size={14} style={{ marginRight: '6px' }} />
            Refresh Feed
          </Button>
        </div>
      </PageHeader>

      {/* KPI Overview Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-12)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Total Sessions
            </span>
            <Activity size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {metrics.total.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Logged in system database
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Live In-Progress
            </span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
              }}
            />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>
            {metrics.active}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Active attempts on current page
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Flagged Incidents
            </span>
            <ShieldAlert size={16} style={{ color: '#ef4444' }} />
          </div>
          <span
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: metrics.flagged > 0 ? '#ef4444' : 'var(--color-text-primary)',
            }}
          >
            {metrics.flagged}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Sessions with trust &lt; 80% or warnings
          </span>
        </div>

        <div
          style={{
            padding: 'var(--space-16)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Avg. Completion Score
            </span>
            <TrendingUp size={16} style={{ color: 'var(--color-success, #10b981)' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {metrics.avgScore !== null ? `${metrics.avgScore}%` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Across completed attempts
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-12)',
          padding: 'var(--space-12)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search student or course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.625rem 0.45rem 2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background-soft, var(--color-surface))',
              color: 'var(--color-text-primary)',
              fontSize: '0.8125rem',
            }}
            aria-label="Search sessions"
          />
        </div>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            handleFilterChange({ courseId: e.target.value || undefined });
          }}
          aria-label="Filter by course"
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft, var(--color-surface))',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            minWidth: '180px',
          }}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code ? `${c.code} - ` : ''}
              {c.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            const val = e.target.value as SessionSearch['status'];
            setSelectedStatus(val);
            handleFilterChange({ status: val });
          }}
          aria-label="Filter by status"
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft, var(--color-surface))',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            minWidth: '140px',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">In Progress</option>
          <option value="completed">Completed</option>
          <option value="PENDING_GRADING">Pending Grading</option>
          <option value="FAILED">Aborted / Failed</option>
        </select>

        {/* Trust Filter */}
        <select
          value={selectedTrust}
          onChange={(e) => {
            const val = e.target.value as SessionSearch['trust'];
            setSelectedTrust(val);
            handleFilterChange({ trust: val });
          }}
          aria-label="Filter by trust score"
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft, var(--color-surface))',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            minWidth: '140px',
          }}
        >
          <option value="all">All Integrity</option>
          <option value="clean">Verified (≥80%)</option>
          <option value="flagged">Flagged (&lt;80%)</option>
        </select>

        {/* Reset */}
        {(searchInput || selectedCourse || selectedStatus !== 'all' || selectedTrust !== 'all') && (
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Main Sessions Data Table */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        keyExtractor={(session) => session._id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No exam sessions found"
            description="No student practice attempts match the selected filter criteria."
            actionLabel="Clear Active Filters"
            onAction={handleResetFilters}
          />
        }
      />

      {/* Server Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-12) 0',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
            {totalItems} total attempts)
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: Math.max(1, currentPage - 1) }),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() =>
                navigate({
                  search: (prev: any) => ({ ...prev, page: currentPage + 1 }),
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Session Deep Inspection Drawer */}
      <FormDrawer
        isOpen={Boolean(inspectingSessionId)}
        onClose={() => setInspectingSessionId(null)}
        title="Session Inspection Dossier"
        description="Comprehensive audit of question items served, submitted answers, and proctoring telemetry."
        width="640px"
      >
        {isLoadingDetails ? (
          <div
            style={{
              padding: 'var(--space-32)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Loading session telemetry...</span>
          </div>
        ) : inspectedSessionData ? (
          <SessionInspector session={inspectedSessionData} onCopyId={handleCopyId} />
        ) : (
          <div style={{ padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
            Session details could not be loaded.
          </div>
        )}
      </FormDrawer>
    </div>
  );
}

// Subcomponent: Inspection Dossier Body
function SessionInspector({
  session,
  onCopyId,
}: {
  session: AdminExamSession;
  onCopyId: (id: string) => void;
}) {
  const student = typeof session.studentId === 'object' ? session.studentId : null;
  const course = typeof session.courseId === 'object' ? session.courseId : null;
  const questions = session.questionsServed || [];
  const events = session.antiCheatEvents || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      {/* Overview Card */}
      <div
        style={{
          padding: 'var(--space-16)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {student?.name || 'Student Attempt'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {student?.email} • {student?.level || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => onCopyId(session._id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              backgroundColor: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Copy size={12} />
            {session._id.slice(-8)}
          </button>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-10)',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              Final Score
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {session.score !== undefined ? `${Math.round(session.score)}%` : '—'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              Trust Rating
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: (session.trustScore ?? 100) < 80 ? '#ef4444' : '#10b981',
              }}
            >
              {session.trustScore ?? 100}%
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              Course
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {course?.code || course?.title || '—'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
              Duration
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
              {formatDuration(session.startedAt, session.endedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Proctoring & Anti-Cheat Events */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Integrity & Proctoring Telemetry ({events.length} incident{events.length === 1 ? '' : 's'})
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: events.length > 0 ? '#ef4444' : 'var(--color-success, #10b981)',
              fontWeight: 500,
            }}
          >
            {events.length > 0 ? 'Suspicious activity recorded' : 'Clean proctoring log'}
          </span>
        </div>

        {events.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-12)',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            No tab switches, clipboard paste injections, or devtools openings detected during this attempt.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {events.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px var(--space-12)',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{evt.type}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {formatDate(evt.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Items Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Questions Served ({questions.length})
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {session.correctAnswers ?? 0} Correct of {session.questionsAnswered ?? questions.length} Answered
          </span>
        </div>

        {questions.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-16)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
            }}
          >
            No question history recorded for this attempt.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            {questions.map((q, idx) => {
              const qDoc = (typeof q.questionId === 'object' ? q.questionId : null) as any;
              const isCorrect = q.correct === true;
              const hasScore = q.score !== undefined;

              return (
                <div
                  key={idx}
                  style={{
                    padding: 'var(--space-12)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-8)',
                  }}
                >
                  {/* Question header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-hover)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Q{idx + 1}
                      </span>
                      {qDoc?.type && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-surface-hover)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {qDoc.type}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {q.timeTaken !== undefined && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {q.timeTaken}s
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isCorrect ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isCorrect ? 'Correct' : hasScore ? `${Math.round(q.score || 0)} pts` : 'Incorrect'}
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-primary)',
                      lineHeight: '1.4',
                      margin: 0,
                    }}
                  >
                    {qDoc?.questionText ? (
                      <FormattedMathText text={qDoc.questionText} />
                    ) : (
                      `Question ID: ${q.questionId}`
                    )}
                  </div>

                  {/* Student Submission vs Correct Answer */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.8rem',
                      padding: '8px',
                      backgroundColor: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        Student Submitted:
                      </span>{' '}
                      <span
                        style={{
                          fontWeight: 600,
                          color: isCorrect ? '#10b981' : '#ef4444',
                        }}
                      >
                        {q.selectedAnswer ? (
                          qDoc?.options?.find((o: any) => o.id === q.selectedAnswer) ? (
                            <span>
                              <strong>{q.selectedAnswer}: </strong>
                              <FormattedMathText text={qDoc.options.find((o: any) => o.id === q.selectedAnswer)!.text} />
                            </span>
                          ) : (
                            q.selectedAnswer
                          )
                        ) : q.writtenAnswer ? (
                          <FormattedMathText text={q.writtenAnswer} />
                        ) : (
                          '(No response provided)'
                        )}
                      </span>
                    </div>

                    {qDoc?.correctAnswer && !isCorrect && (
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          Expected Correct:
                        </span>{' '}
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {qDoc.options?.find((o: any) => o.id === qDoc.correctAnswer) ? (
                            <span>
                              <strong>{qDoc.correctAnswer}: </strong>
                              <FormattedMathText text={qDoc.options.find((o: any) => o.id === qDoc.correctAnswer)!.text} />
                            </span>
                          ) : (
                            qDoc.correctAnswer
                          )}
                        </span>
                      </div>
                    )}

                    {q.feedback && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                        Feedback: <FormattedMathText text={q.feedback} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
