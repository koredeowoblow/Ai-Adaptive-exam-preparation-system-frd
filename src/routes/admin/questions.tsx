import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useQuestions,
  useCreateQuestion,
  useBulkCreateQuestions,
  useUpdateQuestion,
  useDeleteQuestion,
  useTopics,
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
import { QuestionForm } from '../../features/admin/components/QuestionForm';
import { QuestionBulkImportModal } from '../../features/admin/components/QuestionBulkImportModal';
import { FormattedMathText, stripMathDelimiters } from '../../shared/components/FormattedMathText';
import {
  Plus,
  Search,
  FileUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Star,
  Hash,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import type { Question } from '../../types/question.types';
import type { Course } from '../../types/course.types';
import type { Topic } from '../../types/topic.types';
import type { CreateQuestionDTO } from '../../types';
import { toast } from 'sonner';

/**
 * Strips [Variant 12] or similar suffix from seed data question text.
 */
export function cleanQuestionPrompt(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\[Variant\s+\d+\]\s*$/i, '').trim();
}

/**
 * Extracts [Variant 12] tag if present.
 */
export function getVariantTag(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\[Variant\s+(\d+)\]/i);
  return match ? match[0] : null;
}

interface QuestionSearch {
  q?: string;
  courseId?: string; // Course filter
  topicId?: string;
  type?: 'all' | 'MULTIPLE_CHOICE' | 'THEORY';
  difficulty?: 'all' | 'easy' | 'medium' | 'hard';
  status?: 'all' | 'complete' | 'incomplete';
  page?: number;
  limit?: number;
  sortBy?: 'prompt' | 'course' | 'topic' | 'difficulty' | 'elo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/admin/questions')({
  validateSearch: (search: Record<string, unknown>): QuestionSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      courseId: typeof search.courseId === 'string' && search.courseId ? search.courseId : undefined,
      topicId: typeof search.topicId === 'string' && search.topicId ? search.topicId : undefined,
      type: (['all', 'MULTIPLE_CHOICE', 'THEORY'].includes(search.type as string)
        ? search.type
        : 'all') as 'all' | 'MULTIPLE_CHOICE' | 'THEORY',
      difficulty: (['all', 'easy', 'medium', 'hard'].includes(search.difficulty as string)
        ? search.difficulty
        : 'all') as 'all' | 'easy' | 'medium' | 'hard',
      status: (['all', 'complete', 'incomplete'].includes(search.status as string)
        ? search.status
        : 'all') as 'all' | 'complete' | 'incomplete',
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['prompt', 'course', 'topic', 'difficulty', 'elo', 'createdAt'].includes(search.sortBy as string)
        ? search.sortBy
        : 'createdAt') as 'prompt' | 'course' | 'topic' | 'difficulty' | 'elo' | 'createdAt',
      sortOrder: search.sortOrder === 'asc' ? 'asc' : 'desc',
    };
  },
  component: QuestionsAdminRoute,
});

interface EnrichedQuestion extends Question {
  cleanPrompt: string;
  variantTag: string | null;
  topicName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  isMissingOptions: boolean;
  difficultyValue: number;
}

