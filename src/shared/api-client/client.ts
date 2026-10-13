import axios from 'axios';
import { toast } from 'sonner';

// The backend is running on 3000 locally
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly auth cookie automatically on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// TODO: backend must set token as HttpOnly, SameSite=Strict cookie on login/refresh.
// The browser will automatically send the cookie on every request — no manual token attachment needed.
// Backend must also set: Access-Control-Allow-Credentials: true and Access-Control-Allow-Origin to the exact frontend origin.

// Interceptor for global error handling and 401 redirection
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const pathname = window.location.pathname;
      const isPublicRoute = pathname === '/login' || pathname === '/register';
      const isAuthCheck = error.config?.url?.includes('/auth/me');

      localStorage.removeItem('accessToken');

      if (!isPublicRoute && !isAuthCheck) {
        window.location.href = '/login?error=401-interceptor';
      }
      return Promise.reject(error);
    }

    if (status >= 500) {
      toast.error(error.response?.data?.message || 'Server error. Please try again.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    } else {
      // Handle validation and forbidden errors automatically
      if (error.response?.data?.code === 'VALIDATION_ERROR') {
        toast.error(`Invalid input: ${error.response.data.details || error.response.data.message}`);
      } else if (error.response?.data?.code === 'FORBIDDEN' || status === 403) {
        toast.error(error.response?.data?.message || 'You do not have permission to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return Promise.reject(error);
  }
);
