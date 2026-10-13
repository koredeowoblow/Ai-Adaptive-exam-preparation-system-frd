export interface AuthUser {
  id: string;
  name: string;
  email: string;
  departmentId?: string;
  level?: '100L' | '200L' | '300L' | '400L';
  isOnboarded?: boolean;
  role?: 'student' | 'admin' | 'superAdmin';
}


export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

export interface GetMeResponse {
  success: boolean;
  data: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
