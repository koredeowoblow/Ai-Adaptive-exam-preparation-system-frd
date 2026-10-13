export interface Topic {
  _id: string;
  courseId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDTO {
  courseId: string;
  name: string;
  order?: number;
}

export interface UpdateTopicDTO {
  name?: string;
  order?: number;
}
