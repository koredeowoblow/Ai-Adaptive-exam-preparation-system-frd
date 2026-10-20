import { createFileRoute } from '@tanstack/react-router';

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

export const Route = createFileRoute('/admin/users')({
  validateSearch: (search: Record<string, unknown>): UserSearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      departmentId: typeof search.departmentId === 'string' && search.departmentId ? search.departmentId : undefined,
      level: (['all', '100L', '200L', '300L', '400L'].includes(search.level as string)
        ? search.level
        : 'all') as UserSearch['level'],
      onboarded: (['all', 'complete', 'pending'].includes(search.onboarded as string)
        ? search.onboarded
        : 'all') as UserSearch['onboarded'],
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 10,
      sortBy: (['name', 'email', 'level', 'createdAt', 'onboarded'].includes(search.sortBy as string)
        ? search.sortBy
        : 'createdAt') as UserSearch['sortBy'],
      sortOrder: search.sortOrder === 'asc' ? 'asc' : 'desc',
    };
  },
});
