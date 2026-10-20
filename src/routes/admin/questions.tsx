import { createFileRoute } from '@tanstack/react-router';

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
});
