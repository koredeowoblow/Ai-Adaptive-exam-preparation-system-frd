import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useIntegrityLogs,
  useExamSessionDetails,
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
  AlertTriangle,
  RotateCcw,
  Eye,
  Check,
  Copy,
  FileText,
  Clock,
} from 'lucide-react';
import type { IntegrityLogItem } from '../../features/admin/api/admin.api';
import type { AdminExamSession } from '../../types/practice.types';
import { toast } from 'sonner';

interface IntegritySearch {
  q?: string;
  severity?: 'all' | 'LOW' | 'MEDIUM' | 'HIGH';
  eventType?: string;
  page?: number;
  limit?: number;
}

export const Route = createFileRoute('/admin/integrity')({
  validateSearch: (search: Record<string, unknown>): IntegritySearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      severity: (['all', 'LOW', 'MEDIUM', 'HIGH'].includes(search.severity as string)
        ? search.severity
        : 'all') as IntegritySearch['severity'],
      eventType: typeof search.eventType === 'string' && search.eventType ? search.eventType : 'all',
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 20,
    };
  },
  component: IntegrityAdminRoute,
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

function IntegrityAdminRoute() {
  useDocumentTitle('Admin: Anti-Cheat & Integrity Monitor');
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  const [searchInput, setSearchInput] = React.useState(search.q || '');
  const [selectedSeverity, setSelectedSeverity] = React.useState<IntegritySearch['severity']>(search.severity || 'all');
  const [selectedEventType, setSelectedEventType] = React.useState(search.eventType || 'all');

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

  // Query API parameters
  const apiParams = React.useMemo(() => {
    return {
      page: search.page || 1,
      limit: search.limit || 20,
      severity: search.severity && search.severity !== 'all' ? search.severity : undefined,
      eventType: search.eventType && search.eventType !== 'all' ? search.eventType : undefined,
    };
  }, [search]);

  const { data: integrityResponse, isLoading, refetch } = useIntegrityLogs(apiParams);

  const { data: inspectedSessionData, isLoading: isLoadingSession } = useExamSessionDetails(
    inspectingSessionId || undefined
  );

  const rawLogs = integrityResponse?.items;
  const logs = React.useMemo(() => rawLogs || [], [rawLogs]);
  const totalItems = integrityResponse?.total || 0;
  const highSeverityTotal = integrityResponse?.highCount || 0;
  const totalPages = integrityResponse?.totalPages || 1;
  const currentPage = search.page || 1;

  // Filter client-side if search input exists
  const filteredLogs = React.useMemo(() => {
    if (!search.q) return logs;
    const qLower = search.q.toLowerCase();
    return logs.filter((log) => {
      const studentName = typeof log.studentId === 'object' ? log.studentId?.name || '' : '';
      const studentEmail = typeof log.studentId === 'object' ? log.studentId?.email || '' : '';
      const evtType = log.eventType || '';
      return (
        studentName.toLowerCase().includes(qLower) ||
        studentEmail.toLowerCase().includes(qLower) ||
        evtType.toLowerCase().includes(qLower)
      );
    });
  }, [logs, search.q]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFilterChange = (updates: Partial<IntegritySearch>) => {
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
    setSelectedSeverity('all');
    setSelectedEventType('all');
    navigate({
      search: () => ({
        page: 1,
        limit: 20,
        severity: 'all',
        eventType: 'all',
      }),
    });
  };

  // Severity style helper
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'Critical / High',
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Moderate Warning',
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.12)',
          color: '#94a3b8',
          border: 'rgba(100, 116, 139, 0.25)',
          label: 'Minor Advisory',
        };
    }
  };

  // Table Columns
  const columns: Column<IntegrityLogItem>[] = [
    {
      header: 'Student',
      accessorKey: 'studentId',
      cell: (log) => {
        const student = typeof log.studentId === 'object' ? log.studentId : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {student?.name || 'Student Account'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {student?.email || '-'}
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
      header: 'Incident Type',
      accessorKey: 'eventType',
      cell: (log) => {
        const evtName = log.eventType.replace(/_/g, ' ');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: log.severity === 'HIGH' ? '#ef4444' : log.severity === 'MEDIUM' ? '#f59e0b' : 'var(--color-text-muted)',
              }}
            >
              {log.severity === 'HIGH' ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                {evtName}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {log.eventType}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      cell: (log) => {
        const style = getSeverityStyle(log.severity);
        return (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
            }}
          >
            {style.label}
          </span>
        );
      },
    },
    {
      header: 'Session & Course',
      accessorKey: 'sessionId',
      cell: (log) => {
        const session = typeof log.sessionId === 'object' ? log.sessionId : null;
        const course = session?.courseId && typeof session.courseId === 'object' ? session.courseId : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 500, fontSize: '0.825rem', color: 'var(--color-text-primary)' }}>
              {course?.title || (course?.code ? `Course: ${course.code}` : 'Practice Session')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {session?.trustScore !== undefined && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: session.trustScore < 80 ? '#ef4444' : '#10b981',
                  }}
                >
                  Trust: {session.trustScore}%
                </span>
              )}
              {session?._id && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  #{session._id.slice(-6)}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Telemetry Metadata',
      cell: (log) => {
        const meta = log.metadata || {};
        const keys = Object.keys(meta);
        if (keys.length === 0) {
          return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Standard event</span>;
        }
        const snippet = keys.map((k) => `${k}: ${String(meta[k])}`).join(', ');
        return (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              fontFamily: 'monospace',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
            }}
            title={snippet}
          >
            {snippet}
          </span>
        );
      },
    },
    {
      header: 'Detected Time',
      accessorKey: 'timestamp',
      cell: (log) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          {formatDate(log.timestamp)}
        </span>
      ),
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (log) => {
        const sId = typeof log.sessionId === 'object' ? log.sessionId?._id : (log.sessionId as string);
        const actions: ActionItem[] = [
          ...(sId
            ? [
                {
                  label: 'Inspect Session Dossier',
                  icon: <Eye size={14} />,
                  onClick: () => setInspectingSessionId(sId),
                },
              ]
            : []),
          {
            label: copiedId === log._id ? 'Copied!' : 'Copy Incident ID',
            icon: copiedId === log._id ? <Check size={14} /> : <Copy size={14} />,
            onClick: () => handleCopyId(log._id),
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
        title="Anti-Cheat & Integrity Monitor"
        description="Surveillance feed of proctoring events, tab switches, clipboard injections, and student integrity telemetry."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RotateCcw size={14} style={{ marginRight: '6px' }} />
            Refresh Telemetry
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
              Total Incidents Logged
            </span>
            <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {totalItems.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Proctoring events captured
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
              High Severity Violations
            </span>
            <ShieldAlert size={16} style={{ color: '#ef4444' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: highSeverityTotal > 0 ? '#ef4444' : 'var(--color-text-primary)' }}>
            {highSeverityTotal}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Critical breach alerts
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
              Surveillance Status
            </span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success, #10b981)',
              }}
            />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success, #10b981)' }}>
            Active
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Client proctoring daemon live
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
              Page Logs
            </span>
            <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {logs.length}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Showing page {currentPage} of {totalPages}
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
            placeholder="Search student or event..."
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
            aria-label="Search violations"
          />
        </div>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => {
            const val = e.target.value as IntegritySearch['severity'];
            setSelectedSeverity(val);
            handleFilterChange({ severity: val });
          }}
          aria-label="Filter by severity"
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
          <option value="all">All Severities</option>
          <option value="HIGH">Critical / High</option>
          <option value="MEDIUM">Moderate / Medium</option>
          <option value="LOW">Minor / Low</option>
        </select>

        {/* Event Type Filter */}
        <select
          value={selectedEventType}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedEventType(val);
            handleFilterChange({ eventType: val });
          }}
          aria-label="Filter by event type"
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft, var(--color-surface))',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            minWidth: '160px',
          }}
        >
          <option value="all">All Event Types</option>
          <option value="WINDOW_BLUR">Window Blur</option>
          <option value="VISIBILITY_CHANGE">Visibility Change</option>
          <option value="PASTE_ATTEMPT">Paste Attempt</option>
          <option value="COPY_ATTEMPT">Copy Attempt</option>
          <option value="CUT_ATTEMPT">Cut Attempt</option>
          <option value="MOUSE_LEAVE">Mouse Leave Window</option>
          <option value="CONTEXT_MENU">Right Click Context Menu</option>
        </select>

        {/* Reset */}
        {(searchInput || selectedSeverity !== 'all' || selectedEventType !== 'all') && (
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(item) => item._id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            title="No integrity violations recorded"
            description="The proctoring system has not detected any suspicious tab switches or unauthorized input events matching current filters."
            actionLabel="Reset Search Filters"
            onAction={handleResetFilters}
          />
        }
      />

      {/* Pagination */}
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
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total logs)
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
        title="Session Proctoring Dossier"
        description="Comprehensive audit of question items served, submitted answers, and anti-cheat telemetry."
        width="640px"
      >
        {isLoadingSession ? (
          <div style={{ padding: 'var(--space-32)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading session dossier...
          </div>
        ) : inspectedSessionData ? (
          <SessionProctoringInspection session={inspectedSessionData} onCopyId={handleCopyId} />
        ) : (
          <div style={{ padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>
            Session details could not be retrieved.
          </div>
        )}
      </FormDrawer>
    </div>
  );
}

function SessionProctoringInspection({
  session,
  onCopyId,
}: {
  session: AdminExamSession;
  onCopyId: (id: string) => void;
}) {
  const student = typeof session.studentId === 'object' ? session.studentId : null;
  const course = typeof session.courseId === 'object' ? session.courseId : null;
  const events = session.antiCheatEvents || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {/* Session Overview */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            #{session._id.slice(-8)}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-8)',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Trust Score</span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'block',
                color: (session.trustScore ?? 100) < 80 ? '#ef4444' : '#10b981',
              }}
            >
              {session.trustScore ?? 100}%
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Course</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--color-text-primary)' }}>
              {course?.code || course?.title || '-'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Status</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--color-text-primary)' }}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      {/* Incident Log Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Session Incident Timeline ({events.length})
        </h4>

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
            No suspicious tab switches or clipboard injections recorded during this exam attempt.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
    </div>
  );
}
