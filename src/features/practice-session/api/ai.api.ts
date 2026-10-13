import { apiClient } from '../../../shared/api-client/client';

export interface GenerateExplanationPayload {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const aiApi = {
  generateExplanation: async (payload: GenerateExplanationPayload): Promise<ApiResponse<{ explanation: string }>> => {
    return apiClient.post('/ai/explain', payload);
  },
};
