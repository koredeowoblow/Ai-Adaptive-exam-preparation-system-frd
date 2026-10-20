import { createFileRoute } from '@tanstack/react-router';

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
});
