import { apiClient } from '../../../shared/api-client/client';

export interface DashboardStats {
  totalCourses: number;
  totalTopicsMastered: number;
  averageElo: number;
  averageEloLevel: string;
  recentActivity: Array<{
    _id: string;
    topicName: string;
    courseName: string;
    date: string;
    score: number;
    performanceLevel: "good" | "fair" | "poor";
  }>;
  focusAreas: Array<{
    topicId: string;
    topicName: string;
    courseId: string;
    courseName: string;
    elo: number;
  }>;
  performanceSummary: {
    averageScore: number | null;
    chartData: Array<{
      name: number;
      score: number;
      topic: string;
    }>;
  };
}

export interface DashboardStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export interface DashboardAchievement {
  _id: string;
  achievementId: {
    _id: string;
    name: string;
    description: string;
    icon?: string;
  };
  unlockedAt: string;
}

export interface StudentDashboardData {
  streak: DashboardStreak;
  achievements: DashboardAchievement[];
  stats: DashboardStats;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const dashboardApi = {
  getStudentDashboard: async (): Promise<ApiResponse<StudentDashboardData>> => {
    return apiClient.get('/dashboard');
  },
};
