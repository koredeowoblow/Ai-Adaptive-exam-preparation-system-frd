import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboard.api';

export const useGlobalLeaderboard = (limit = 20, skip = 0) =>
  useQuery({
    queryKey: ['leaderboards', 'global', limit, skip],
    queryFn: async () => {
      const res = await leaderboardApi.getGlobalLeaderboard(limit, skip);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

export const useCourseLeaderboard = (courseId: string, limit = 20, skip = 0) =>
  useQuery({
    queryKey: ['leaderboards', 'course', courseId, limit, skip],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await leaderboardApi.getCourseLeaderboard(courseId, limit, skip);
      return res.data;
    },
    enabled: !!courseId,
    staleTime: 60 * 1000,
  });
