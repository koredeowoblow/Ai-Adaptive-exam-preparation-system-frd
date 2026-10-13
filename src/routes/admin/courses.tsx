import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useDepartments,
  useTopics,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { CourseForm } from '../../features/admin/components/CourseForm';
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
  BookOpen,
  Building2,
  Calendar,
  Hash,
  FileText,
  AlertTriangle,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  Layers,
  TrendingUp,
} from 'lucide-react';
import type { Course } from '../../types/course.types';
import type { Department } from '../../types/department.types';
import type { Topic } from '../../types/topic.types';
import { toast } from 'sonner';

interface CourseSearch {
  q?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'code' | 'title' | 'department' | 'topicCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/admin/courses')({
  validateSearch: (search: Record<string, unknown>): CourseSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      departmentId:
        typeof search.departmentId === 'string' && search.departmentId
          ? search.departmentId
          : undefined,
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['code', 'title', 'department', 'topicCount', 'createdAt'].includes(
        search.sortBy as string
      )
        ? search.sortBy
        : 'code') as 'code' | 'title' | 'department' | 'topicCount' | 'createdAt',
      sortOrder: (search.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
    };
  },
  component: CoursesAdminRoute,
});

interface CourseWithMeta extends Course {
  departmentName: string;
  topicCount: number;
  topics: Topic[];
}

