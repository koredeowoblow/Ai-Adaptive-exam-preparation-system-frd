import { apiClient } from '../../../shared/api-client/client';
import type { 
  StartSessionPayload, 
  StartSessionResponse, 
  SubmitAnswerPayload, 
  SubmitAnswerResponse,
  GetSessionResponse,
  LogAntiCheatEventPayload
} from '../../../types/practice.types';


export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const practiceApi = {
  startSession: async (payload: StartSessionPayload): Promise<ApiResponse<StartSessionResponse>> => {
    return apiClient.post('/practice-sessions/start', payload);
  },
  
  getSession: async (sessionId: string, params?: { page?: number, limit?: number }): Promise<ApiResponse<GetSessionResponse>> => {
    return apiClient.get(`/practice-sessions/${sessionId}`, { params });
  },
  
  submitAnswer: async (sessionId: string, payload: SubmitAnswerPayload): Promise<ApiResponse<SubmitAnswerResponse>> => {
    return apiClient.post(`/practice-sessions/${sessionId}/answer`, payload);
  },

  logAntiCheatEvents: async (sessionId: string, payload: LogAntiCheatEventPayload): Promise<ApiResponse<any>> => {
    return apiClient.post(`/practice-sessions/${sessionId}/anticheat-event`, payload);
  },

  submitBatchAnswers: async (sessionId: string, payload: any): Promise<ApiResponse<any>> => {
    return apiClient.post(`/practice-sessions/${sessionId}/submit-batch`, payload);
  },

  getSessions: async (params?: { courseId?: string, limit?: number, cursor?: string }): Promise<ApiResponse<any>> => {
    return apiClient.get('/practice-sessions', { params });
  },

  requestMcqExplanation: async (sessionId: string, answerId: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/practice-sessions/${sessionId}/answers/${answerId}/explain`);
  },
};
