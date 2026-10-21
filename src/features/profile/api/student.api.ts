import { apiClient } from '../../../shared/api-client/client';
import type { Course } from '../../../types/course.types';

export interface StudentProfile {
  _id: string;
  userId: string;
  name?: string;
  departmentId?: { _id: string; name: string };
  level?: '100L' | '200L' | '300L' | '400L' | '500L';
  nextExamDate?: string | null;
  courseExamDates?: Record<string, string>;
  enrolledCourses: (string | Course)[];
  totalSessions: number;
  averageScore: number;
}

export interface UpdateProfilePayload {
  name?: string;
  departmentId?: string;
  level?: '100L' | '200L' | '300L' | '400L' | '500L';
  nextExamDate?: string | null;
  enrolledCourseIds?: string[];
}

export const studentApi = {
  getProfile: async (): Promise<{ success: boolean; data: StudentProfile }> =>
    apiClient.get('/students/profile'),

  updateProfile: async (data: UpdateProfilePayload): Promise<{ success: boolean; data: StudentProfile }> =>
    apiClient.put('/students/profile', data),

  updateCourseExamDates: async (
    dates: Record<string, string>
  ): Promise<{ success: boolean; data: StudentProfile }> =>
    apiClient.put('/students/course-exam-dates', { dates }),

  getEnrolledCourses: async (): Promise<{ success: boolean; data: Course[] }> =>
    apiClient.get('/students/courses'),

  enrollCourse: async (courseId: string): Promise<{ success: boolean; message: string; data: any }> =>
    apiClient.post(`/students/courses/${courseId}/enroll`, { courseIds: [courseId] }),
};
