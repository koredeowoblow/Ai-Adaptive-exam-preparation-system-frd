import { useMutation } from '@tanstack/react-query';
import { aiApi, type ChatMessage } from '../api/ai.api';

export const useAIChat = () =>
  useMutation({
    mutationFn: (payload: { messages: ChatMessage[]; context?: string; courseId?: string }) =>
      aiApi.chat(payload),
  });

export const useGenerateStudyPlan = () =>
  useMutation({
    mutationFn: (payload: {
      studentStats: string;
      department?: string;
      level?: string;
      nextExamDate?: string | null;
    }) => aiApi.generateStudyPlan(payload),
  });
