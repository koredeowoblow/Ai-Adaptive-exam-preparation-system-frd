import { apiClient } from '../../../shared/api-client/client';
import type { Course } from '../../../types/course.types';

export interface StudentProfile {
  _id: string;
  userId: string;
  name?: string;
  departmentId?: { _id: string; name: string };
  enrolledCourses: (string | Course)[];
  totalSessions: number;
  averageScore: number;
}

export interface UpdateProfilePayload {
  name?: string;
  departmentId?: string;
}

export const studentApi = {
  getProfile: async (): Promise<{ success: boolean; data: StudentProfile }> =>
    apiClient.get('/students/profile'),

  updateProfile: async (data: UpdateProfilePayload): Promise<{ success: boolean; data: StudentProfile }> =>
    apiClient.put('/students/profile', data),

  getEnrolledCourses: async (): Promise<{ success: boolean; data: Course[] }> =>
    apiClient.get('/students/courses'),

  enrollCourse: async (courseId: string): Promise<{ success: boolean; message: string; data: any }> =>
    apiClient.post(`/students/courses/${courseId}/enroll`, { courseIds: [courseId] }),
};
