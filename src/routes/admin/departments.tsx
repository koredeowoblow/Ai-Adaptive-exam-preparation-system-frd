import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useCourses,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { DepartmentForm } from '../../features/admin/components/DepartmentForm';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { RowActions, type ActionItem } from '../../shared/components/RowActions';
import { FormDrawer } from '../../shared/components/FormDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { EmptyState } from '../../shared/components/EmptyState';
import { Button } from '../../shared/components/Button';
import { TableFilterBar } from '../../shared/components/TableFilterBar';
import {
  Plus,
  Search,
  Building2,
  BookOpen,
  Calendar,
  Hash,
  FileText,
  AlertTriangle,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { Department } from '../../types/department.types';
import type { Course } from '../../types/course.types';
import { toast } from 'sonner';

interface DepartmentSearch {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'courseCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/admin/departments')({
  validateSearch: (search: Record<string, unknown>): DepartmentSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['name', 'courseCount', 'createdAt'].includes(search.sortBy as string)
        ? search.sortBy
        : 'name') as 'name' | 'courseCount' | 'createdAt',
      sortOrder: (search.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
    };
  },
  component: DepartmentsAdminRoute,
});

interface DepartmentWithCount extends Department {
  courseCount: number;
  courses: Course[];
}

function DepartmentsAdminRoute() {
  useDocumentTitle('Departments - Admin Control Center');
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const querySearch = searchParams.q || '';
  const currentPage = searchParams.page || 1;
  const pageSize = searchParams.limit || 10;
  const sortBy = searchParams.sortBy || 'name';
  const sortOrder = searchParams.sortOrder || 'asc';

  // API Queries & Mutations
  const {
    data: departmentsData,
    isLoading: loadingDepts,
    isError: errorDepts,
    refetch: refetchDepts,
  } = useDepartments();

  const { data: coursesData, isLoading: loadingCourses } = useCourses();

  const { mutate: createDepartment, isPending: isCreating } = useCreateDepartment();
  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment();

  // Local UI State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = React.useState<DepartmentWithCount | null>(null);

  // Deletion confirm state
  const [departmentToDelete, setDepartmentToDelete] = React.useState<{
    id: string;
    name: string;
    courseCount: number;
  } | null>(null);
  const [blockedDepartment, setBlockedDepartment] = React.useState<{
    name: string;
    courseCount: number;
  } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);

  // Map courses to their respective departments
  const allCourses: Course[] = React.useMemo(() => {
    return coursesData?.pages?.flatMap((p) => p.items) || [];
  }, [coursesData]);

  const rawDepartments: Department[] = React.useMemo(() => {
    return Array.isArray(departmentsData) ? departmentsData : [];
  }, [departmentsData]);

  // Combine departments with calculated course count
  const departmentsWithCounts: DepartmentWithCount[] = React.useMemo(() => {
    return rawDepartments.map((dept) => {
      const linkedCourses = allCourses.filter((course) => {
        const cDeptId =
          typeof course.departmentId === 'string'
            ? course.departmentId
            : (course.departmentId as unknown as { _id: string })?._id;
        return cDeptId === dept._id;
      });
      return {
        ...dept,
        courseCount: linkedCourses.length,
        courses: linkedCourses,
      };
    });
  }, [rawDepartments, allCourses]);

  // Filter and sort
  const filteredDepartments = React.useMemo(() => {
    let result = [...departmentsWithCounts];

    if (querySearch.trim()) {
      const q = querySearch.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'courseCount') {
        comparison = a.courseCount - b.courseCount;
      } else if (sortBy === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [departmentsWithCounts, querySearch, sortBy, sortOrder]);

  // Paginate filtered results
  const totalCount = filteredDepartments.length;
  const paginatedDepartments = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, currentPage, pageSize]);

  // Navigation / Search Params update helper
  const updateSearchParams = (params: Partial<DepartmentSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...params,
      }),
    });
  };

  // Handlers
  const handleSearchChange = (value: string) => {
    updateSearchParams({ q: value || undefined, page: 1 });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({
        sortBy: field as 'name' | 'courseCount' | 'createdAt',
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (paginatedDepartments.every((d) => selectedIds.has(d._id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedDepartments.forEach((d) => next.delete(d._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedDepartments.forEach((d) => next.add(d._id));
        return next;
      });
    }
  };

  // Create submission
  const handleCreateSubmit = (data: { name: string; description?: string }) => {
    createDepartment(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  // Edit submission
  const handleEditSubmit = (data: { name: string; description?: string }) => {
    if (editingDepartment) {
      updateDepartment(
        { id: editingDepartment._id, data },
        {
          onSuccess: () => {
            setEditingDepartment(null);
            // Also refresh viewing if open
            if (viewingDepartment && viewingDepartment._id === editingDepartment._id) {
              setViewingDepartment((prev) => (prev ? { ...prev, ...data } : null));
            }
          },
        }
      );
    }
  };

  // Request deletion with course dependency check
  const handleRequestDelete = (dept: DepartmentWithCount) => {
    if (dept.courseCount > 0) {
      setBlockedDepartment({
        name: dept.name,
        courseCount: dept.courseCount,
      });
    } else {
      setDepartmentToDelete({
        id: dept._id,
        name: dept.name,
        courseCount: 0,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (departmentToDelete) {
      deleteDepartment(departmentToDelete.id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(departmentToDelete.id);
            return next;
          });
          setDepartmentToDelete(null);
        },
      });
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const deletableDepts = departmentsWithCounts.filter(
      (d) => selectedIds.has(d._id) && d.courseCount === 0
    );

    if (deletableDepts.length === 0) {
      toast.error('All selected departments contain linked courses and cannot be deleted.');
      setIsBulkDeleteOpen(false);
      return;
    }

    Promise.all(deletableDepts.map((d) => deleteDepartment(d._id)))
      .then(() => {
        toast.success(`Deleted ${deletableDepts.length} department(s)`);
        setSelectedIds(new Set());
        setIsBulkDeleteOpen(false);
      })
      .catch(() => {
        toast.error('Failed to complete some deletions');
      });
  };

  // Table Columns Definition
  const columns: Column<DepartmentWithCount>[] = [
    {
      header: 'Department Name',
      sortKey: 'name',
      sortable: true,
      cell: (dept) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link
            to="/admin/departments/$deptId"
            params={{ deptId: dept._id }}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            title={`View in-depth analytics for ${dept.name}`}
          >
            {dept.name}
          </Link>
        </div>
      ),
    },
    {
      header: 'Description',
      cell: (dept) => (
        <div
          title={dept.description || undefined}
          style={{
            maxWidth: '340px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
          }}
        >
          {dept.description || '-'}
        </div>
      ),
    },
    {
      header: 'Courses',
      sortKey: 'courseCount',
      sortable: true,
      width: '130px',
      cell: (dept) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor:
                dept.courseCount > 0 ? 'var(--color-surface-raised)' : 'var(--color-surface-0)',
              color: dept.courseCount > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dept.courseCount} {dept.courseCount === 1 ? 'course' : 'courses'}
          </span>
        </div>
      ),
    },
    {
      header: 'Created',
      sortKey: 'createdAt',
      sortable: true,
      width: '140px',
      cell: (dept) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {dept.createdAt
            ? new Date(dept.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-'}
        </span>
      ),
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (dept) => {
        const rowActions: ActionItem[] = [
          {
            label: 'In-Depth Analytics',
            icon: <TrendingUp size={14} color="var(--color-primary)" />,
            onClick: () => navigate({ to: '/admin/departments/$deptId', params: { deptId: dept._id } }),
          },
          {
            label: 'View details',
            icon: <Eye size={14} />,
            onClick: () => setViewingDepartment(dept),
          },
          {
            label: 'Edit department',
            icon: <Edit2 size={14} />,
            onClick: () => setEditingDepartment(dept),
          },
          {
            label: 'Delete department',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleRequestDelete(dept),
          },
        ];
        return <RowActions actions={rowActions} label={`Actions for ${dept.name}`} />;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      {/* ── HEADER ── */}
      <PageHeader
        title="Departments"
        description="Organize institutional faculties, degree tracks, and academic curricula."
      >
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Add Department
        </Button>
      </PageHeader>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <TableFilterBar
        searchValue={querySearch}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or description..."
        searchWidth="320px"
        extraRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              Total: <strong>{departmentsWithCounts.length}</strong>
            </span>
          </div>
        }
      />

      {/* ── ERROR STATE WITH RETRY ── */}
      {errorDepts && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>Failed to load departments from the server.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchDepts()}>
            <RotateCcw size={13} style={{ marginRight: 6 }} /> Retry
          </Button>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <DataTable
        columns={columns}
        data={paginatedDepartments}
        isLoading={loadingDepts || loadingCourses}
        keyExtractor={(d) => d._id}
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsBulkDeleteOpen(true)}
            style={{ fontSize: '0.75rem', height: '26px', padding: '0 8px' }}
          >
            Delete Selected
          </Button>
        }
        emptyState={
          querySearch ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No departments match your filter"
              description={`No departments found matching "${querySearch}".`}
              actionLabel="Clear filter"
              onAction={() => handleSearchChange('')}
            />
          ) : (
            <EmptyState
              icon={<Building2 size={24} />}
              title="No departments created yet"
              description="Create your first academic faculty to host courses and syllabi."
              actionLabel="Add Department"
              onAction={() => setIsCreateOpen(true)}
            />
          )
        }
      />

      {/* ── CREATE DRAWER ── */}
      <FormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Department"
        description="Establish a new academic faculty or operational division."
      >
        <DepartmentForm
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormDrawer>

      {/* ── EDIT DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(editingDepartment)}
        onClose={() => setEditingDepartment(null)}
        title="Edit Department"
        description="Update department title, curriculum focus, or description."
      >
        {editingDepartment && (
          <DepartmentForm
            initialData={{
              name: editingDepartment.name,
              description: editingDepartment.description,
            }}
            onSubmit={handleEditSubmit}
            isSubmitting={isUpdating}
            onCancel={() => setEditingDepartment(null)}
          />
        )}
      </FormDrawer>

      {/* ── VIEW DETAIL DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(viewingDepartment)}
        onClose={() => setViewingDepartment(null)}
        title={viewingDepartment?.name || 'Department Details'}
        description="Faculty metadata and associated curriculum offerings"
        width="520px"
      >
        {viewingDepartment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
            {/* Summary card */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {viewingDepartment.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {viewingDepartment.courseCount} accredited{' '}
                  {viewingDepartment.courseCount === 1 ? 'course' : 'courses'}
                </span>
              </div>
            </div>

            {/* Field breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <FileText size={12} /> Description
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {viewingDepartment.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <Hash size={12} /> Department ID
                </span>
                <code
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {viewingDepartment._id}
                </code>
              </div>

              {viewingDepartment.createdAt && (
                <div>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    <Calendar size={12} /> Created Date
                  </span>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                    {new Date(viewingDepartment.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Associated Courses List */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  <BookOpen size={14} /> Associated Courses ({viewingDepartment.courses.length})
                </span>
              </div>

              {viewingDepartment.courses.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-surface-0)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--color-border)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No courses are currently assigned to this department.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {viewingDepartment.courses.map((course) => (
                    <div
                      key={course._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-0)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--color-surface-raised)',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {course.code}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                          {course.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions footer inside view drawer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                marginTop: 'auto',
              }}
            >
              <Button variant="ghost" size="sm" onClick={() => setViewingDepartment(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = viewingDepartment;
                  setViewingDepartment(null);
                  setEditingDepartment(target);
                }}
              >
                <Edit2 size={13} style={{ marginRight: 6 }} /> Edit Department
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const did = viewingDepartment._id;
                  setViewingDepartment(null);
                  navigate({ to: '/admin/departments/$deptId', params: { deptId: did } });
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

      {/* ── DELETE CONFIRM DIALOG (Names item) ── */}
      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete Department"
        message={
          departmentToDelete
            ? `Are you sure you want to permanently delete "${departmentToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Department"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDepartmentToDelete(null)}
        isPending={isDeleting}
      />

      {/* ── BLOCKED DELETE DIALOG (Protected when department contains courses) ── */}
      <ConfirmDialog
        isOpen={Boolean(blockedDepartment)}
        title="Cannot Delete Department"
        message={
          blockedDepartment
            ? `"${blockedDepartment.name}" currently contains ${blockedDepartment.courseCount} linked ${
                blockedDepartment.courseCount === 1 ? 'course' : 'courses'
              }. To maintain curriculum integrity, reassign or delete these courses first before deleting this department.`
            : ''
        }
        confirmText="Understood"
        cancelText="Close"
        onConfirm={() => setBlockedDepartment(null)}
        onCancel={() => setBlockedDepartment(null)}
        isPending={false}
      />

      {/* ── BULK DELETE CONFIRM DIALOG ── */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Delete Selected Departments"
        message={`Are you sure you want to delete ${selectedIds.size} selected department(s)? Only departments without any linked courses will be removed.`}
        confirmText="Proceed"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
        isPending={isDeleting}
      />
    </div>
  );
}
