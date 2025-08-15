import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import pLimit from 'p-limit';
import { OptimizelyContentType } from '../transformers/optimizely-transformer';

export interface OptimizelyConfig {
  baseUrl?: string;
  apiVersion?: string;
  clientId?: string;
  clientSecret?: string;
  projectId?: string;
  rateLimit?: number;
}

export interface OptimizelyContentTypeResponse extends OptimizelyContentType {
  etag: string | null;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class OptimizelyApiClient {
  private baseUrl: string;
  private apiVersion: string;
  private clientId?: string;
  private clientSecret?: string;
  private projectId?: string;
  private dryRun: boolean = false;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private rateLimiter: pLimit.Limit;
  private axiosInstance: AxiosInstance;

  constructor(config: OptimizelyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.cms.optimizely.com';
    this.apiVersion = config.apiVersion || 'preview3';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.projectId = config.projectId;
    
    this.rateLimiter = pLimit(2);
    
    this.axiosInstance = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureAuthenticated();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
  }

  setDryRun(value: boolean): void {
    this.dryRun = value;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }
    
    await this.authenticate();
  }

  async authenticate(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      console.log('⚠️  No Optimizely credentials configured - running in offline mode');
      return;
    }
    
    if (this.accessToken) {
      return;
    }
    
    try {
      console.log('🔐 Authenticating with Optimizely OAuth 2.0...');
      
      const tokenUrl = `${this.baseUrl}/oauth/token`;
      const response = await axios.post<TokenResponse>(tokenUrl, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 300;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 30) * 1000);
      
      console.log('✅ OAuth authentication successful');
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ OAuth authentication failed:', axiosError.response?.data || axiosError.message);
      throw new Error(`Authentication failed: ${axiosError.message}`);
    }
  }

  async listContentTypes(): Promise<OptimizelyContentTypeResponse[]> {
    if (this.dryRun) {
      console.log('[DRY-RUN] Would fetch content types from Optimizely');
      return [];
    }
    
    return this.rateLimiter(async () => {
      try {
        const response = await this.axiosInstance.get('/contenttypes', {
          params: {
            pageSize: 100
          }
        });
        
        const contentTypes = response.data.items || [];
        
        return contentTypes.map((ct: OptimizelyContentType) => ({
          ...ct,
          etag: response.headers.etag || null
        }));
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 403) {
          console.warn('⚠️  Access denied to Optimizely API - check permissions');
          return [];
        }
        throw error;
      }
    });
  }

  async getContentType(key: string): Promise<OptimizelyContentTypeResponse | null> {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would fetch content type: ${key}`);
      return null;
    }
    
    return this.rateLimiter(async () => {
      try {
        const response = await this.axiosInstance.get(`/contenttypes/${key}`);
        return {
          ...response.data,
          etag: response.headers.etag || null
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          return null;
        }
        throw error;
      }
    });
  }

  async createContentType(contentType: OptimizelyContentType): Promise<OptimizelyContentTypeResponse> {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would create content type: ${contentType.key}`);
      return { ...contentType, etag: null };
    }
    
    return this.rateLimiter(async () => {
      try {
        const response = await this.axiosInstance.post('/contenttypes', contentType);
        return {
          ...response.data,
          etag: response.headers.etag || null
        };
      } catch (error) {
        this.handleApiError(error as AxiosError, 'create', contentType.key);
        throw error;
      }
    });
  }

  async updateContentType(key: string, contentType: Partial<OptimizelyContentType>, etag?: string): Promise<OptimizelyContentTypeResponse> {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would update content type: ${key}`);
      return { ...contentType, etag: null } as OptimizelyContentTypeResponse;
    }
    
    return this.rateLimiter(async () => {
      try {
        const headers: Record<string, string> = {};
        if (etag) {
          headers['If-Match'] = etag;
        }
        
        const response = await this.axiosInstance.patch(
          `/contenttypes/${key}`,
          contentType,
          { 
            headers: {
              ...headers,
              'Content-Type': 'application/merge-patch+json'
            }
          }
        );
        
        return {
          ...response.data,
          etag: response.headers.etag || null
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 412) {
          throw new Error(`Content type ${key} has been modified - conflict detected`);
        }
        this.handleApiError(axiosError, 'update', key);
        throw error;
      }
    });
  }

  async deleteContentType(key: string): Promise<boolean> {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would delete content type: ${key}`);
      return true;
    }
    
    return this.rateLimiter(async () => {
      try {
        await this.axiosInstance.delete(`/contenttypes/${key}`);
        return true;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          return false;
        }
        this.handleApiError(axiosError, 'delete', key);
        throw error;
      }
    });
  }

  private handleApiError(error: AxiosError, operation: string, key: string): void {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.detail || error.message;
    
    if (status === 400) {
      const validationErrors = (error.response?.data as any)?.errors || {};
      const errorMessages = Object.entries(validationErrors)
        .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
        .join('; ');
      throw new Error(`Validation failed for ${key}: ${errorMessages || message}`);
    } else if (status === 403) {
      throw new Error(`Permission denied to ${operation} ${key}`);
    } else if (status === 429) {
      throw new Error('Rate limit exceeded - please retry later');
    } else {
      throw new Error(`Failed to ${operation} ${key}: ${message}`);
    }
  }
}