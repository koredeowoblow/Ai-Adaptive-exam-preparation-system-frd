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

  tutorQuestion: async (payload: {
    questionContext: {
      questionText: string;
      type?: string;
      studentAnswer?: string;
      correctAnswer?: string;
      modelAnswer?: string;
      rubric?: any;
      feedback?: string;
      marksAwarded?: number;
      maxMarks?: number;
    };
    messages: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<ApiResponse<{ reply: string }>> => {
    return apiClient.post('/ai/tutor-question', payload);
  },

  analyzeDistractor: async (payload: {
    questionText: string;
    options?: { id: string; text: string }[];
    correctAnswer?: string;
    studentAnswer: string;
    modelAnswer?: string;
    subPartLabel?: string;
    explanation?: string;
  }): Promise<ApiResponse<{
    misconceptionTitle: string;
    whyDistractorTempting: string;
    mentalModelFix: string;
    correctiveMicroDrill: {
      prompt: string;
      options: { id: string; text: string }[];
      correctOptionId: string;
      explanation: string;
    };
  }>> => {
    return apiClient.post('/ai/distractor-analysis', payload);
  },

  refineExplanation: async (payload: {
    questionText: string;
    studentAnswer?: string;
    correctAnswer?: string;
    modelAnswer?: string;
    currentExplanation?: string;
    style: 'ANALOGY' | 'STEP_BY_STEP' | 'SUMMARY' | 'CUSTOM';
    customPrompt?: string;
  }): Promise<ApiResponse<{
    title: string;
    refinedExplanation: string;
  }>> => {
    return apiClient.post('/ai/refine-explanation', payload);
  },
};