function QuestionsAdminRoute() {
  useDocumentTitle('Admin: Questions');
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const querySearch = searchParams.q ?? '';
  const selectedCourseFilter = searchParams.courseId ?? '';
  const selectedTopicFilter = searchParams.topicId ?? '';
  const selectedTypeFilter = searchParams.type ?? 'all';
  const selectedDifficultyFilter = searchParams.difficulty ?? 'all';
  const selectedStatusFilter = searchParams.status ?? 'all';
  const currentPage = searchParams.page ?? 1;
  const pageSize = searchParams.limit ?? 10;
  const sortBy = searchParams.sortBy ?? 'createdAt';
  const sortOrder = searchParams.sortOrder ?? 'desc';

  // API Queries & Mutations (Server-side pagination and filters)
  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
  } = useQuestions({
    q: querySearch || undefined,
    courseId: selectedCourseFilter || undefined,
    topicId: selectedTopicFilter || undefined,
    type: selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined,
    difficulty: selectedDifficultyFilter !== 'all' ? selectedDifficultyFilter : undefined,
    status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    hasNextPage: hasNextTopics,
    fetchNextPage: fetchNextTopics,
    isFetchingNextPage: isFetchingNextTopics,
  } = useTopics();

  const topics: Topic[] = React.useMemo(() => {
    if (!topicsData?.pages) return [];
    return topicsData.pages
      .flatMap((page: any) => (Array.isArray(page) ? page : page?.items || []))
      .filter((t: any): t is Topic => Boolean(t && t._id));
  }, [topicsData]);

  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    hasNextPage: hasNextCourses,
    fetchNextPage: fetchNextCourses,
    isFetchingNextPage: isFetchingNextCourses,
  } = useCourses();
  const courses: Course[] = React.useMemo(() => {
    if (!coursesData?.pages) return [];
    return coursesData.pages
      .flatMap((page: any) => (Array.isArray(page) ? page : page?.items || []))
      .filter((c: any): c is Course => Boolean(c && c._id));
  }, [coursesData]);

  React.useEffect(() => {
    if (hasNextTopics && !isFetchingNextTopics) {
      fetchNextTopics();
    }
  }, [hasNextTopics, isFetchingNextTopics, fetchNextTopics]);

  React.useEffect(() => {
    if (hasNextCourses && !isFetchingNextCourses) {
      fetchNextCourses();
    }
  }, [hasNextCourses, isFetchingNextCourses, fetchNextCourses]);

  const courseMap = React.useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c._id, c));
    return map;
  }, [courses]);

  const topicMap = React.useMemo(() => {
    const map = new Map<string, Topic>();
    topics.forEach((t) => map.set(t._id, t));
    return map;
  }, [topics]);

  // Topics filtered dynamically by currently selected course
  const availableTopics = React.useMemo(() => {
    if (!selectedCourseFilter) return topics;
    return topics.filter((t) => {
      const cId = typeof t.courseId === 'object' && t.courseId !== null ? (t.courseId as any)._id : t.courseId;
      return cId === selectedCourseFilter;
    });
  }, [topics, selectedCourseFilter]);

  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  const { mutate: bulkCreateQuestions, isPending: isBulkImporting } = useBulkCreateQuestions();
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const { mutate: deleteQuestion, mutateAsync: deleteQuestionAsync, isPending: isDeleting } = useDeleteQuestion({
    q: querySearch || undefined,
    courseId: selectedCourseFilter || undefined,
    topicId: selectedTopicFilter || undefined,
    type: selectedTypeFilter !== 'all' ? selectedTypeFilter : undefined,
    difficulty: selectedDifficultyFilter !== 'all' ? selectedDifficultyFilter : undefined,
    status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  // Modal / Drawer states
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = React.useState<EnrichedQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = React.useState<EnrichedQuestion | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = React.useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);

  // Raw questions and total count from backend response
  const rawQuestions = React.useMemo(() => questionsData?.items || [], [questionsData?.items]);
  const totalCount = questionsData?.total || 0;

  // Enrich questions with Topic & Course details
  const enrichedQuestions: EnrichedQuestion[] = React.useMemo(() => {
    return rawQuestions.map((q) => {
      const cleanPrompt = cleanQuestionPrompt(q.questionText);
      const variantTag = getVariantTag(q.questionText);
      const topicObjFromPopulate = typeof q.topicId === 'object' && q.topicId !== null ? (q.topicId as any) : undefined;
      const topicIdStr = topicObjFromPopulate?._id || (typeof q.topicId === 'string' ? q.topicId : '');
      const topicObjFromMap = topicMap.get(topicIdStr);

      const topicName = topicObjFromPopulate?.name || topicObjFromMap?.name || (isLoadingTopics ? 'Loading...' : 'Unassigned Topic');

      const courseFromPopulate = topicObjFromPopulate?.courseId;
      const courseIdStr = typeof courseFromPopulate === 'object' && courseFromPopulate !== null
        ? courseFromPopulate._id
        : (courseFromPopulate || (typeof topicObjFromMap?.courseId === 'object' ? (topicObjFromMap.courseId as any)._id : topicObjFromMap?.courseId) || '');

      const courseObj = courseIdStr ? courseMap.get(courseIdStr) : undefined;
      const courseName = (typeof courseFromPopulate === 'object' && courseFromPopulate?.title)
        || courseObj?.title
        || 'General / Unassigned';
      const courseCode = (typeof courseFromPopulate === 'object' && courseFromPopulate?.code)
        || courseObj?.code
        || '';

      const isMissingOptions = q.type !== 'THEORY' && (!q.options || q.options.length < 2);
      const difficultyValue = q.difficulty || 5;

      return {
        ...q,
        cleanPrompt,
        variantTag,
        topicName,
        courseId: courseIdStr,
        courseName,
        courseCode,
        isMissingOptions,
        difficultyValue,
      };
    });
  }, [rawQuestions, topicMap, courseMap, isLoadingTopics]);

  // Paginated questions is directly enrichedQuestions since backend handles pagination and filtering
  const paginatedQuestions = enrichedQuestions;

  // Search Param Updaters
  const updateSearchParams = (params: Partial<QuestionSearch>) => {
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

  const handleDifficultyFilterChange = (diff: QuestionSearch['difficulty']) => {
    updateSearchParams({ difficulty: diff, page: 1 });
  };

  const handleStatusFilterChange = (status: QuestionSearch['status']) => {
    updateSearchParams({ status, page: 1 });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      updateSearchParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSearchParams({
        sortBy: field as 'prompt' | 'course' | 'topic' | 'difficulty' | 'elo' | 'createdAt',
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
    if (paginatedQuestions.every((q) => selectedIds.has(q._id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedQuestions.forEach((q) => next.delete(q._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedQuestions.forEach((q) => next.add(q._id));
        return next;
      });
    }
  };

  // Create & Edit Handlers
  const handleCreateSubmit = (data: CreateQuestionDTO) => {
    createQuestion(data, {
      onSuccess: () => {
        setIsCreateDrawerOpen(false);
      },
    });
  };

  const handleEditSubmit = (data: CreateQuestionDTO) => {
    if (editingQuestion) {
      updateQuestion(
        { id: editingQuestion._id, data },
        {
          onSuccess: () => {
            setEditingQuestion(null);
          },
        }
      );
    }
  };

  // Delete Handlers
  const handleDeleteSingle = (question: EnrichedQuestion) => {
    setQuestionToDelete(question);
  };

  const confirmDeleteSingle = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete._id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(questionToDelete._id);
            return next;
          });
          setQuestionToDelete(null);
        },
      });
    }
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.allSettled(ids.map((id) => deleteQuestionAsync(id)));
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failedIndices = results
        .map((r, i) => (r.status === 'rejected' ? i : -1))
        .filter((i) => i !== -1);
      const failed = failedIndices.length;

      if (succeeded > 0) {
        toast.success(`Successfully deleted ${succeeded} question${succeeded === 1 ? '' : 's'}`);
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
            const match = rawQuestions.find((q) => q._id === ids[i]);
            return match ? (stripMathDelimiters(match.questionText) || ids[i]).slice(0, 25) : ids[i];
          })
          .join(', ');
        toast.error(`Failed to delete ${failed} question${failed === 1 ? '' : 's'}: ${failureNames}`);
      }
      setBulkDeleteConfirmOpen(false);
    } catch {
      toast.error('Failed to complete bulk deletion');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk Import
  const handleBulkImport = (questions: CreateQuestionDTO[]) => {
    bulkCreateQuestions(questions, {
      onSuccess: () => {
        setIsBulkImportOpen(false);
      },
    });
  };

  // Row Actions builder
  const getRowActions = (q: EnrichedQuestion): ActionItem[] => {
    return [
      {
        label: 'View Details',
        icon: <Eye size={14} />,
        onClick: () => setViewingQuestion(q),
      },
      {
        label: 'Edit Question',
        icon: <Edit2 size={14} />,
        onClick: () => setEditingQuestion(q),
      },
      {
        label: 'Delete',
        icon: <Trash2 size={14} />,
        variant: 'danger',
        onClick: () => handleDeleteSingle(q),
      },
    ];
  };

  // Difficulty badge styling
  const renderDifficultyBadge = (diff: number) => {
    let color = 'var(--color-success, #22c55e)';
    let label = 'Easy';
    if (diff >= 8) {
      color = 'var(--color-danger, #ef4444)';
      label = 'Hard';
    } else if (diff >= 4) {
      color = 'var(--color-warning, #eab308)';
      label = 'Medium';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.125rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-background-soft)',
          border: '1px solid var(--color-border)',
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <Star size={11} fill="currentColor" /> {diff}/10 · {label}
      </span>
    );
  };

  // Table Columns Definition
  const columns: Column<EnrichedQuestion>[] = [
    {
      header: 'Question Prompt',
      sortable: true,
      sortKey: 'prompt',
      cell: (q) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            {q.type === 'THEORY' ? (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  color: '#8b5cf6',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                Theory
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                MCQ
              </span>
            )}
            <span
              style={{
                fontWeight: 500,
                color: 'var(--color-text)',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={stripMathDelimiters(q.cleanPrompt)}
            >
              <FormattedMathText text={q.cleanPrompt} />
            </span>
          </div>
          {q.variantTag && (
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontFamily: 'monospace',
                  padding: '0.0625rem 0.375rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
                title="Seed data variant marker automatically cleaned from student presentation"
              >
                {q.variantTag}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Course',
      sortable: true,
      sortKey: 'course',
      width: '180px',
      cell: (q) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              lineHeight: 1.3,
            }}
          >
            {q.courseName}
          </span>
          {q.courseCode && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                color: 'var(--color-primary)',
                fontWeight: 600,
              }}
            >
              {q.courseCode}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Topic',
      sortable: true,
      sortKey: 'topic',
      cell: (q) => (
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          {q.topicName}
        </span>
      ),
    },
    {
      header: 'Options & Key',
      cell: (q) => {
        if (q.type === 'THEORY') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#8b5cf6',
                }}
              >
                <BookOpen size={12} /> Theory Response
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {q.modelAnswer ? 'Model answer defined' : 'Prompt only'}
              </span>
            </div>
          );
        }

        if (q.isMissingOptions) {
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger, #ef4444)',
              }}
            >
              <AlertTriangle size={12} /> No options (Incomplete)
            </span>
          );
        }

        const optionCount = q.options?.length || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.125rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: 'var(--color-success, #22c55e)',
              }}
            >
              <CheckCircle2 size={12} /> Key: {q.correctAnswer}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              ({optionCount} choices)
            </span>
          </div>
        );
      },
    },
    {
      header: 'Difficulty',
      sortable: true,
      sortKey: 'difficulty',
      cell: (q) => renderDifficultyBadge(q.difficultyValue),
    },
    {
      header: 'Rating (Elo)',
      sortable: true,
      sortKey: 'elo',
      align: 'right',
      cell: (q) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8125rem',
            color: 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Zap size={12} color="var(--color-primary)" />
          {q.eloRating || 1200}
        </span>
      ),
    },
    {
      header: '',
      width: '48px',
      align: 'right',
      cell: (q) => <RowActions actions={getRowActions(q)} />,
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Questions"
        description="Curate practice and examination items with options, difficulty calibration, and answer explanations."
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={() => setIsBulkImportOpen(true)}>
            <FileUp size={14} style={{ marginRight: '0.375rem' }} /> Bulk Import
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateDrawerOpen(true)}>
            <Plus size={14} style={{ marginRight: '0.375rem' }} /> Add Question
          </Button>
        </div>
      </PageHeader>

      {/* Filter and Search Command Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          backgroundColor: 'var(--color-surface)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
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
            placeholder="Search questions by prompt or course..."
            value={querySearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.375rem 0.625rem 0.375rem 2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background-soft)',
              color: 'var(--color-text)',
              fontSize: '0.8125rem',
            }}
          />
        </div>

        {/* Course filter */}
        <select
          aria-label="Filter by course"
          value={selectedCourseFilter}
          onChange={(e) => {
            const newCourseId = e.target.value;
            updateSearchParams({
              courseId: newCourseId || undefined,
              topicId: undefined, // Clear topic filter when changing course so items match correctly
              page: 1,
            });
          }}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
            minWidth: '160px',
            fontWeight: selectedCourseFilter ? 600 : 400,
          }}
        >
          <option value="">All Courses ({courses.length})</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code ? `${c.code} · ${c.title}` : c.title}
            </option>
          ))}
        </select>

        {/* Topic filter (cascades based on selected course) */}
        <select
          aria-label="Filter by topic"
          value={selectedTopicFilter}
          onChange={(e) => {
            const topicId = e.target.value;
            // If topic is selected, ensure courseId is also aligned if topic belongs to a course
            if (topicId) {
              const selectedTopicObj = topicMap.get(topicId);
              const linkedCourseId =
                typeof selectedTopicObj?.courseId === 'object' && selectedTopicObj?.courseId !== null
                  ? (selectedTopicObj.courseId as any)._id
                  : selectedTopicObj?.courseId;
              updateSearchParams({
                topicId,
                courseId: selectedCourseFilter || linkedCourseId || undefined,
                page: 1,
              });
            } else {
              updateSearchParams({ topicId: undefined, page: 1 });
            }
          }}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
            minWidth: '160px',
            fontWeight: selectedTopicFilter ? 600 : 400,
          }}
        >
          <option value="">
            {selectedCourseFilter ? 'All Topics in Course' : 'All Topics'} ({availableTopics.length})
          </option>
          {availableTopics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Question Format / Type filter */}
        <select
          aria-label="Filter by question format"
          value={selectedTypeFilter}
          onChange={(e) => updateSearchParams({ type: e.target.value as any, page: 1 })}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
            fontWeight: selectedTypeFilter !== 'all' ? 600 : 400,
          }}
        >
          <option value="all">All Formats</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</option>
          <option value="THEORY">Theory (Free Response)</option>
        </select>

        {/* Difficulty filter */}
        <select
          aria-label="Filter by difficulty"
          value={selectedDifficultyFilter}
          onChange={(e) => handleDifficultyFilterChange(e.target.value as QuestionSearch['difficulty'])}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
          }}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy (1–3)</option>
          <option value="medium">Medium (4–7)</option>
          <option value="hard">Hard (8–10)</option>
        </select>

        {/* Status / Incomplete filter */}
        <select
          aria-label="Filter by completion status"
          value={selectedStatusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as QuestionSearch['status'])}
          style={{
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background-soft)',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
          }}
        >
          <option value="all">All Status</option>
          <option value="complete">Complete (Valid Question)</option>
          <option value="incomplete">Incomplete (No Options)</option>
        </select>

        {/* Reset filter button if active */}
        {(querySearch || selectedCourseFilter || selectedTopicFilter || selectedTypeFilter !== 'all' || selectedDifficultyFilter !== 'all' || selectedStatusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  q: undefined,
                  courseId: undefined,
                  topicId: undefined,
                  type: 'all',
                  difficulty: 'all',
                  status: 'all',
                  page: 1,
                }),
              })
            }
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
          >
            <RotateCcw size={12} style={{ marginRight: '0.25rem' }} /> Clear Filters
          </Button>
        )}
      </div>

      {/* Main Questions Data Table */}
      <DataTable
        columns={columns}
        data={paginatedQuestions}
        keyExtractor={(q) => q._id}
        isLoading={isLoadingQuestions || isLoadingTopics || isLoadingCourses}
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
            title="No questions match criteria"
            description="Adjust your search query, course/topic filter, or add a new question to the item bank."
            actionLabel="Add Question"
            onAction={() => setIsCreateDrawerOpen(true)}
          />
        }
      />

      {/* CREATE FORM DRAWER */}
      <FormDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Create New Question"
        description="Add a multiple-choice or theory question item with validated options or rubric, difficulty calibration, and explanation."
        width="600px"
      >
        <QuestionForm
          topics={topics}
          courses={courses}
          initialData={{
            topicId: selectedTopicFilter || (availableTopics.length > 0 ? availableTopics[0]._id : topics[0]?._id) || '',
          }}
          onSubmit={handleCreateSubmit}
          isSubmitting={isCreating}
          onCancel={() => setIsCreateDrawerOpen(false)}
        />
      </FormDrawer>

      {/* EDIT FORM DRAWER */}
      <FormDrawer
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Edit Question"
        description="Update prompt wording, options, designated correct key, calibrated difficulty, or explanation."
        width="600px"
      >
        {editingQuestion && (
          <QuestionForm
            topics={topics}
            courses={courses}
            initialData={{
              type: editingQuestion.type || 'MULTIPLE_CHOICE',
              questionText: cleanQuestionPrompt(editingQuestion.questionText),
              topicId:
                typeof editingQuestion.topicId === 'string'
                  ? editingQuestion.topicId
                  : (editingQuestion.topicId as any)?._id,
              options: editingQuestion.options || [],
              correctAnswer: editingQuestion.correctAnswer || 'A',
              modelAnswer: editingQuestion.modelAnswer || '',
              rubric: editingQuestion.rubric || [],
              difficulty: editingQuestion.difficulty || 5,
              explanation: editingQuestion.explanation,
              eloRating: editingQuestion.eloRating || 1200,
            }}
            onSubmit={handleEditSubmit}
            isSubmitting={isUpdating}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
      </FormDrawer>

      {/* VIEW QUESTION DRAWER */}
      <FormDrawer
        isOpen={!!viewingQuestion}
        onClose={() => setViewingQuestion(null)}
        title="Question Item Details"
        description="Full item bank inspection including options, explanation, calibrated difficulty, and raw identifiers."
        width="560px"
      >
        {viewingQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Course, Topic & Metadata row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-background-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Course
                </span>
                <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                  {viewingQuestion.courseName}
                </p>
                {viewingQuestion.courseCode && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                    {viewingQuestion.courseCode}
                  </span>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Topic
                </span>
                <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                  {viewingQuestion.topicName}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Calibration
                </span>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {renderDifficultyBadge(viewingQuestion.difficultyValue)}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Zap size={11} /> Elo: {viewingQuestion.eloRating || 1200}
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Cleaned Prompt (Student Presentation)
              </span>
              <div
                style={{
                  marginTop: '0.375rem',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  fontWeight: 500,
                  color: 'var(--color-text)',
                }}
              >
                <FormattedMathText text={viewingQuestion.cleanPrompt} />
              </div>
              {viewingQuestion.variantTag && (
                <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>Database raw prompt: </span>
                  <code style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {viewingQuestion.questionText}
                  </code>
                </div>
              )}
            </div>

            {/* Theory Model Answer & Rubric or MCQ Options */}
            {viewingQuestion.type === 'THEORY' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Model Answer (Expected Response)
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(139, 92, 246, 0.12)',
                        color: '#8b5cf6',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Theory / Free Response
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(139, 92, 246, 0.04)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {viewingQuestion.modelAnswer ? (
                      <FormattedMathText text={viewingQuestion.modelAnswer} />
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No formal model answer specified. Free response evaluated against course rubric.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Grading Rubric ({viewingQuestion.rubric?.length || 0} Criteria)
                  </span>
                  {viewingQuestion.rubric && viewingQuestion.rubric.length > 0 ? (
                    <div style={{ marginTop: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead style={{ backgroundColor: 'var(--color-background-soft)' }}>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>Criterion / Concept</th>
                            <th style={{ padding: '0.5rem 0.75rem', width: '80px', textAlign: 'right', color: 'var(--color-text-muted)' }}>Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingQuestion.rubric.map((r, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < viewingQuestion.rubric!.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text)' }}>
                                <FormattedMathText text={r.point} />
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#8b5cf6' }}>
                                {r.weight} pt{r.weight !== 1 ? 's' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '0.375rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-background-soft)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Default holistic assessment rubric applied by evaluation engine.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Options & Answer Key
                </span>
                {viewingQuestion.isMissingOptions ? (
                  <div
                    style={{
                      marginTop: '0.375rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--color-danger)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>This item has no options configured. Edit this question to add multiple-choice choices.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {viewingQuestion.options?.map((opt) => {
                      const isCorrect = viewingQuestion.correctAnswer === opt.id;
                      return (
                        <div
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.625rem 0.875rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'var(--color-surface)',
                            border: isCorrect ? '1.5px solid var(--color-success, #22c55e)' : '1px solid var(--color-border)',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isCorrect ? 'var(--color-success, #22c55e)' : 'var(--color-border)',
                                color: isCorrect ? '#fff' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {opt.id}
                            </span>
                            <span style={{ color: 'var(--color-text)', fontWeight: isCorrect ? 600 : 400 }}>
                              <FormattedMathText text={opt.text} />
                            </span>
                          </div>
                          {isCorrect && (
                            <span
                              style={{
                                color: 'var(--color-success, #22c55e)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                textTransform: 'uppercase',
                              }}
                            >
                              <CheckCircle2 size={13} /> Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Explanation
              </span>
              <div
                style={{
                  marginTop: '0.375rem',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {viewingQuestion.explanation ? (
                  <FormattedMathText text={viewingQuestion.explanation} />
                ) : (
                  'No explanation provided.'
                )}
              </div>
            </div>

            {/* System Info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Hash size={13} />
                <code>{viewingQuestion._id}</code>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" size="sm" onClick={() => setViewingQuestion(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const q = viewingQuestion;
                    setViewingQuestion(null);
                    setEditingQuestion(q);
                  }}
                >
                  Edit Question
                </Button>
              </div>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* SINGLE DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!questionToDelete}
        title="Delete Question Item"
        message={
          questionToDelete
            ? `Are you sure you want to delete question "${questionToDelete.cleanPrompt}"? This will remove it from future exams and adaptive practice.`
            : 'Are you sure you want to delete this question?'
        }
        confirmText="Delete Question"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setQuestionToDelete(null)}
        isPending={isDeleting}
      />

      {/* BULK DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        title="Delete Selected Questions"
        message={`Are you sure you want to delete all ${selectedIds.size} selected questions? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.size} Questions`}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        isPending={isBulkDeleting}
      />

      {/* BULK IMPORT MODAL */}
      <QuestionBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        topics={topics}
        courses={courses}
        selectedTopicId={selectedTopicFilter || undefined}
        onImport={handleBulkImport}
        isImporting={isBulkImporting}
      />
    </div>
  );
}
