import { createFileRoute } from '@tanstack/react-router';

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
});
