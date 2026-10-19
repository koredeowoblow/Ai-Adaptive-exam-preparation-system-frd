import { apiClient } from '../../../shared/api-client/client';
import type { Department } from '../../../types/department.types';
import type { Course } from '../../../types/course.types';
import type { Topic } from '../../../types/topic.types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedData<T> {
  items: T;
  limit?: number;
  nextCursor?: string | null;
}

export const curriculumApi = {
  getDepartments: async (): Promise<ApiResponse<PaginatedData<Department[]>>> => {
    return apiClient.get('/departments');
  },
  getDepartmentCourses: async (departmentId: string, cursor?: string): Promise<ApiResponse<PaginatedData<Course[]>>> => {
    const params = cursor ? { cursor } : {};
    return apiClient.get(`/departments/${departmentId}/courses`, { params });
  },
  getCourseTopics: async (courseId: string, cursor?: string): Promise<ApiResponse<PaginatedData<Topic[]>>> => {
    const params = cursor ? { cursor } : {};
    return apiClient.get(`/courses/${courseId}/topics`, { params });
  },
  getCourse: async (courseId: string): Promise<ApiResponse<Course>> => {
    return apiClient.get(`/courses/${courseId}`);
  },
};
