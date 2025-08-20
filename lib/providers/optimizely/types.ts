export interface OptimizelyContentType {
  key: string;
  displayName: string;
  description: string;
  baseType: string;
  source: string;
  sortOrder: number;
  mayContainTypes: string[];
  properties: Record<string, OptimizelyProperty>;
  etag?: string | null;
}

export interface OptimizelyProperty {
  type: string;
  displayName: string;
  required: boolean;
  description?: string;
}

export interface OptimizelyContentTypeResponse extends OptimizelyContentType {
  etag: string | null;
}

export interface OptimizelyValidation {
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  customValidators?: string[];
  errorMessage?: string;
}

export interface OptimizelyResponse<T = any> {
  data?: T;
  error?: OptimizelyError;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface OptimizelyError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class OptimizelyConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizelyConnectionError';
  }
}

export class OptimizelyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizelyValidationError';
  }
}

export class OptimizelyTransformationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizelyTransformationError';
  }
}