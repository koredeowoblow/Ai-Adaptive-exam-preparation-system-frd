import { apiClient } from '../../../shared/api-client/client';

export interface LeaderboardEntryData {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    departmentId?: string;
  };
  courseId?: {
    _id: string;
    title: string;
    code: string;
  };
  score: number;
  rank?: number;
  updatedAt?: string;
}

export interface LeaderboardResponse {
  items: LeaderboardEntryData[];
  limit: number;
  skip: number;
}

export const leaderboardApi = {
  getGlobalLeaderboard: async (limit = 20, skip = 0): Promise<{ success: boolean; data: LeaderboardResponse }> => {
    return apiClient.get('/leaderboards/global', { params: { limit, skip } });
  },

  getCourseLeaderboard: async (courseId: string, limit = 20, skip = 0): Promise<{ success: boolean; data: LeaderboardResponse }> => {
    return apiClient.get(`/leaderboards/course/${courseId}`, { params: { limit, skip } });
  },
};
