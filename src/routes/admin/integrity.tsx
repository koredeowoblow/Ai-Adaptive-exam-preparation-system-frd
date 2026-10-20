import { createFileRoute } from '@tanstack/react-router';

interface IntegritySearch {
  q?: string;
  severity?: 'all' | 'LOW' | 'MEDIUM' | 'HIGH';
  eventType?: string;
  page?: number;
  limit?: number;
}

export const Route = createFileRoute('/admin/integrity')({
  validateSearch: (search: Record<string, unknown>): IntegritySearch => {
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      severity: (['all', 'LOW', 'MEDIUM', 'HIGH'].includes(search.severity as string)
        ? search.severity
        : 'all') as IntegritySearch['severity'],
      eventType: typeof search.eventType === 'string' && search.eventType ? search.eventType : 'all',
      page: search.page ? Math.max(1, Number(search.page)) : 1,
      limit: search.limit ? Number(search.limit) : 20,
    };
  },
});
