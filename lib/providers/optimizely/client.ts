import { 
  OptimizelyContentType, 
  OptimizelyResponse,
  OptimizelyError 
} from './types';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FetchError extends Error {
  status?: number;
  response?: any;
}

export class OptimizelyClient {
  private baseUrl: string;
  private apiVersion: string;
  private clientId?: string;
  private clientSecret?: string;
  private projectId?: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private activeRequests = new Map<string, AbortController>();
  private dryRun: boolean = false;

  constructor() {
    this.baseUrl = process.env.OPTIMIZELY_API_URL || 'https://api.cms.optimizely.com';
    this.apiVersion = 'preview3';
    this.clientId = process.env.OPTIMIZELY_CLIENT_ID;
    this.clientSecret = process.env.OPTIMIZELY_CLIENT_SECRET;
    this.projectId = process.env.OPTIMIZELY_PROJECT_ID;
  }

  setDryRun(enabled: boolean): void {
    this.dryRun = enabled;
    if (enabled) {
      console.log('🔍 OptimizelyClient: Dry run mode enabled - no API calls will be made');
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }
    
    await this.authenticate();
  }

  async authenticate(): Promise<void> {
    if (this.dryRun) {
      console.log('🔍 Dry run mode: Skipping authentication');
      return;
    }

    if (!this.clientId || !this.clientSecret) {
      console.log('⚠️  No Optimizely credentials configured - running in offline mode');
      return;
    }
    
    if (this.accessToken) {
      return;
    }
    
    try {
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
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      const expiryBuffer = 60; // Refresh token 1 minute before expiry
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - expiryBuffer) * 1000);
      
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<T> {
    // In dry run mode, return mock responses
    if (this.dryRun) {
      return this.getMockResponse<T>(path, options);
    }

    await this.ensureAuthenticated();

    const controller = new AbortController();
    if (requestKey) {
      const existingController = this.activeRequests.get(requestKey);
      if (existingController) {
        existingController.abort();
      }
      this.activeRequests.set(requestKey, controller);
    }

    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const url = `${this.baseUrl}/${this.apiVersion}${path}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
          ...(this.projectId && { 'x-project-id': this.projectId }),
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

  private getMockResponse<T>(path: string, options: RequestInit): T {
    console.log(`🔍 [DRY-RUN] ${options.method || 'GET'} ${path}`);
    
    // Mock responses based on path and method
    if (path === '/contenttypes' && options.method === 'GET') {
      return { items: [] } as any;
    }
    
    if (path.startsWith('/contenttypes/') && options.method === 'GET') {
      return null as any;
    }
    
    if (path === '/contenttypes' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      console.log(`  ✓ Would create content type: ${body.displayName}`);
      return { ...body, id: `mock-${Date.now()}` } as any;
    }
    
    if (path.startsWith('/contenttypes/') && (options.method === 'PUT' || options.method === 'PATCH')) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const id = path.split('/').pop();
      console.log(`  ✓ Would update content type: ${id}`);
      return { ...body, id } as any;
    }
    
    if (path.startsWith('/contenttypes/') && options.method === 'DELETE') {
      const id = path.split('/').pop();
      console.log(`  ✓ Would delete content type: ${id}`);
      return true as any;
    }
    
    if (path === '/contenttypes/validate' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      console.log(`  ✓ Would validate content type: ${body.displayName || body.key}`);
      return { isValid: true, errors: [], warnings: [] } as any;
    }
    
    // Default mock response
    return {} as T;
  }

  async getContentTypes(): Promise<OptimizelyContentType[]> {
    try {
      const response = await this.makeRequest<any>(
        '/contenttypes',
        { method: 'GET' },
        'getContentTypes'
      );
      
      return response.items || [];
    } catch (error) {
      const fetchError = error as FetchError;
      if (fetchError.status === 403) {
        throw new Error('Access denied to Optimizely API');
      }
      throw error;
    }
  }

  async getContentType(id: string): Promise<OptimizelyContentType | null> {
    try {
      const response = await this.makeRequest<OptimizelyContentType>(
        `/contenttypes/${id}`,
        { method: 'GET' },
        `getContentType-${id}`
      );
      return response;
    } catch (error) {
      const fetchError = error as FetchError;
      if (fetchError.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createContentType(contentType: OptimizelyContentType): Promise<OptimizelyContentType> {
    try {
      const response = await this.makeRequest<OptimizelyContentType>(
        '/contenttypes',
        {
          method: 'POST',
          body: JSON.stringify(contentType),
        },
        `createContentType-${contentType.key}`
      );
      return response;
    } catch (error) {
      const fetchError = error as FetchError;
      if (fetchError.status === 409) {
        const existing = await this.getContentType(contentType.key);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async updateContentType(id: string, contentType: OptimizelyContentType): Promise<OptimizelyContentType> {
    try {
      const patches = this.buildPatchDocument(contentType);
      
      const response = await this.makeRequest<OptimizelyContentType>(
        `/contenttypes/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify(patches),
        },
        `updateContentType-${id}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteContentType(id: string): Promise<boolean> {
    try {
      await this.makeRequest<void>(
        `/contenttypes/${id}`,
        { method: 'DELETE' },
        `deleteContentType-${id}`
      );
      return true;
    } catch (error) {
      const fetchError = error as FetchError;
      if (fetchError.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async validateContentType(contentType: OptimizelyContentType): Promise<{
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const response = await this.makeRequest<any>(
        '/contenttypes/validate',
        {
          method: 'POST',
          body: JSON.stringify(contentType),
        },
        `validateContentType-${contentType.key}`
      );
      
      return {
        isValid: response.isValid || false,
        errors: response.errors || [],
        warnings: response.warnings || []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  private buildPatchDocument(
    contentType: OptimizelyContentType
  ): Array<{ op: string; path: string; value: any }> {
    const patches: Array<{ op: string; path: string; value: any }> = [];
    
    patches.push(
      { op: 'replace', path: '/displayName', value: contentType.displayName || '' },
      { op: 'replace', path: '/description', value: contentType.description || '' },
      { op: 'replace', path: '/properties', value: contentType.properties || [] }
    );
    
    if (contentType.baseType) {
      patches.push({ op: 'replace', path: '/baseType', value: contentType.baseType });
    }
    
    return patches;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      
      if (!this.accessToken) {
        return false;
      }
      
      const types = await this.getContentTypes();
      return true;
    } catch (error) {
      return false;
    }
  }
}