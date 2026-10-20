import { createFileRoute } from '@tanstack/react-router';

interface AnalyticsSearch {
  courseId?: string;
}

export const Route = createFileRoute('/admin/analytics')({
  validateSearch: (search: Record<string, unknown>): AnalyticsSearch => {
    return {
      courseId: typeof search.courseId === 'string' && search.courseId ? search.courseId : undefined,
    };
  },
});
