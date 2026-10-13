import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  adminApi,
  type SessionListParams,
  type IntegrityListParams,
} from '../api/admin.api';
import type { Department } from '../../../types/department.types';
import type { Course } from '../../../types/course.types';
import type { Topic } from '../../../types/topic.types';
import type { Question } from '../../../types/question.types';
import { analyticsApi } from '../../analytics/api/analytics.api';
import { queryKeys } from '../../../shared/queryKeys';
import { toast } from 'sonner';

// Departments
export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments.all(),
    queryFn: async () => {
      const res = await adminApi.getDepartments();
      return res.data.items || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Department>) => adminApi.createDepartment(data),
    onSuccess: () => {
      toast.success('Department created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
    onError: () => toast.error('Failed to create department'),
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Department> }) => adminApi.updateDepartment(id, data),
    onSuccess: () => {
      toast.success('Department updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
    onError: () => toast.error('Failed to update department'),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.departments.all() });
      const previousDepts = queryClient.getQueryData<Department[]>(queryKeys.departments.all());
      if (previousDepts && Array.isArray(previousDepts)) {
        queryClient.setQueryData<Department[]>(
          queryKeys.departments.all(),
          previousDepts.filter((d) => d._id !== id)
        );
      }
      return { previousDepts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousDepts) {
        queryClient.setQueryData(queryKeys.departments.all(), context.previousDepts);
      }
      toast.error('Failed to delete department');
    },
    onSuccess: () => {
      toast.success('Department deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
  });
};

// Courses
export const useCourses = (departmentId?: string) => {
  return useInfiniteQuery({
    queryKey: departmentId ? queryKeys.departments.courses(departmentId) : queryKeys.courses.all(),
    queryFn: async ({ pageParam = undefined as string | undefined }) => {
      const res = await adminApi.getCourses(departmentId, pageParam);
      return res.data; // Return the PaginatedData envelope
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCourse = (departmentId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Course>) => adminApi.createCourse(data),
    onSuccess: () => {
      toast.success('Course created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
      if (departmentId) queryClient.invalidateQueries({ queryKey: queryKeys.departments.courses(departmentId) });
    },
    onError: () => toast.error('Failed to create course'),
  });
};

export const useUpdateCourse = (departmentId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Course> }) => adminApi.updateCourse(id, data),
    onSuccess: () => {
      toast.success('Course updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
      if (departmentId) queryClient.invalidateQueries({ queryKey: queryKeys.departments.courses(departmentId) });
    },
    onError: () => toast.error('Failed to update course'),
  });
};

export const useDeleteCourse = (departmentId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCourse(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.all() });
      const previousCourses = queryClient.getQueryData<any>(queryKeys.courses.all());
      if (previousCourses?.pages) {
        queryClient.setQueryData(queryKeys.courses.all(), {
          ...previousCourses,
          pages: previousCourses.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((c: any) => c._id !== id),
          })),
        });
      }
      return { previousCourses };
    },
    onError: (_err, _id, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(queryKeys.courses.all(), context.previousCourses);
      }
      toast.error('Failed to delete course');
    },
    onSuccess: () => {
      toast.success('Course deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
      if (departmentId) queryClient.invalidateQueries({ queryKey: queryKeys.departments.courses(departmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all() });
    },
  });
};

// Topics
export const useTopics = (courseId?: string) => {
  return useInfiniteQuery({
    queryKey: courseId ? queryKeys.topics.all(courseId) : ['topics'],
    queryFn: async ({ pageParam = undefined as string | undefined }) => {
      const res = await adminApi.getTopics(courseId, pageParam);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTopic = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Topic>) => adminApi.createTopic(data),
    onSuccess: () => {
      toast.success('Topic created successfully');
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      if (courseId) queryClient.invalidateQueries({ queryKey: queryKeys.topics.all(courseId) });
    },
    onError: () => toast.error('Failed to create topic'),
  });
};

export const useUpdateTopic = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Topic> }) => adminApi.updateTopic(id, data),
    onSuccess: () => {
      toast.success('Topic updated successfully');
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      if (courseId) queryClient.invalidateQueries({ queryKey: queryKeys.topics.all(courseId) });
    },
    onError: () => toast.error('Failed to update topic'),
  });
};

export const useDeleteTopic = (courseId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTopic(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['topics'] });
      const previousTopics = queryClient.getQueryData<any>(['topics']);
      if (previousTopics?.pages) {
        queryClient.setQueryData(['topics'], {
          ...previousTopics,
          pages: previousTopics.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((t: any) => t._id !== id),
          })),
        });
      }
      return { previousTopics };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTopics) {
        queryClient.setQueryData(['topics'], context.previousTopics);
      }
      toast.error('Failed to delete topic');
    },
    onSuccess: () => {
      toast.success('Topic deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      if (courseId) queryClient.invalidateQueries({ queryKey: queryKeys.topics.all(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
  });
};

import type { QuestionListParams, PaginatedQuestionsData, UserListParams, PaginatedUsersData } from '../api/admin.api';
import type { StudentUser } from '../../../types/student.types';

