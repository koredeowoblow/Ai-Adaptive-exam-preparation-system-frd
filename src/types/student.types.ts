export interface StudentUser {
  _id: string;
  name: string;
  email: string;
  departmentId?: {
    _id: string;
    name: string;
  } | string;
  level?: '100L' | '200L' | '300L' | '400L';
  enrolledCourseIds?: Array<{
    _id: string;
    title: string;
    code: string;
  } | string>;
  roleIds?: Array<{
    _id: string;
    name: string;
    slug: string;
  } | string>;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}
