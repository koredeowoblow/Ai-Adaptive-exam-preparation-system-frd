import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi } from '../api/practice.api';
import type { StartSessionPayload } from '../../../types/practice.types';
import { queryKeys } from '../../../shared/queryKeys';

export const useStartSession = () => {
  return useMutation({
    mutationFn: (payload: StartSessionPayload) => practiceApi.startSession(payload),
  });
};

export const usePracticeSession = (sessionId: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: [...queryKeys.practice.session(sessionId), { page, limit }],
    queryFn: async () => {
      const response = await practiceApi.getSession(sessionId, { page, limit });
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state?.data as any;
      if (!data?.session) return false;
      if (data.session.status === 'FAILED') {
        return false;
      }
      // Poll rapidly if grading is pending
      if (data.session.status === 'PENDING_GRADING') {
        return 2000;
      }
      // Check if any question has pending grading or pending explanation
      const hasPending = data.session.questionsServed?.some((q: any) =>
        q.gradingStatus === 'PENDING' || q.explanationStatus === 'PENDING'
      );
      if (hasPending) {
        return 2000;
      }
      // Once completed and no items are pending, stop polling
      if (data.session.status === 'completed') {
        return false;
      }
      return false;
    }
  });
};


export const useSubmitBatchAnswers = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => practiceApi.submitBatchAnswers(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practice.session(sessionId) });
    },
  });
};

export const useSessions = (params?: { courseId?: string; limit?: number; cursor?: string }) => {
  return useQuery({
    queryKey: ['practice', 'sessions', params],
    queryFn: async () => {
      const response = await practiceApi.getSessions(params);
      return response.data;
    },
  });
};

export const useRequestMcqExplanation = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => practiceApi.requestMcqExplanation(sessionId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practice.session(sessionId) });
    }
  });
};
