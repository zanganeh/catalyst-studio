/**
 * Service-level types for API responses
 */

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
  meta?: {
    duration?: string;
    options?: any;
  };
}

export enum ErrorCode {
  // Client errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Custom errors
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  INVALID_PATH = 'INVALID_PATH',
  REDIRECT_LOOP = 'REDIRECT_LOOP'
}