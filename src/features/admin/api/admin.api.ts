import { apiClient } from '../../../shared/api-client/client';
import type { Department } from '../../../types/department.types';
import type { Course } from '../../../types/course.types';
import type { Topic } from '../../../types/topic.types';
import type { Question } from '../../../types/question.types';
import type { StudentUser } from '../../../types/student.types';
import type { AdminExamSession } from '../../../types/practice.types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedData<T> {
  items: T;
  limit?: number;
  nextCursor?: string | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  departmentId?: string;
  level?: string;
  isOnboarded?: boolean;
  roleId?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsersData {
  items: StudentUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionListParams {
  courseId?: string;
  topicId?: string;
  q?: string;
  type?: 'MULTIPLE_CHOICE' | 'THEORY' | 'all';
  difficulty?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}

export interface PaginatedQuestionsData {
  items: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor?: string | null;
}

export interface SessionListParams {
  page?: number;
  limit?: number;
  courseId?: string;
  studentId?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  minTrust?: number;
  maxTrust?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedSessionsData {
  items: AdminExamSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IntegrityLogItem {
  _id: string;
  sessionId: {
    _id: string;
    score?: number;
    trustScore?: number;
    status: string;
    courseId?: { _id: string; title: string; code?: string };
    startedAt?: string;
  } | string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    level?: string;
  } | string;
  eventType: 'WINDOW_BLUR' | 'VISIBILITY_CHANGE' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'CUT_ATTEMPT' | 'MOUSE_LEAVE' | 'CONTEXT_MENU' | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface IntegrityListParams {
  page?: number;
  limit?: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'all';
  eventType?: string;
  studentId?: string;
  sessionId?: string;
}

export interface PaginatedIntegrityData {
  items: IntegrityLogItem[];
  total: number;
  highCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformAnalyticsData {
  totalUsers: number;
  totalCourses: number;
  totalQuestionsAnswered: number;
}

export interface CourseAnalyticsData {
  courseId: string;
  totalStudents: number;
  averageMastery: number;
  activeSessions: number;
  completedSessions: number;
}

export const adminApi = {
  // Departments
  getDepartments: async (): Promise<ApiResponse<PaginatedData<Department[]>>> => {
    return apiClient.get('/departments');
  },
  createDepartment: async (data: Partial<Department>): Promise<ApiResponse<Department>> => {
    return apiClient.post('/departments', data);
  },
  updateDepartment: async (id: string, data: Partial<Department>): Promise<ApiResponse<Department>> => {
    return apiClient.put(`/departments/${id}`, data);
  },
  deleteDepartment: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/departments/${id}`);
  },

  // Courses
  getCourses: async (departmentId?: string, cursor?: string): Promise<ApiResponse<PaginatedData<Course[]>>> => {
    const url = departmentId ? `/departments/${departmentId}/courses` : '/courses';
    const params = cursor ? { cursor } : {};
    return apiClient.get(url, { params });
  },
  createCourse: async (data: Partial<Course>): Promise<ApiResponse<Course>> => {
    return apiClient.post('/courses', data);
  },
  updateCourse: async (id: string, data: Partial<Course>): Promise<ApiResponse<Course>> => {
    return apiClient.put(`/courses/${id}`, data);
  },
  deleteCourse: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/courses/${id}`);
  },

  // Topics
  getTopics: async (courseId?: string, cursor?: string): Promise<ApiResponse<PaginatedData<Topic[]>>> => {
    const url = courseId ? `/courses/${courseId}/topics` : '/topics';
    const params = cursor ? { cursor } : {};
    return apiClient.get(url, { params });
  },
  createTopic: async (data: Partial<Topic>): Promise<ApiResponse<Topic>> => {
    return apiClient.post('/topics', data);
  },
  updateTopic: async (id: string, data: Partial<Topic>): Promise<ApiResponse<Topic>> => {
    return apiClient.put(`/topics/${id}`, data);
  },
  deleteTopic: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/topics/${id}`);
  },

  // Questions
  getQuestions: async (
    params?: QuestionListParams | string,
    cursor?: string
  ): Promise<ApiResponse<PaginatedQuestionsData>> => {
    if (typeof params === 'string') {
      // Backward compatibility if called as getQuestions(topicId, cursor)
      const url = params ? `/topics/${params}/questions` : '/questions';
      return apiClient.get(url, { params: cursor ? { cursor } : {} });
    }
    return apiClient.get('/questions', { params });
  },
  createQuestion: async (data: Partial<Question>): Promise<ApiResponse<Question>> => {
    return apiClient.post('/questions', data);
  },
  uploadDiagram: async (file: File): Promise<ApiResponse<{ url: string; publicId?: string; width?: number; height?: number }>> => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/uploads/diagram', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  bulkCreateQuestions: async (questions: Partial<Question>[]): Promise<ApiResponse<Question[]>> => {
    return apiClient.post('/questions/bulk', { questions });
  },
  updateQuestion: async (id: string, data: Partial<Question>): Promise<ApiResponse<Question>> => {
    return apiClient.put(`/questions/${id}`, data);
  },
  deleteQuestion: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/questions/${id}`);
  },

  // Users / Students
  getUsers: async (params?: UserListParams): Promise<ApiResponse<PaginatedUsersData>> => {
    return apiClient.get('/students', { params });
  },
  getUserById: async (id: string): Promise<ApiResponse<StudentUser>> => {
    return apiClient.get(`/students/${id}`);
  },
  updateUser: async (id: string, data: Partial<StudentUser>): Promise<ApiResponse<StudentUser>> => {
    return apiClient.put(`/students/${id}`, data);
  },
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/students/${id}`);
  },

  // Exam & Practice Sessions
  getSessions: async (params?: SessionListParams): Promise<ApiResponse<PaginatedSessionsData>> => {
    return apiClient.get('/practice-sessions', { params: { ...params, admin: true } });
  },
  getSessionDetails: async (id: string): Promise<ApiResponse<{ session: AdminExamSession }>> => {
    return apiClient.get(`/practice-sessions/${id}`);
  },

  // Anti-Cheat & Integrity
  getIntegrityLogs: async (params?: IntegrityListParams): Promise<ApiResponse<PaginatedIntegrityData>> => {
    return apiClient.get('/integrity', { params });
  },
  getSessionIntegrity: async (sessionId: string): Promise<ApiResponse<IntegrityLogItem[]>> => {
    return apiClient.get(`/integrity/session/${sessionId}`);
  },

  // Platform Analytics & Mastery
  getPlatformStats: async (): Promise<ApiResponse<PlatformAnalyticsData>> => {
    return apiClient.get('/analytics/platform');
  },
  getCourseStats: async (courseId: string): Promise<ApiResponse<CourseAnalyticsData>> => {
    return apiClient.get(`/analytics/course/${courseId}`);
  },
};
