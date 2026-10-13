export interface Department {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  createdBy: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
}
