import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useTopics,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  useCourses,
  useQuestions,
} from '../../features/admin/hooks/useAdmin';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { TopicForm } from '../../features/admin/components/TopicForm';
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
  Layers,
  BookOpen,
  Calendar,
  Hash,
  ListOrdered,
  AlertTriangle,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import type { Topic } from '../../types/topic.types';
import type { Course } from '../../types/course.types';
import type { Question } from '../../types/question.types';
import { toast } from 'sonner';

interface TopicSearch {
  q?: string;
  courseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'order' | 'name' | 'course' | 'questionCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/admin/topics')({
  validateSearch: (search: Record<string, unknown>): TopicSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      courseId:
        typeof search.courseId === 'string' && search.courseId ? search.courseId : undefined,
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['order', 'name', 'course', 'questionCount', 'createdAt'].includes(
        search.sortBy as string
      )
        ? search.sortBy
        : 'order') as 'order' | 'name' | 'course' | 'questionCount' | 'createdAt',
      sortOrder: (search.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
    };
  },
  component: TopicsAdminRoute,
});

interface TopicWithMeta extends Topic {
  courseCode: string;
  courseTitle: string;
  questionCount: number;
}

function TopicsAdminRoute() {
  useDocumentTitle('Topics - Admin Control Center');
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const querySearch = searchParams.q || '';
  const selectedCourseFilter = searchParams.courseId || '';
  const currentPage = searchParams.page || 1;
  const pageSize = searchParams.limit || 10;
  const sortBy = searchParams.sortBy || 'order';
  const sortOrder = searchParams.sortOrder || 'asc';

  // API Queries & Mutations
  const {
    data: topicsData,
    isLoading: loadingTopics,
    isError: errorTopics,
    refetch: refetchTopics,
  } = useTopics(selectedCourseFilter || undefined);

  const { data: coursesData, isLoading: loadingCourses } = useCourses();
  const { data: questionsData, isLoading: loadingQuestions } = useQuestions();

  const { mutate: createTopic, isPending: isCreating } = useCreateTopic(
    selectedCourseFilter || undefined
  );
  const { mutate: updateTopic, isPending: isUpdating } = useUpdateTopic(
    selectedCourseFilter || undefined
  );
  const { mutate: deleteTopic, isPending: isDeleting } = useDeleteTopic(
    selectedCourseFilter || undefined
  );

  // Local UI State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null);
  const [viewingTopic, setViewingTopic] = React.useState<TopicWithMeta | null>(null);

  // Deletion confirm state
  const [topicToDelete, setTopicToDelete] = React.useState<{
    id: string;
    name: string;
    courseTitle: string;
    questionCount: number;
  } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);

  // Flattened data lists
  const allCourses: Course[] = React.useMemo(() => {
    return coursesData?.pages?.flatMap((p) => p.items) || [];
  }, [coursesData]);

  const allTopics: Topic[] = React.useMemo(() => {
    return topicsData?.pages?.flatMap((p) => p.items) || [];
  }, [topicsData]);

  const allQuestions: Question[] = React.useMemo(() => {
    return questionsData?.items || [];
  }, [questionsData]);

  // Combine topics with course title & code and question count
  const topicsWithMeta: TopicWithMeta[] = React.useMemo(() => {
    return allTopics.map((topic) => {
      const rawCourseId =
        typeof topic.courseId === 'string'
          ? topic.courseId
          : (topic.courseId as unknown as { _id: string; code?: string; title?: string })?._id;

      const foundCourse = allCourses.find((c) => c._id === rawCourseId);
      const courseCode =
        foundCourse?.code ||
        (typeof topic.courseId === 'object' && (topic.courseId as any)?.code) ||
        '';
      const courseTitle =
        foundCourse?.title ||
        (typeof topic.courseId === 'object' && (topic.courseId as any)?.title) ||
        'Unassigned';

      const linkedQuestions = allQuestions.filter((q) => {
        const qTopicId =
          typeof q.topicId === 'string'
            ? q.topicId
            : (q.topicId as unknown as { _id: string })?._id;
        return qTopicId === topic._id;
      });

      return {
        ...topic,
        courseCode,
        courseTitle,
        questionCount: linkedQuestions.length,
      };
    });
  }, [allTopics, allCourses, allQuestions]);

  // Filter and sort
  const filteredTopics = React.useMemo(() => {
    let result = [...topicsWithMeta];

    if (querySearch.trim()) {
      const q = querySearch.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.courseCode.toLowerCase().includes(q) ||
          t.courseTitle.toLowerCase().includes(q)
      );
    }

    if (selectedCourseFilter) {
      result = result.filter((t) => {
        const rawCourseId =
          typeof t.courseId === 'string'
            ? t.courseId
            : (t.courseId as unknown as { _id: string })?._id;
        return rawCourseId === selectedCourseFilter;
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'order') {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        comparison = orderA - orderB;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'course') {
        comparison = a.courseTitle.localeCompare(b.courseTitle);
      } else if (sortBy === 'questionCount') {
        comparison = a.questionCount - b.questionCount;
      } else if (sortBy === 'createdAt') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [topicsWithMeta, querySearch, selectedCourseFilter, sortBy, sortOrder]);

  // Paginate
  const totalCount = filteredTopics.length;
  const paginatedTopics = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTopics.slice(start, start + pageSize);
  }, [filteredTopics, currentPage, pageSize]);

  // Update navigation search params
  const updateSearchParams = (params: Partial<TopicSearch>) => {
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

  const handleCourseFilterChange = (courseId: string) => {
    updateSearchParams({ courseId: courseId || undefined, page: 1 });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({
        sortBy: field as 'order' | 'name' | 'course' | 'questionCount' | 'createdAt',
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
    if (paginatedTopics.every((t) => selectedIds.has(t._id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedTopics.forEach((t) => next.delete(t._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedTopics.forEach((t) => next.add(t._id));
        return next;
      });
    }
  };

  // Reorder topics within the same course
  const handleMoveOrder = (topic: TopicWithMeta, direction: 'up' | 'down') => {
    const rawCourseId =
      typeof topic.courseId === 'string'
        ? topic.courseId
        : (topic.courseId as unknown as { _id: string })?._id;

    const courseSiblings = topicsWithMeta
      .filter((t) => {
        const cId =
          typeof t.courseId === 'string'
            ? t.courseId
            : (t.courseId as unknown as { _id: string })?._id;
        return cId === rawCourseId;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const currentIndex = courseSiblings.findIndex((t) => t._id === topic._id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= courseSiblings.length) {
      toast.info(
        direction === 'up' ? 'Topic is already at the top' : 'Topic is already at the bottom'
      );
      return;
    }

    const targetSibling = courseSiblings[targetIndex];
    const currentOrder = topic.order ?? currentIndex + 1;
    const targetOrder = targetSibling.order ?? targetIndex + 1;

    // Swap orders
    updateTopic({ id: topic._id, data: { order: targetOrder } });
    updateTopic({ id: targetSibling._id, data: { order: currentOrder } });
    toast.success(`Moved topic ${direction === 'up' ? 'up' : 'down'}`);
  };

  // Create submission
  const handleCreateSubmit = (data: any) => {
    createTopic(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  // Edit submission
  const handleEditSubmit = (data: any) => {
    if (editingTopic) {
      updateTopic(
        { id: editingTopic._id, data },
        {
          onSuccess: () => {
            setEditingTopic(null);
            if (viewingTopic && viewingTopic._id === editingTopic._id) {
              setViewingTopic((prev) => (prev ? { ...prev, ...data } : null));
            }
          },
        }
      );
    }
  };

  // Delete handlers
  const handleRequestDelete = (topic: TopicWithMeta) => {
    setTopicToDelete({
      id: topic._id,
      name: topic.name,
      courseTitle: topic.courseTitle,
      questionCount: topic.questionCount,
    });
  };

  const handleConfirmDelete = () => {
    if (topicToDelete) {
      deleteTopic(topicToDelete.id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(topicToDelete.id);
            return next;
          });
          setTopicToDelete(null);
        },
      });
    }
  };

  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    Promise.all(ids.map((id) => deleteTopic(id)))
      .then(() => {
        toast.success(`Deleted ${ids.length} topic(s)`);
        setSelectedIds(new Set());
        setIsBulkDeleteOpen(false);
      })
      .catch(() => {
        toast.error('Failed to complete some deletions');
      });
  };

  // Columns definition
  const columns: Column<TopicWithMeta>[] = [
    {
      header: 'Order',
      sortKey: 'order',
      sortable: true,
      width: '100px',
      cell: (topic) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              minWidth: '22px',
            }}
          >
            #{topic.order ?? '-'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              type="button"
              aria-label="Move topic up"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveOrder(topic, 'up');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '1px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                lineHeight: 1,
                display: 'flex',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <ArrowUp size={11} />
            </button>
            <button
              type="button"
              aria-label="Move topic down"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveOrder(topic, 'down');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '1px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                lineHeight: 1,
                display: 'flex',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <ArrowDown size={11} />
            </button>
          </div>
        </div>
      ),
    },
    {
      header: 'Topic Name',
      sortKey: 'name',
      sortable: true,
      cell: (topic) => (
        <Link
          to="/admin/topics/$topicId"
          params={{ topicId: topic._id }}
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
          title={`View in-depth analytics for ${topic.name}`}
        >
          {topic.name}
        </Link>
      ),
    },
    {
      header: 'Course',
      sortKey: 'course',
      sortable: true,
      cell: (topic) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {topic.courseCode && (
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
              }}
            >
              {topic.courseCode}
            </span>
          )}
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {topic.courseTitle}
          </span>
        </div>
      ),
    },
    {
      header: 'Questions',
      sortKey: 'questionCount',
      sortable: true,
      width: '120px',
      cell: (topic) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor:
              topic.questionCount > 0 ? 'var(--color-surface-raised)' : 'var(--color-surface-0)',
            color: topic.questionCount > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {topic.questionCount} {topic.questionCount === 1 ? 'item' : 'items'}
        </span>
      ),
    },
    {
      header: 'Created',
      sortKey: 'createdAt',
      sortable: true,
      width: '130px',
      cell: (topic) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          {topic.createdAt
            ? new Date(topic.createdAt).toLocaleDateString(undefined, {
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
      cell: (topic) => {
        const actions: ActionItem[] = [
          {
            label: 'In-Depth Analytics',
            icon: <TrendingUp size={14} color="var(--color-primary)" />,
            onClick: () => navigate({ to: '/admin/topics/$topicId', params: { topicId: topic._id } }),
          },
          {
            label: 'View details',
            icon: <Eye size={14} />,
            onClick: () => setViewingTopic(topic),
          },
          {
            label: 'Move Up (#)',
            icon: <ArrowUp size={14} />,
            onClick: () => handleMoveOrder(topic, 'up'),
          },
          {
            label: 'Move Down (#)',
            icon: <ArrowDown size={14} />,
            onClick: () => handleMoveOrder(topic, 'down'),
          },
          {
            label: 'Edit topic',
            icon: <Edit2 size={14} />,
            onClick: () => setEditingTopic(topic),
          },
          {
            label: 'Delete topic',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: () => handleRequestDelete(topic),
          },
        ];
        return <RowActions actions={actions} label={`Actions for ${topic.name}`} />;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      {/* ── HEADER ── */}
      <PageHeader
        title="Topics"
        description="Curriculum syllabus chapters, module sequences, and learning objectives."
      >
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Add Topic
        </Button>
      </PageHeader>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <TableFilterBar
        searchValue={querySearch}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search topic or course..."
        extraRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Total: <strong>{topicsWithMeta.length}</strong>
            </span>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select
            aria-label="Filter topics by course"
            value={selectedCourseFilter}
            onChange={(e) => handleCourseFilterChange(e.target.value)}
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
            <option value="">All Courses</option>
            {allCourses.map((c) => (
              <option key={c._id} value={c._id}>
                [{c.code}] {c.title}
              </option>
            ))}
          </select>
        </div>

        {(querySearch || selectedCourseFilter) && (
          <button
            type="button"
            onClick={() => updateSearchParams({ q: undefined, courseId: undefined, page: 1 })}
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
      {errorTopics && (
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
            <span>Failed to load topics from the server.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchTopics()}>
            <RotateCcw size={13} style={{ marginRight: 6 }} /> Retry
          </Button>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <DataTable
        columns={columns}
        data={paginatedTopics}
        isLoading={loadingTopics || loadingCourses || loadingQuestions}
        keyExtractor={(t) => t._id}
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
          querySearch || selectedCourseFilter ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No topics match criteria"
              description="No syllabus modules found matching the selected filters."
              actionLabel="Reset filters"
              onAction={() => updateSearchParams({ q: undefined, courseId: undefined, page: 1 })}
            />
          ) : (
            <EmptyState
              icon={<Layers size={24} />}
              title="No syllabus topics created yet"
              description="Add a learning module to outline the syllabus under a course."
              actionLabel="Add Topic"
              onAction={() => setIsCreateOpen(true)}
            />
          )
        }
      />

      {/* ── CREATE DRAWER ── */}
      <FormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Topic"
        description="Establish a new syllabus chapter or module under a course."
      >
        <TopicForm
          courses={allCourses}
          existingTopics={allTopics}
          defaultCourseId={selectedCourseFilter}
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormDrawer>

      {/* ── EDIT DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(editingTopic)}
        onClose={() => setEditingTopic(null)}
        title="Edit Topic"
        description="Update topic name, course assignment, or sequence order."
      >
        {editingTopic && (
          <TopicForm
            courses={allCourses}
            existingTopics={allTopics}
            initialData={{
              _id: editingTopic._id,
              name: editingTopic.name,
              courseId:
                typeof editingTopic.courseId === 'string'
                  ? editingTopic.courseId
                  : (editingTopic.courseId as unknown as { _id: string })?._id,
              order: editingTopic.order,
            }}
            onSubmit={handleEditSubmit}
            isSubmitting={isUpdating}
            onCancel={() => setEditingTopic(null)}
          />
        )}
      </FormDrawer>

      {/* ── VIEW DETAIL DRAWER ── */}
      <FormDrawer
        isOpen={Boolean(viewingTopic)}
        onClose={() => setViewingTopic(null)}
        title={viewingTopic?.name || 'Topic Details'}
        description="Syllabus chapter details, sequence position, and calibrated items"
        width="520px"
      >
        {viewingTopic && (
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
                <Layers size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Module #{viewingTopic.order ?? '1'}
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
                    {viewingTopic.name}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Course: [{viewingTopic.courseCode}] {viewingTopic.courseTitle}
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
                  <BookOpen size={12} /> Assigned Course
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', fontWeight: 500 }}>
                  [{viewingTopic.courseCode}] {viewingTopic.courseTitle}
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
                  <ListOrdered size={12} /> Sequence Position
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
                  Module #{viewingTopic.order ?? 'Default position'}
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
                  <HelpCircle size={12} /> Question Bank Items
                </span>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {viewingTopic.questionCount} calibrated items linked
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
                  <Hash size={12} /> Topic ID
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
                  {viewingTopic._id}
                </code>
              </div>

              {viewingTopic.createdAt && (
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
                    {new Date(viewingTopic.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Actions footer */}
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
              <Button variant="ghost" size="sm" onClick={() => setViewingTopic(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = viewingTopic;
                  setViewingTopic(null);
                  setEditingTopic(target);
                }}
              >
                <Edit2 size={13} style={{ marginRight: 6 }} /> Edit Topic
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const tid = viewingTopic._id;
                  setViewingTopic(null);
                  navigate({ to: '/admin/topics/$topicId', params: { topicId: tid } });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                }}
              >
                <TrendingUp size={13} /> In-Depth Analytics
              </Button>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* ── DELETE CONFIRM DIALOG ── */}
      <ConfirmDialog
        isOpen={Boolean(topicToDelete)}
        title="Delete Topic"
        message={
          topicToDelete
            ? `Are you sure you want to permanently delete topic "${topicToDelete.name}" from course "${
                topicToDelete.courseTitle
              }"?${
                topicToDelete.questionCount > 0
                  ? ` This topic has ${topicToDelete.questionCount} question(s) associated with it.`
                  : ''
              } This action cannot be undone.`
            : ''
        }
        confirmText="Delete Topic"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTopicToDelete(null)}
        isPending={isDeleting}
      />

      {/* ── BULK DELETE CONFIRM DIALOG ── */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Delete Selected Topics"
        message={`Are you sure you want to delete ${selectedIds.size} selected topic(s)? This action cannot be undone.`}
        confirmText="Delete Selected"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
        isPending={isDeleting}
      />
    </div>
  );
}