function CoursesAdminRoute() {
  useDocumentTitle('Courses — Admin Control Center');
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const querySearch = searchParams.q || '';
  const selectedDeptFilter = searchParams.departmentId || '';
  const currentPage = searchParams.page || 1;
  const pageSize = searchParams.limit || 10;
  const sortBy = searchParams.sortBy || 'code';
  const sortOrder = searchParams.sortOrder || 'asc';

  // API Queries & Mutations
  const {
    data: coursesData,
    isLoading: loadingCourses,
    isError: errorCourses,
    refetch: refetchCourses,
  } = useCourses(selectedDeptFilter || undefined);

  const { data: deptData, isLoading: loadingDepts } = useDepartments();
  const { data: topicData, isLoading: loadingTopics } = useTopics();

  const { mutate: createCourse, isPending: isCreating } = useCreateCourse(
    selectedDeptFilter || undefined
  );
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse(
    selectedDeptFilter || undefined
  );
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse(
    selectedDeptFilter || undefined
  );

  // Local UI State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = React.useState<CourseWithMeta | null>(null);

  // Deletion confirm state
  const [courseToDelete, setCourseToDelete] = React.useState<{
    id: string;
    code: string;
    title: string;
    topicCount: number;
  } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);

  // Flat data arrays
  const departments: Department[] = React.useMemo(() => {
    return Array.isArray(deptData) ? deptData : [];
  }, [deptData]);

  const allTopics: Topic[] = React.useMemo(() => {
    return topicData?.pages?.flatMap((p) => p.items) || [];
  }, [topicData]);

  const allCourses: Course[] = React.useMemo(() => {
    return coursesData?.pages?.flatMap((p) => p.items) || [];
  }, [coursesData]);

  // Combine courses with department names and topic counts
  const coursesWithMeta: CourseWithMeta[] = React.useMemo(() => {
    return allCourses.map((course) => {
      const rawDeptId =
        typeof course.departmentId === 'string'
          ? course.departmentId
          : (course.departmentId as unknown as { _id: string; name?: string })?._id;

      const foundDept = departments.find((d) => d._id === rawDeptId);
      const departmentName =
        foundDept?.name ||
        (typeof course.departmentId === 'object' && (course.departmentId as any)?.name) ||
        'Unassigned';

      const linkedTopics = allTopics.filter((t) => {
        const cId =
          typeof t.courseId === 'string'
            ? t.courseId
            : (t.courseId as unknown as { _id: string })?._id;
        return cId === course._id;
      });

      return {
        ...course,
        departmentName,
        topicCount: linkedTopics.length,
        topics: linkedTopics,
      };
    });
  }, [allCourses, departments, allTopics]);

  // Client-side filtering & sorting
  const filteredCourses = React.useMemo(() => {
    let result = [...coursesWithMeta];

    if (querySearch.trim()) {
      const q = querySearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.departmentName.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (selectedDeptFilter) {
      result = result.filter((c) => {
        const rawDeptId =
          typeof c.departmentId === 'string'
            ? c.departmentId
            : (c.departmentId as unknown as { _id: string })?._id;
        return rawDeptId === selectedDeptFilter;
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'code') {
        comparison = a.code.localeCompare(b.code);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'department') {
        comparison = a.departmentName.localeCompare(b.departmentName);
      } else if (sortBy === 'topicCount') {
        comparison = a.topicCount - b.topicCount;
      } else if (sortBy === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [coursesWithMeta, querySearch, selectedDeptFilter, sortBy, sortOrder]);

  // Paginate
  const totalCount = filteredCourses.length;
  const paginatedCourses = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, currentPage, pageSize]);

  // Navigation search params update
  const updateSearchParams = (params: Partial<CourseSearch>) => {
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

  const handleDeptFilterChange = (deptId: string) => {
    updateSearchParams({ departmentId: deptId || undefined, page: 1 });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({
        sortBy: field as 'code' | 'title' | 'department' | 'topicCount' | 'createdAt',
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
    if (paginatedCourses.every((c) => selectedIds.has(c._id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedCourses.forEach((c) => next.delete(c._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedCourses.forEach((c) => next.add(c._id));
        return next;
      });
    }
  };

  // Create submission
  const handleCreateSubmit = (data: any) => {
    createCourse(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  // Edit submission
  const handleEditSubmit = (data: any) => {
    if (editingCourse) {
      updateCourse(
        { id: editingCourse._id, data },
        {
          onSuccess: () => {
            setEditingCourse(null);
            if (viewingCourse && viewingCourse._id === editingCourse._id) {
              setViewingCourse((prev) => (prev ? { ...prev, ...data } : null));
            }
          },
        }
      );
    }
  };

  // Delete handlers
  const handleRequestDelete = (course: CourseWithMeta) => {
    setCourseToDelete({
      id: course._id,
      code: course.code,
      title: course.title,
      topicCount: course.topicCount,
    });
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
      deleteCourse(courseToDelete.id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(courseToDelete.id);
            return next;
          });
          setCourseToDelete(null);
        },
      });
    }
  };

  const handleConfirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    Promise.all(idsToDelete.map((id) => deleteCourse(id)))
      .then(() => {
        toast.success(`Deleted ${idsToDelete.length} course(s)`);
        setSelectedIds(new Set());
        setIsBulkDeleteOpen(false);
      })
      .catch(() => {
        toast.error('Failed to complete some deletions');
      });
  };

  // Existing codes for uniqueness validation
  const existingCodes = React.useMemo(() => {
    return allCourses.map((c) => c.code.toUpperCase());
  }, [allCourses]);

  // Table Columns
  const columns: Column<CourseWithMeta>[] = [
    {
      header: 'Code',
      sortKey: 'code',
      sortable: true,
      width: '110px',
      cell: (course) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.8125rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {course.code}
        </span>
      ),
    },
    {
      header: 'Title',
      sortKey: 'title',
      sortable: true,
      cell: (course) => (
        <Link
          to="/admin/courses/$courseId"
          params={{ courseId: course._id }}
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
          title={`View in-depth analytics for ${course.title}`}
        >
          {course.title}
        </Link>
      ),
    },
    {
      header: 'Department',
      sortKey: 'department',
      sortable: true,
      cell: (course) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {course.departmentName}
        </span>
      ),
    },
    {
      header: 'Topics',
      sortKey: 'topicCount',
      sortable: true,
      width: '110px',
      cell: (course) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor:
              course.topicCount > 0 ? 'var(--color-surface-raised)' : 'var(--color-surface-0)',
            color: course.topicCount > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {course.topicCount} {course.topicCount === 1 ? 'topic' : 'topics'}
        </span>
      ),
    },
    {
      header: 'Created',
      sortKey: 'createdAt',
      sortable: true,
      width: '130px',
      cell: (course) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {course.createdAt
            ? new Date(course.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (course) => {
        const actions: ActionItem[] = [
          {
            label: 'In-Depth Analytics',
            icon: <TrendingUp size={14} color="var(--color-primary)" />,
            onClick: () => navigate({ to: '/admin/courses/$courseId', params: { courseId: course._id } }),
          },
          {
            label: 'View details',
            icon: <Eye size={14} />,
            onClick: () => setViewingCourse(course),
          },
          {
            label: 'Edit course',
            icon: <Edit2 size={14} />,
            onClick: () => setEditingCourse(course),
          },
          {
            label: 'Delete course',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleRequestDelete(course),
          },
        ];
        return <RowActions actions={actions} label={`Actions for ${course.code}`} />;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      {/* ── HEADER ── */}
      <PageHeader
        title="Courses"
        description="Accredited degree courses, curriculum codes, and syllabus definitions."
      >
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Add Course
        </Button>
      </PageHeader>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <TableFilterBar
        searchValue={querySearch}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search code, title, or department..."
        extraRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Total: <strong>{coursesWithMeta.length}</strong>
            </span>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select
            aria-label="Filter courses by department"
            value={selectedDeptFilter}
            onChange={(e) => handleDeptFilterChange(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {(querySearch || selectedDeptFilter) && (
          <button
            type="button"
            onClick={() => updateSearchParams({ q: undefined, departmentId: undefined, page: 1 })}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              textDecoration: 'underline',
            }}
          >
            Reset filters
          </button>
        )}
      </TableFilterBar>

      {/* ── ERROR STATE WITH RETRY ── */}
      {errorCourses && (
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
            <span>Failed to load courses from the server.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCourses()}>
            <RotateCcw size={13} style={{ marginRight: 6 }} /> Retry
          </Button>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <DataTable
        columns={columns}
        data={paginatedCourses}
        isLoading={loadingCourses || loadingDepts || loadingTopics}
        keyExtractor={(c) => c._id}
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
          querySearch || selectedDeptFilter ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No courses match criteria"
              description="No curriculum offerings found matching the selected filters."
              actionLabel="Reset filters"
              onAction={() => updateSearchParams({ q: undefined, departmentId: undefined, page: 1 })}
            />
          ) : (
            <EmptyState
              icon={<BookOpen size={24} />}
              title="No courses created yet"
              description="Add an accredited course code and curriculum under an academic department."
              actionLabel="Add Course"
              onAction={() => setIsCreateOpen(true)}
            />
          )
        }
      />

      {/* ── CREATE DRAWER ── */}
      <FormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Course"
        description="Register a new academic course code under a faculty department."
      >
        <CourseForm
          existingCodes={existingCodes}
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormDrawer>

      {/* ── EDIT DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
        title="Edit Course"
        description="Update course details, department mapping, and syllabus outline."
      >
        {editingCourse && (
          <CourseForm
            existingCodes={existingCodes}
            initialData={{
              departmentId:
                typeof editingCourse.departmentId === 'string'
                  ? editingCourse.departmentId
                  : (editingCourse.departmentId as unknown as { _id: string })?._id,
              code: editingCourse.code,
              title: editingCourse.title,
              description: editingCourse.description,
            }}
            onSubmit={handleEditSubmit}
            isSubmitting={isUpdating}
            onCancel={() => setEditingCourse(null)}
          />
        )}
      </FormDrawer>

      {/* ── VIEW DETAIL DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(viewingCourse)}
        onClose={() => setViewingCourse(null)}
        title={viewingCourse?.title || 'Course Details'}
        description="Curriculum catalog specifications and syllabus module structure"
        width="540px"
      >
        {viewingCourse && (
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
                <BookOpen size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-surface-raised)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {viewingCourse.code}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {viewingCourse.title}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Department: {viewingCourse.departmentName}
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
                  <FileText size={12} /> Syllabus Description
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {viewingCourse.description || 'No syllabus description provided for this course.'}
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
                  <Building2 size={12} /> Academic Faculty
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', fontWeight: 500 }}>
                  {viewingCourse.departmentName}
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
                  <Hash size={12} /> Course ID
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
                  {viewingCourse._id}
                </code>
              </div>

              {viewingCourse.createdAt && (
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
                    {new Date(viewingCourse.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Associated Topics List */}
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
                  <Layers size={14} /> Course Syllabus Topics ({viewingCourse.topics.length})
                </span>
              </div>

              {viewingCourse.topics.length === 0 ? (
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
                  No topics have been added to this course yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {viewingCourse.topics.map((t, idx) => (
                    <div
                      key={t._id}
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
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          #{t.order ?? idx + 1}
                        </span>
                        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                          {t.name}
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
              <Button variant="ghost" size="sm" onClick={() => setViewingCourse(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = viewingCourse;
                  setViewingCourse(null);
                  setEditingCourse(target);
                }}
              >
                <Edit2 size={13} style={{ marginRight: 6 }} /> Edit Course
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const cid = viewingCourse._id;
                  setViewingCourse(null);
                  navigate({ to: '/admin/courses/$courseId', params: { courseId: cid } });
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

      {/* ── DELETE CONFIRM DIALOG (Names item & warns about topics) ── */}
      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        title="Delete Course"
        message={
          courseToDelete
            ? `Are you sure you want to permanently delete course "${courseToDelete.code}: ${
                courseToDelete.title
              }"?${
                courseToDelete.topicCount > 0
                  ? ` This course contains ${courseToDelete.topicCount} linked topic(s) which will also be affected.`
                  : ''
              } This action cannot be undone.`
            : ''
        }
        confirmText="Delete Course"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCourseToDelete(null)}
        isPending={isDeleting}
      />

      {/* ── BULK DELETE CONFIRM DIALOG ── */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Delete Selected Courses"
        message={`Are you sure you want to delete ${selectedIds.size} selected course(s)? This action cannot be undone.`}
        confirmText="Delete Selected"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
        isPending={isDeleting}
      />
    </div>
  );
}
