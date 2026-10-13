import { apiClient } from '../../../shared/api-client/client';

export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  condition: Record<string, unknown>;
}

export interface StudentAchievement {
  _id: string;
  achievementId: Achievement;
  awardedAt: string;
}

export interface MyAchievementsResponse {
  achievements: StudentAchievement[];
  summary: {
    progressPercentage: number;
    unlockedCount: number;
    totalCount: number;
  };
}

export const achievementApi = {
  getAllAchievements: async (): Promise<{ success: boolean; data: Achievement[] }> => {
    return apiClient.get('/achievements');
  },
  getMyAchievements: async (): Promise<{ success: boolean; data: MyAchievementsResponse }> => {
    return apiClient.get('/achievements/me');
  },
};