// Questions
export const useQuestions = (params?: QuestionListParams) => {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: async () => {
      const res = await adminApi.getQuestions(params);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Question>) => adminApi.createQuestion(data),
    onSuccess: () => {
      toast.success('Question created successfully');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: () => toast.error('Failed to create question'),
  });
};

export const useBulkCreateQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questions: Partial<Question>[]) => adminApi.bulkCreateQuestions(questions),
    onSuccess: (res) => {
      toast.success(`Successfully imported ${res.data?.length ?? 'multiple'} questions`);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to bulk import questions';
      toast.error(msg);
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Question> }) => adminApi.updateQuestion(id, data),
    onSuccess: () => {
      toast.success('Question updated successfully');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: () => toast.error('Failed to update question'),
  });
};

export const useDeleteQuestion = (params?: QuestionListParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteQuestion(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      const previousData = queryClient.getQueryData<PaginatedQuestionsData>(['questions', params]);
      if (previousData?.items) {
        queryClient.setQueryData(['questions', params], {
          ...previousData,
          total: Math.max(0, previousData.total - 1),
          items: previousData.items.filter((q) => q._id !== id),
        });
      }
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['questions', params], context.previousData);
      }
      toast.error('Failed to delete question');
    },
    onSuccess: () => {
      toast.success('Question deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
};

// Users / Students
export const useUsers = (params?: UserListParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await adminApi.getUsers(params);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentUser> }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to update user'),
  });
};

export const useDeleteUser = (params?: UserListParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousData = queryClient.getQueryData<PaginatedUsersData>(['users', params]);
      if (previousData?.items) {
        queryClient.setQueryData(['users', params], {
          ...previousData,
          total: Math.max(0, previousData.total - 1),
          items: previousData.items.filter((u) => u._id !== id),
        });
      }
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['users', params], context.previousData);
      }
      toast.error('Failed to delete user');
    },
    onSuccess: () => {
      toast.success('User deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Exam & Practice Sessions
export const useExamSessions = (params?: SessionListParams) => {
  return useQuery({
    queryKey: ['admin-sessions', params],
    queryFn: async () => {
      const res = await adminApi.getSessions(params);
      return res.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useExamSessionDetails = (sessionId?: string) => {
  return useQuery({
    queryKey: ['admin-session-details', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await adminApi.getSessionDetails(sessionId);
      return res.data?.session || (res.data as any);
    },
    enabled: Boolean(sessionId),
    staleTime: 60 * 1000,
  });
};

// Anti-Cheat & Integrity
export const useIntegrityLogs = (params?: IntegrityListParams) => {
  return useQuery({
    queryKey: ['admin-integrity-logs', params],
    queryFn: async () => {
      const res = await adminApi.getIntegrityLogs(params);
      return res.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useSessionIntegrity = (sessionId?: string) => {
  return useQuery({
    queryKey: ['admin-session-integrity', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await adminApi.getSessionIntegrity(sessionId);
      return res.data || [];
    },
    enabled: Boolean(sessionId),
    staleTime: 60 * 1000,
  });
};

// Platform Analytics & Course Analytics
export const usePlatformAnalytics = () => {
  return useQuery({
    queryKey: ['admin-platform-analytics'],
    queryFn: async () => {
      const res = await adminApi.getPlatformStats();
      return res.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useCourseAnalytics = (courseId?: string) => {
  return useQuery({
    queryKey: ['admin-course-analytics', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await adminApi.getCourseStats(courseId);
      return res.data;
    },
    enabled: Boolean(courseId),
    staleTime: 60 * 1000,
  });
};

export const useStudentDetailedAnalytics = (studentId?: string) => {
  return useQuery({
    queryKey: ['admin-student-analytics', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const res = await analyticsApi.getStudentAnalyticsById(studentId);
      return res.data;
    },
    enabled: Boolean(studentId),
    staleTime: 30 * 1000,
  });
};

export const useCourseDetailedAnalytics = (courseId?: string) => {
  return useQuery({
    queryKey: ['admin-course-detailed-analytics', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await analyticsApi.getCourseAnalyticsById(courseId);
      return res.data;
    },
    enabled: Boolean(courseId),
    staleTime: 30 * 1000,
  });
};

export const useDepartmentDetailedAnalytics = (departmentId?: string) => {
  return useQuery({
    queryKey: ['admin-department-detailed-analytics', departmentId],
    queryFn: async () => {
      if (!departmentId) return null;
      const res = await analyticsApi.getDepartmentAnalyticsById(departmentId);
      return res.data;
    },
    enabled: Boolean(departmentId),
    staleTime: 30 * 1000,
  });
};

export const useTopicDetailedAnalytics = (topicId?: string) => {
  return useQuery({
    queryKey: ['admin-topic-detailed-analytics', topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const res = await analyticsApi.getTopicAnalyticsById(topicId);
      return res.data;
    },
    enabled: Boolean(topicId),
    staleTime: 30 * 1000,
  });
};
