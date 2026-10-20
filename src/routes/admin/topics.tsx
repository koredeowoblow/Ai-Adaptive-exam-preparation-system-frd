import { createFileRoute } from '@tanstack/react-router';

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
});
