import { apiClient } from '../../../shared/api-client/client';

export type IntegrityEventType = 
  | 'WINDOW_BLUR' 
  | 'VISIBILITY_CHANGE' 
  | 'COPY_ATTEMPT' 
  | 'PASTE_ATTEMPT' 
  | 'CUT_ATTEMPT' 
  | 'MOUSE_LEAVE'
  | 'CONTEXT_MENU';

export interface LogViolationPayload {
  sessionId: string;
  eventType: IntegrityEventType;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const integrityApi = {
  logViolation: async (payload: LogViolationPayload): Promise<ApiResponse<any>> => {
    return apiClient.post('/integrity/log', payload);
  },
};
