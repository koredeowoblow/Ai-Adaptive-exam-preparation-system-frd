import { useQuery, useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { curriculumApi } from '../api/curriculum.api';
import { queryKeys } from '../../../shared/queryKeys';

export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments.all(),
    queryFn: async () => {
      const response = await curriculumApi.getDepartments();
      return response.data.items || response.data;
    },
  });
};

export const useSuspenseDepartments = () => {
  return useSuspenseQuery({
    queryKey: queryKeys.departments.all(),
    queryFn: async () => {
      const response = await curriculumApi.getDepartments();
      return response.data.items || response.data;
    },
  });
};

export const useDepartmentCourses = (departmentId: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.departments.courses(departmentId),
    queryFn: async ({ pageParam = undefined as string | undefined }) => {
      const response = await curriculumApi.getDepartmentCourses(departmentId, pageParam);
      return response.data; // Now returns { items, limit, nextCursor }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!departmentId,
  });
};

export const useCourseTopics = (courseId: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.topics.all(courseId),
    queryFn: async ({ pageParam = undefined as string | undefined }) => {
      const response = await curriculumApi.getCourseTopics(courseId, pageParam);
      return response.data; // Now returns { items, limit, nextCursor }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!courseId,
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const response = await curriculumApi.getCourse(courseId);
      return response.data;
    },
    enabled: !!courseId,
  });
};
