import axios from 'axios';
import pLimit from 'p-limit';

export class OptimizelyApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://api.cms.optimizely.com';
    this.apiVersion = config.apiVersion || 'preview3';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.projectId = config.projectId;
    this.dryRun = false;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    const requestsPerMinute = config.rateLimit || 100;
    // pLimit expects concurrency, not requests per second
    // We'll allow up to 2 concurrent requests to avoid rate limiting
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
          // Use Bearer token for OAuth 2.0
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Don't retry on 401 to avoid infinite loops
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
  }

  setDryRun(value) {
    this.dryRun = value;
  }

  async ensureAuthenticated() {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }
    
    await this.authenticate();
  }

  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      console.log('⚠️  No Optimizely credentials configured - running in offline mode');
      return;
    }
    
    if (this.accessToken) {
      return; // Already authenticated
    }
    
    try {
      console.log('🔐 Authenticating with Optimizely OAuth 2.0...');
      
      const tokenUrl = `${this.baseUrl}/oauth/token`;
      const response = await axios.post(tokenUrl, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 300; // Default 5 minutes
      // Set expiry 30 seconds before actual expiry to avoid edge cases
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 30) * 1000);
      
      console.log('✅ OAuth authentication successful');
    } catch (error) {
      console.error('❌ OAuth authentication failed:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async listContentTypes() {
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
        
        return contentTypes.map(ct => ({
          ...ct,
          etag: response.headers.etag || null
        }));
      } catch (error) {
        if (error.response?.status === 403) {
          console.warn('⚠️  Access denied to Optimizely API - check permissions');
          return [];
        }
        throw error;
      }
    });
  }

  async getContentType(key) {
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
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    });
  }

  async createContentType(contentType) {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would create content type: ${contentType.key}`);
      return contentType;
    }
    
    return this.rateLimiter(async () => {
      try {
        const response = await this.axiosInstance.post('/contenttypes', contentType);
        return {
          ...response.data,
          etag: response.headers.etag || null
        };
      } catch (error) {
        this.handleApiError(error, 'create', contentType.key);
      }
    });
  }

  async updateContentType(key, contentType, etag) {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would update content type: ${key}`);
      return contentType;
    }
    
    return this.rateLimiter(async () => {
      try {
        const headers = {};
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
        if (error.response?.status === 412) {
          throw new Error(`Content type ${key} has been modified - conflict detected`);
        }
        this.handleApiError(error, 'update', key);
      }
    });
  }

  async deleteContentType(key) {
    if (this.dryRun) {
      console.log(`[DRY-RUN] Would delete content type: ${key}`);
      return true;
    }
    
    return this.rateLimiter(async () => {
      try {
        await this.axiosInstance.delete(`/contenttypes/${key}`);
        return true;
      } catch (error) {
        if (error.response?.status === 404) {
          return false;
        }
        this.handleApiError(error, 'delete', key);
      }
    });
  }

  handleApiError(error, operation, key) {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;
    
    if (status === 400) {
      const validationErrors = error.response?.data?.errors || {};
      const errorMessages = Object.entries(validationErrors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
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