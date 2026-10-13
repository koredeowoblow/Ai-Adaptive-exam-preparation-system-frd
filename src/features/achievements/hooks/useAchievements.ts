import { useQuery } from '@tanstack/react-query';
import { achievementApi } from '../api/achievement.api';

export const useAllAchievements = () =>
  useQuery({
    queryKey: ['achievements', 'all'],
    queryFn: async () => {
      const res = await achievementApi.getAllAchievements();
      return res.data;
    },
  });

export const useMyAchievements = () =>
  useQuery({
    queryKey: ['achievements', 'me'],
    queryFn: async () => {
      const res = await achievementApi.getMyAchievements();
      return res.data;
    },
  });
