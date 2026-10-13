import { apiClient } from '../../../shared/api-client/client';
import type { AuthResponse, LoginPayload, RegisterPayload, GetMeResponse } from '../../../types/auth.types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', payload);
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', payload);
  },
  
  getMe: async (): Promise<GetMeResponse> => {
    return apiClient.get('/auth/me');
  },

  logout: async () => {
    // TODO: backend must clear the HttpOnly auth cookie on logout (POST /auth/logout).
    // The cookie cannot be deleted from frontend JS \u2014 the server must set it with Max-Age=0.
    return apiClient.post('/auth/logout');
  }
};
