// Base response types
export type ApiResponse<T> = 
  | { data: T }
  | { error: ApiError };

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Website model types
export interface Website {
  id: string;
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteRequest {
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface UpdateWebsiteRequest extends Partial<CreateWebsiteRequest> {}

// Pagination types for future use
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}