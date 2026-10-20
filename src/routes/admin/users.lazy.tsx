import * as React from 'react';
import { createLazyFileRoute, useNavigate, Link } from '@tanstack/react-router';
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
  useDepartments,
  useCourses,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { RowActions, type ActionItem } from '../../shared/components/RowActions';
import { FormDrawer } from '../../shared/components/FormDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import { TableFilterBar } from '../../shared/components/TableFilterBar';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import {
  Shield,
  BookOpen,
  Mail,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  Check,
  Copy,
  TrendingUp,
} from 'lucide-react';
import type { StudentUser } from '../../types/student.types';
import type { Department } from '../../types/department.types';
import type { Course } from '../../types/course.types';
import { toast } from 'sonner';

interface UserSearch {
  q?: string;
  departmentId?: string;
  level?: 'all' | '100L' | '200L' | '300L' | '400L' | '500L';
  onboarded?: 'all' | 'complete' | 'pending';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'level' | 'createdAt' | 'onboarded';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createLazyFileRoute('/admin/users')({
  component: UsersAdminRoute,
});

interface UserFormState {
  name: string;
  departmentId: string;
  level: '100L' | '200L' | '300L' | '400L' | '500L';
  isOnboarded: boolean;
}

function UsersAdminRoute() {
  useDocumentTitle('Admin: Users & Students');
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: '/admin/users' });

  const querySearch = searchParams.q ?? '';
  const selectedDeptFilter = searchParams.departmentId ?? '';
  const selectedLevelFilter = searchParams.level ?? 'all';
  const selectedOnboardedFilter = searchParams.onboarded ?? 'all';
  const currentPage = searchParams.page ?? 1;
  const pageSize = searchParams.limit ?? 10;
  const sortBy = searchParams.sortBy ?? 'createdAt';
  const sortOrder = searchParams.sortOrder ?? 'desc';

  // API Queries & Mutations (Server-driven pagination and filters)
  const {
    data: usersData,
    isLoading: isLoadingUsers,
  } = useUsers({
    q: querySearch || undefined,
    departmentId: selectedDeptFilter || undefined,
    level: selectedLevelFilter !== 'all' ? selectedLevelFilter : undefined,
    isOnboarded:
      selectedOnboardedFilter === 'complete'
        ? true
        : selectedOnboardedFilter === 'pending'
        ? false
        : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  const { data: deptData, isLoading: isLoadingDepts } = useDepartments();
  const departments: Department[] = React.useMemo(() => (Array.isArray(deptData) ? deptData : []), [deptData]);

  const { data: coursesData } = useCourses();
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData?.pages) return [];
    return coursesData.pages.flatMap((page: any) => (Array.isArray(page) ? page : page?.items || []));
  }, [coursesData]);

  const courseMap = React.useMemo(() => {
    const map = new Map<string, Course>();
    courses.filter(Boolean).forEach((c) => {
      if (c?._id) map.set(c._id, c);
    });
    return map;
  }, [courses]);

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, mutateAsync: deleteUserAsync, isPending: isDeleting } = useDeleteUser({
    q: querySearch || undefined,
    departmentId: selectedDeptFilter || undefined,
    level: selectedLevelFilter !== 'all' ? selectedLevelFilter : undefined,
    isOnboarded:
      selectedOnboardedFilter === 'complete'
        ? true
        : selectedOnboardedFilter === 'pending'
        ? false
        : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  // Drawer / Modal states
  const [editingUser, setEditingUser] = React.useState<StudentUser | null>(null);
  const [viewingUser, setViewingUser] = React.useState<StudentUser | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<StudentUser | null>(null);

  // Edit form local state
  const [editForm, setEditForm] = React.useState<UserFormState>({
    name: '',
    departmentId: '',
    level: '100L',
    isOnboarded: false,
  });

  // Row selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  // Copy ID feedback
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const rawUsers = React.useMemo(() => usersData?.items || [], [usersData?.items]);
  const totalCount = usersData?.total || 0;

  // Search Param Updaters
  const updateSearchParams = (params: Partial<UserSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...params,
      }),
    });
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams({ q: value || undefined, page: 1 });
  };

  const handleDeptFilterChange = (departmentId: string) => {
    updateSearchParams({ departmentId: departmentId || undefined, page: 1 });
  };

  const handleLevelFilterChange = (level: UserSearch['level']) => {
    updateSearchParams({ level, page: 1 });
  };

  const handleOnboardedFilterChange = (onboarded: UserSearch['onboarded']) => {
    updateSearchParams({ onboarded, page: 1 });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({
        sortBy: field as UserSearch['sortBy'],
        sortOrder: 'asc',
      });
    }
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page });
  };

  const handlePageSizeChange = (limit: number) => {
    updateSearchParams({ limit, page: 1 });
  };

  // Selection handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (rawUsers.every((u) => selectedIds.has(u._id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rawUsers.forEach((u) => next.delete(u._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rawUsers.forEach((u) => next.add(u._id));
        return next;
      });
    }
  };

  // Delete handlers
  const confirmDeleteSingle = () => {
    if (userToDelete) {
      deleteUser(userToDelete._id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(userToDelete._id);
            return next;
          });
          setUserToDelete(null);
        },
      });
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteUserAsync(id)));
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failedIndices = results
        .map((r, i) => (r.status === 'rejected' ? i : -1))
        .filter((i) => i !== -1);
      const failed = failedIndices.length;

      if (succeeded > 0) {
        toast.success(`Successfully removed ${succeeded} user${succeeded === 1 ? '' : 's'}`);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id, i) => {
            if (results[i].status === 'fulfilled') next.delete(id);
          });
          return next;
        });
      }
      if (failed > 0) {
        const failureNames = failedIndices
          .map((i) => {
            const match = rawUsers.find((u) => u._id === ids[i]);
            return match ? match.name : ids[i];
          })
          .join(', ');
        toast.error(`Failed to remove ${failed} user${failed === 1 ? '' : 's'}: ${failureNames}`);
      }
      setBulkDeleteConfirmOpen(false);
    } catch {
      toast.error('Failed to complete bulk removal');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Edit Drawer Handlers
  const openEditDrawer = (user: StudentUser) => {
    const deptId =
      typeof user.departmentId === 'object' && user.departmentId !== null
        ? user.departmentId._id
        : (user.departmentId as string) || '';

    setEditForm({
      name: user.name,
      departmentId: deptId,
      level: user.level || '100L',
      isOnboarded: !!user.isOnboarded,
    });
    setEditingUser(user);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(
      {
        id: editingUser._id,
        data: {
          name: editForm.name.trim(),
          departmentId: editForm.departmentId || undefined,
          level: editForm.level,
          isOnboarded: editForm.isOnboarded,
        },
      },
      {
        onSuccess: () => {
          setEditingUser(null);
        },
      }
    );
  };

  // Copy Helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Row Actions builder
  const getRowActions = (user: StudentUser): ActionItem[] => {
    return [
      {
        label: 'In-Depth Analytics',
        icon: <TrendingUp size={14} color="var(--color-primary)" />,
        onClick: () => navigate({ to: '/admin/users/$userId', params: { userId: user._id } }),
      },
      {
        label: 'View Dossier',
        icon: <Eye size={14} />,
        onClick: () => setViewingUser(user),
      },
      {
        label: 'Edit Student',
        icon: <Edit2 size={14} />,
        onClick: () => openEditDrawer(user),
      },
      {
        label: 'Remove User',
        icon: <Trash2 size={14} />,
        variant: 'danger',
        onClick: () => setUserToDelete(user),
      },
    ];
  };

  // Helper to determine if user has admin role
  const isUserAdmin = (user: StudentUser) => {
    if (!user.roleIds) return false;
    return user.roleIds.some((r) => (typeof r === 'object' && r !== null ? r.slug === 'admin' || r.slug === 'superadmin' : false));
  };

  // Table Columns
  const columns: Column<StudentUser>[] = [
    {
      header: 'Student User',
      sortable: true,
      sortKey: 'name',
      cell: (user) => {
        const initials = user.name
          ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'U';
        const isAdmin = isUserAdmin(user);

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isAdmin ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-background-soft)',
                border: isAdmin ? '1.5px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--color-border)',
                color: isAdmin ? 'var(--color-primary)' : 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: user._id }}
                  style={{
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-primary)';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                  title={`View in-depth analytics for ${user.name}`}
                >
                  {user.name}
                </Link>
                {isAdmin && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.0625rem 0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Shield size={10} /> ADMIN
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.email}
              >
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Department',
      cell: (user) => {
        const deptName =
          typeof user.departmentId === 'object' && user.departmentId !== null
            ? user.departmentId.name
            : 'Unassigned';

        return (
          <span
            style={{
              fontSize: '0.8125rem',
              color: deptName === 'Unassigned' ? 'var(--color-text-muted)' : 'var(--color-text)',
              fontStyle: deptName === 'Unassigned' ? 'italic' : 'normal',
            }}
          >
            {deptName}
          </span>
        );
      },
    },
    {
      header: 'Academic Level',
      sortable: true,
      sortKey: 'level',
      cell: (user) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.125rem 0.4rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-background-soft)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'monospace',
          }}
        >
          {user.level || '100L'}
        </span>
      ),
    },
    {
      header: 'Courses Enrolled',
      cell: (user) => {
        const count = user.enrolledCourseIds?.length || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: count > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <BookOpen size={11} color="var(--color-text-muted)" />
              {count} {count === 1 ? 'course' : 'courses'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Onboarding',
      sortable: true,
      sortKey: 'onboarded',
      cell: (user) => {
        const isOnboarded = !!user.isOnboarded;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.125rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isOnboarded ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
              border: isOnboarded ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
              color: isOnboarded ? 'var(--color-success, #22c55e)' : 'var(--color-warning, #eab308)',
            }}
          >
            {isOnboarded ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {isOnboarded ? 'Complete' : 'Pending'}
          </span>
        );
      },
    },
    {
      header: 'Joined',
      sortable: true,
      sortKey: 'createdAt',
      align: 'right',
      cell: (user) => {
        const dateStr = user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '-';

        return (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'monospace',
            }}
          >
            {dateStr}
          </span>
        );
      },
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (user) => <RowActions actions={getRowActions(user)} />,
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Students & Users"
        description="Monitor registered accounts, academic department distribution, workload enrollments, and onboarding states."
      />

      {/* Filter and Search Command Bar */}
      <TableFilterBar
        searchValue={querySearch}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search students by name or email..."
        searchWidth="240px"
        extraRight={
          (querySearch || selectedDeptFilter || selectedLevelFilter !== 'all' || selectedOnboardedFilter !== 'all') ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    q: undefined,
                    departmentId: undefined,
                    level: 'all',
                    onboarded: 'all',
                    page: 1,
                  }),
                })
              }
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              <RotateCcw size={12} style={{ marginRight: '0.25rem' }} /> Clear Filters
            </Button>
          ) : undefined
        }
      >
        {/* Department Filter */}
        <select
          aria-label="Filter users by department"
          value={selectedDeptFilter}
          onChange={(e) => handleDeptFilterChange(e.target.value)}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
            minWidth: '160px',
            fontWeight: selectedDeptFilter ? 600 : 400,
          }}
        >
          <option value="">All Departments ({departments.length})</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Level Filter */}
        <select
          aria-label="Filter users by academic level"
          value={selectedLevelFilter}
          onChange={(e) => handleLevelFilterChange(e.target.value as UserSearch['level'])}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
          }}
        >
          <option value="all">All Academic Levels</option>
          <option value="100L">100L (Freshman)</option>
          <option value="200L">200L (Sophomore)</option>
          <option value="300L">300L (Junior)</option>
          <option value="400L">400L (Senior)</option>
        </select>

        {/* Onboarding Filter */}
        <select
          aria-label="Filter users by onboarding status"
          value={selectedOnboardedFilter}
          onChange={(e) => handleOnboardedFilterChange(e.target.value as UserSearch['onboarded'])}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
          }}
        >
          <option value="all">All Onboarding Statuses</option>
          <option value="complete">Onboarding Complete</option>
          <option value="pending">Onboarding Pending</option>
        </select>
      </TableFilterBar>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={rawUsers}
        keyExtractor={(u) => u._id}
        isLoading={isLoadingUsers || isLoadingDepts}
        selectable
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        sortField={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        bulkActions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              disabled={isBulkDeleting}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              <Trash2 size={13} style={{ marginRight: '0.25rem' }} /> Delete Selected ({selectedIds.size})
            </Button>
          </div>
        }
        emptyState={
          <EmptyState
            title="No students match criteria"
            description="Adjust your search query or department/level filters to view registered users."
          />
        }
      />

      {/* VIEW DOSSIER DRAWER */}
      <FormDrawer
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title="Student Profile Dossier"
        description="Comprehensive inspection of account credentials, academic status, and enrolled curriculum."
        width="560px"
      >
        {viewingUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Identity Card */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--color-background-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {viewingUser.name.slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {viewingUser.name}
                  </h3>
                  {isUserAdmin(viewingUser) && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Shield size={11} /> ADMIN ROLE
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  <Mail size={13} />
                  <span>{viewingUser.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>ID: <code>{viewingUser._id}</code></span>
                  <button
                    type="button"
                    aria-label="Copy User ID"
                    onClick={() => copyToClipboard(viewingUser._id, viewingUser._id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copiedId === viewingUser._id ? 'var(--color-success)' : 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Copy User ID"
                  >
                    {copiedId === viewingUser._id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Placement */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Department
                </span>
                <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                  {typeof viewingUser.departmentId === 'object' && viewingUser.departmentId !== null
                    ? viewingUser.departmentId.name
                    : 'Unassigned'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Academic Level
                </span>
                <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                  {viewingUser.level || '100L'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Onboarding
                </span>
                <p style={{ margin: '0.125rem 0 0', fontWeight: 600, fontSize: '0.875rem', color: viewingUser.isOnboarded ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {viewingUser.isOnboarded ? 'Completed' : 'Pending Step'}
                </p>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Enrolled Curriculum ({viewingUser.enrolledCourseIds?.length || 0})
                </span>
              </div>

              {(!viewingUser.enrolledCourseIds || viewingUser.enrolledCourseIds.length === 0) ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-background-soft)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No courses enrolled yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {viewingUser.enrolledCourseIds.map((c: any, idx: number) => {
                    const cId = typeof c === 'object' && c !== null ? c._id : c;
                    const courseObj = typeof c === 'object' && c !== null ? c : courseMap.get(cId);
                    const title = courseObj?.title || 'Unknown Course';
                    const code = courseObj?.code || '';

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <BookOpen size={14} color="var(--color-primary)" />
                          <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{title}</span>
                        </div>
                        {code && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontFamily: 'monospace',
                              padding: '0.0625rem 0.375rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--color-background-soft)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-primary)',
                              fontWeight: 600,
                            }}
                          >
                            {code}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <Button variant="secondary" size="sm" onClick={() => setViewingUser(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const u = viewingUser;
                  setViewingUser(null);
                  openEditDrawer(u);
                }}
              >
                <Edit2 size={13} style={{ marginRight: '0.25rem' }} /> Edit Details
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const uid = viewingUser._id;
                  setViewingUser(null);
                  navigate({ to: '/admin/users/$userId', params: { userId: uid } });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)',
                }}
              >
                <TrendingUp size={13} /> In-Depth Analytics
              </Button>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* EDIT STUDENT DRAWER */}
      <FormDrawer
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Student Account"
        description="Update student name, department affiliation, academic standing level, and onboarding status."
        width="540px"
      >
        {editingUser && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Full Name *"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '0.375rem',
                }}
              >
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background-soft)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <Select
              label="Department"
              value={editForm.departmentId}
              onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: e.target.value }))}
              options={[
                { value: '', label: 'Unassigned / General' },
                ...departments.map((d) => ({
                  value: d._id,
                  label: d.name,
                })),
              ]}
            />

            <Select
              label="Academic Level"
              value={editForm.level}
              onChange={(e) => setEditForm((prev) => ({ ...prev, level: e.target.value as UserFormState['level'] }))}
              options={[
                { value: '100L', label: '100L - Freshman' },
                { value: '200L', label: '200L - Sophomore' },
                { value: '300L', label: '300L - Junior' },
                { value: '400L', label: '400L - Senior' },
                { value: '500L', label: '500L - Final Year / 500L' },
              ]}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-background-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <input
                type="checkbox"
                id="isOnboarded"
                checked={editForm.isOnboarded}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isOnboarded: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isOnboarded" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }}>
                Student has completed onboarding orientation
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <Button variant="secondary" type="button" onClick={() => setEditingUser(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </FormDrawer>

      {/* SINGLE DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Remove Student Account"
        message={
          userToDelete
            ? `Are you sure you want to remove student "${userToDelete.name}" (${userToDelete.email})? This action will remove their account and exam records.`
            : 'Are you sure you want to remove this student?'
        }
        confirmText="Remove Account"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setUserToDelete(null)}
        isPending={isDeleting}
      />

      {/* BULK DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        title="Delete Selected Users"
        message={`Are you sure you want to delete all ${selectedIds.size} selected user accounts? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.size} Accounts`}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        isPending={isBulkDeleting}
      />
    </div>
  );
}
