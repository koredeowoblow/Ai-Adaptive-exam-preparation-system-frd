import { apiClient } from '../../../shared/api-client/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StudyDayPlan {
  day: string;
  focus: string;
  tasks: string[];
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StudyPlan {
  weekGoal: string;
  days: StudyDayPlan[];
  tips: string[];
}

export const aiApi = {
  chat: async (
    messagesOrParams: ChatMessage[] | { messages: ChatMessage[]; context?: string; courseId?: string },
    context?: string,
    courseId?: string
  ): Promise<{ success: boolean; data: { reply: string } }> => {
    if (Array.isArray(messagesOrParams)) {
      return apiClient.post('/ai/chat', { messages: messagesOrParams, context, courseId });
    }
    return apiClient.post('/ai/chat', messagesOrParams);
  },

  generateStudyPlan: async (params: {
    studentStats: string;
    department?: string;
    level?: string;
    nextExamDate?: string | null;
  }): Promise<{ success: boolean; data: { plan: StudyPlan } }> =>
    apiClient.post('/ai/study-plan', params),
};
