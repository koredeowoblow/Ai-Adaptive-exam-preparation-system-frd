export interface Course {
  _id: string;
  departmentId: string;
  code: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDTO {
  departmentId: string;
  code: string;
  title: string;
  description?: string;
}

export interface UpdateCourseDTO {
  departmentId?: string;
  code?: string;
  title?: string;
  description?: string;
}
