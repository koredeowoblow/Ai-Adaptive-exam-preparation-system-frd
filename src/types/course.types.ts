export interface Course {
  _id: string;
  departmentId: string;
  code: string;
  title: string;
  description?: string;
  level?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDTO {
  departmentId: string;
  code: string;
  title: string;
  description?: string;
  level?: number;
}

export interface UpdateCourseDTO {
  departmentId?: string;
  code?: string;
  title?: string;
  description?: string;
  level?: number;
}
