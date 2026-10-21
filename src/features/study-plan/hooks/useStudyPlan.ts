import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanApi } from '../api/studyPlan.api';
import type { StudyPlan } from '../../../types/studyPlan.types';

export const STUDY_PLAN_KEYS = {
  active: ['studyPlan', 'active'] as const,
  history: ['studyPlan', 'history'] as const,
};

export function useActiveStudyPlan() {
  return useQuery({
    queryKey: STUDY_PLAN_KEYS.active,
    queryFn: async (): Promise<StudyPlan | null> => {
      try {
        const res = await studyPlanApi.getActivePlan();
        return res?.data ?? null;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: (query) => {
      const plan = query.state.data;
      if (!plan) return false;
      // Auto-poll if any week is currently in GENERATING status
      const hasGeneratingWeek = plan.weeks?.some((w) => w.status === 'GENERATING');
      return hasGeneratingWeek ? 3000 : false;
    },
  });
}

export function useGenerateStudyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await studyPlanApi.generatePlan();
      return res.data;
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData(STUDY_PLAN_KEYS.active, newPlan);
      queryClient.invalidateQueries({ queryKey: STUDY_PLAN_KEYS.history });
    },
  });
}

export function useGenerateWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, weekNumber }: { planId: string; weekNumber: number }) => {
      const res = await studyPlanApi.generateWeek(planId, weekNumber);
      return res.data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(STUDY_PLAN_KEYS.active, updatedPlan);
    },
  });
}

export function useRetryWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, weekNumber }: { planId: string; weekNumber: number }) => {
      const res = await studyPlanApi.retryWeek(planId, weekNumber);
      return res.data;
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(STUDY_PLAN_KEYS.active, updatedPlan);
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      planId,
      taskId,
      completed,
    }: {
      planId: string;
      taskId: string;
      completed: boolean;
    }) => {
      return studyPlanApi.toggleTask(planId, taskId, completed);
    },
    onMutate: async ({ taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: STUDY_PLAN_KEYS.active });
      const previousPlan = queryClient.getQueryData<StudyPlan | null>(STUDY_PLAN_KEYS.active);

      if (previousPlan) {
        let total = 0;
        let done = 0;
        const newWeeks = previousPlan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            tasks: day.tasks.map((task) => {
              const isTarget = task._id === taskId;
              const isCompleted = isTarget ? completed : !!task.completedAt;
              total++;
              if (isCompleted) done++;
              return isTarget
                ? { ...task, completedAt: completed ? new Date().toISOString() : null }
                : task;
            }),
          })),
        }));

        queryClient.setQueryData<StudyPlan>(STUDY_PLAN_KEYS.active, {
          ...previousPlan,
          totalTasks: total,
          completedTasks: done,
          completionPercentage: total > 0 ? Math.round((done / total) * 100) : 0,
          weeks: newWeeks,
        });
      }

      return { previousPlan };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(STUDY_PLAN_KEYS.active, context.previousPlan);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STUDY_PLAN_KEYS.active });
    },
  });
}
