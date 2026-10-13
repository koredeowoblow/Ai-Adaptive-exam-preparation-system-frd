import { useMutation } from '@tanstack/react-query';
import { aiApi, type ChatMessage } from '../api/ai.api';

export const useAIChat = () =>
  useMutation({
    mutationFn: (payload: { messages: ChatMessage[]; context?: string; courseId?: string }) =>
      aiApi.chat(payload),
  });

export const useGenerateStudyPlan = () =>
  useMutation({
    mutationFn: ({ studentStats, department }: { studentStats: string; department?: string }) =>
      aiApi.generateStudyPlan(studentStats, department),
  });
