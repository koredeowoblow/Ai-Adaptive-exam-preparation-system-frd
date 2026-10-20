import { createFileRoute } from '@tanstack/react-router';

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
});
