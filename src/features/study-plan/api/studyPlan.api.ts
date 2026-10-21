import { apiClient } from '../../../shared/api-client/client';
import type {
  StudyPlanResponse,
  StudyPlanListResponse,
  TaskToggleResponse,
} from '../../../types/studyPlan.types';

export const studyPlanApi = {
  getActivePlan: async (): Promise<StudyPlanResponse> =>
    apiClient.get('/study-plans/active'),

  generatePlan: async (): Promise<StudyPlanResponse> =>
    apiClient.post('/study-plans/generate', {}),

  generateWeek: async (planId: string, weekNumber: number): Promise<StudyPlanResponse> =>
    apiClient.post(`/study-plans/${planId}/weeks/${weekNumber}/generate`, {}),

  retryWeek: async (planId: string, weekNumber: number): Promise<StudyPlanResponse> =>
    apiClient.post(`/study-plans/${planId}/weeks/${weekNumber}/retry`, {}),

  toggleTask: async (
    planId: string,
    taskId: string,
    completed: boolean
  ): Promise<TaskToggleResponse> =>
    apiClient.put(`/study-plans/${planId}/tasks/${taskId}`, { completed }),

  getPlanHistory: async (): Promise<StudyPlanListResponse> =>
    apiClient.get('/study-plans/history'),
};
