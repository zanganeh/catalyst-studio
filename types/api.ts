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
export interface WebsiteSettings {
  primaryColor?: string;
  secondaryColor?: string;
  features?: {
    blog?: boolean;
    shop?: boolean;
    analytics?: boolean;
  };
  [key: string]: any;
}

export interface Website {
  id: string;
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
  icon?: string;
  settings?: WebsiteSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteRequest {
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
  icon?: string;
  settings?: WebsiteSettings;
  isActive?: boolean;
}

export interface UpdateWebsiteRequest extends Partial<CreateWebsiteRequest> {}

// ContentType model types
export interface ContentType {
  id: string;
  websiteId: string;
  name: string;
  fields: any;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

// ContentItem model types
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentItem {
  id: string;
  contentTypeId: string;
  websiteId: string;
  slug?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  status: ContentStatus;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contentType?: ContentType;
  website?: Website;
}

export interface CreateContentItemRequest {
  contentTypeId: string;
  websiteId: string;
  slug?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  status?: ContentStatus;
  publishedAt?: Date | string | null;
}

export interface UpdateContentItemRequest {
  slug?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: ContentStatus;
  publishedAt?: Date | string | null;
}

export interface ContentItemsQuery extends PaginationParams {
  status?: ContentStatus;
  contentTypeId?: string;
  websiteId?: string;
}

export interface ContentItemsResponse extends PaginatedResponse<ContentItem> {
  data: ContentItem[];
}

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
    hasNext: boolean;
    hasPrev: boolean;
  };
}