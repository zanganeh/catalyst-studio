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

interface FetchError extends Error {
  status?: number;
  response?: any;
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
  private activeRequests = new Map<string, AbortController>();

  constructor(config: OptimizelyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.cms.optimizely.com';
    this.apiVersion = config.apiVersion || 'preview3';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.projectId = config.projectId;
    
    this.rateLimiter = pLimit(2);
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
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OAuth authentication failed:', errorData);
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      const expiryBuffer = 60; // Refresh token 1 minute before expiry
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - expiryBuffer) * 1000);
      
      console.log('✅ Successfully authenticated with Optimizely');
      console.log(`   Token expires at: ${this.tokenExpiry.toISOString()}`);
    } catch (error) {
      console.error('❌ OAuth authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<T> {
    await this.ensureAuthenticated();

    const controller = new AbortController();
    if (requestKey) {
      // Cancel any existing request with the same key
      const existingController = this.activeRequests.get(requestKey);
      if (existingController) {
        existingController.abort();
      }
      this.activeRequests.set(requestKey, controller);
    }

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const url = `${this.baseUrl}/${this.apiVersion}${path}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (requestKey) {
        this.activeRequests.delete(requestKey);
      }

      if (!response.ok) {
        const error: FetchError = new Error(`Request failed: ${response.statusText}`);
        error.status = response.status;
        error.response = await response.json().catch(() => ({}));
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (requestKey) {
        this.activeRequests.delete(requestKey);
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout: ${path}`);
      }
      throw error;
    }
  }

  async getContentTypes(): Promise<OptimizelyContentTypeResponse[]> {
    return this.rateLimiter(async () => {
      try {
        console.log('📥 Fetching Optimizely content types...');
        
        const response = await this.makeRequest<any>(
          '/contenttypes',
          {
            method: 'GET',
            headers: this.projectId ? { 'x-project-id': this.projectId } : {},
          },
          'getContentTypes'
        );
        
        const contentTypes: OptimizelyContentTypeResponse[] = response.items || [];
        console.log(`✅ Found ${contentTypes.length} content types in Optimizely`);
        return contentTypes;
      } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.status === 403) {
          console.error('❌ Access denied. Check your API credentials and permissions.');
          throw new Error('Access denied to Optimizely API');
        }
        throw error;
      }
    });
  }

  async getContentType(key: string): Promise<OptimizelyContentTypeResponse | null> {
    return this.rateLimiter(async () => {
      try {
        console.log(`📥 Fetching content type: ${key}`);
        const response = await this.makeRequest<OptimizelyContentTypeResponse>(
          `/contenttypes/${key}`,
          { method: 'GET' },
          `getContentType-${key}`
        );
        return response;
      } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.status === 404) {
          return null;
        }
        throw error;
      }
    });
  }

  async createContentType(contentType: OptimizelyContentType): Promise<OptimizelyContentTypeResponse> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would create content type: ${contentType.key}`);
      return { ...contentType, etag: null };
    }
    
    return this.rateLimiter(async () => {
      try {
        console.log(`📤 Creating content type: ${contentType.key}`);
        const response = await this.makeRequest<OptimizelyContentTypeResponse>(
          '/contenttypes',
          {
            method: 'POST',
            body: JSON.stringify(contentType),
          },
          `createContentType-${contentType.key}`
        );
        console.log(`✅ Created content type: ${contentType.key}`);
        return response;
      } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.status === 409) {
          console.log(`⚠️  Content type ${contentType.key} already exists in Optimizely, skipping creation`);
          // Return the existing content type
          const existing = await this.getContentType(contentType.key);
          if (existing) {
            return existing;
          }
        }
        throw error;
      }
    });
  }

  async updateContentType(
    key: string,
    contentType: OptimizelyContentType,
    etag?: string
  ): Promise<OptimizelyContentTypeResponse> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would update content type: ${key}`);
      return { ...contentType, etag: etag || null };
    }
    
    return this.rateLimiter(async () => {
      try {
        console.log(`📤 Updating content type: ${key}`);
        const headers: HeadersInit = {
          'Content-Type': 'application/json-patch+json', // Optimizely expects this for PATCH
        };
        if (etag) {
          headers['If-Match'] = etag;
        }
        
        // Convert to JSON Patch format for Optimizely
        const patchDocument = [
          { op: 'replace', path: '/displayName', value: contentType.displayName },
          { op: 'replace', path: '/description', value: contentType.description || '' },
          { op: 'replace', path: '/properties', value: contentType.properties || [] },
        ];
        
        const response = await this.makeRequest<OptimizelyContentTypeResponse>(
          `/contenttypes/${key}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(patchDocument),
          },
          `updateContentType-${key}`
        );
        console.log(`✅ Updated content type: ${key}`);
        return response;
      } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.status === 412) {
          console.error(`⚠️  Content type ${key} has been modified externally. Skipping update.`);
          throw new Error(`Precondition failed for ${key}`);
        }
        if (fetchError.status === 415) {
          console.error(`⚠️  Content type ${key} update failed - invalid media type. Skipping update.`);
          // Try to return the existing content type
          const existing = await this.getContentType(key);
          if (existing) {
            return existing;
          }
        }
        this.handleApiError(fetchError, 'update', key);
        throw error;
      }
    });
  }

  async deleteContentType(key: string): Promise<void> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would delete content type: ${key}`);
      return;
    }
    
    return this.rateLimiter(async () => {
      try {
        console.log(`🗑️  Deleting content type: ${key}`);
        await this.makeRequest<void>(
          `/contenttypes/${key}`,
          { method: 'DELETE' },
          `deleteContentType-${key}`
        );
        console.log(`✅ Deleted content type: ${key}`);
      } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.status === 404) {
          console.log(`⚠️  Content type ${key} not found in Optimizely`);
          return;
        }
        this.handleApiError(fetchError, 'delete', key);
        throw error;
      }
    });
  }

  private handleApiError(error: FetchError, operation: string, key: string): void {
    console.error(`❌ Failed to ${operation} content type ${key}:`, error.response || error.message);
    
    if (error.status === 401) {
      this.accessToken = null;
      this.tokenExpiry = null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      
      if (!this.accessToken) {
        console.log('⚠️  No authentication token - running in offline mode');
        return false;
      }
      
      const types = await this.getContentTypes();
      console.log(`✅ Successfully connected to Optimizely (found ${types.length} content types)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Optimizely:', error);
      return false;
    }
  }
}