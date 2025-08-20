import pLimit from 'p-limit';
import { OptimizelyContentType, OptimizelyContentTypeResponse } from '../../providers/optimizely/types';
import { SyncHistoryManager, SyncStatus } from '../tracking/SyncHistoryManager';
import { SyncSnapshot } from '../tracking/SyncSnapshot';
import { PrismaClient } from '@/lib/generated/prisma';

export interface OptimizelyConfig {
  baseUrl?: string;
  apiVersion?: string;
  clientId?: string;
  clientSecret?: string;
  projectId?: string;
  rateLimit?: number;
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
  private syncHistoryManager?: SyncHistoryManager;
  private syncSnapshot?: SyncSnapshot;
  private deploymentId?: string;

  constructor(config: OptimizelyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.cms.optimizely.com';
    this.apiVersion = config.apiVersion || 'preview3';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.projectId = config.projectId;
    
    this.rateLimiter = pLimit(2);
  }

  /**
   * Initialize sync tracking capabilities
   */
  initializeSyncTracking(prisma: PrismaClient, deploymentId?: string): void {
    this.syncHistoryManager = new SyncHistoryManager(prisma);
    this.syncSnapshot = new SyncSnapshot();
    this.deploymentId = deploymentId;
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
      let syncId: string | undefined;
      const startTime = Date.now();
      
      try {
        // Record sync attempt if tracking is enabled
        if (this.syncHistoryManager && this.syncSnapshot) {
          const versionHash = await this.syncHistoryManager.getVersionHash(contentType);
          const snapshot = await this.syncSnapshot.captureSnapshot(contentType);
          
          syncId = await this.syncHistoryManager.recordSyncAttempt({
            typeKey: contentType.key,
            versionHash,
            targetPlatform: 'optimizely',
            syncDirection: 'PUSH',
            data: snapshot,
            deploymentId: this.deploymentId,
            metadata: {
              operation: 'create',
              timestamp: new Date().toISOString(),
              duration: null
            }
          });
        }
        
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
        
        // Update sync status on success
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId, 
            SyncStatus.SUCCESS, 
            { ...response, duration }
          );
        }
        
        return response;
      } catch (error) {
        const fetchError = error as FetchError;
        
        // Update sync status on failure
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId, 
            SyncStatus.FAILED, 
            { duration, errorDetails: fetchError.response },
            fetchError
          );
        }
        
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
    contentType: Partial<OptimizelyContentType> | OptimizelyContentType,
    etag?: string,
    options?: { retryAttempts?: number; partialUpdate?: boolean }
  ): Promise<OptimizelyContentTypeResponse> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would update content type: ${key}`);
      return { ...contentType, etag: etag || null } as OptimizelyContentTypeResponse;
    }
    
    const maxRetries = options?.retryAttempts ?? 3;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount < maxRetries) {
      try {
        return await this.performUpdate(key, contentType, etag, options?.partialUpdate);
      } catch (error) {
        const fetchError = error as FetchError;
        lastError = fetchError;
        
        // Handle transient failures with retry
        if (this.isTransientError(fetchError)) {
          retryCount++;
          if (retryCount < maxRetries) {
            const delay = this.calculateRetryDelay(retryCount);
            console.log(`⏳ Retrying update for ${key} in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Handle concurrent modification - fetch latest and retry once
        if (fetchError.status === 412 && retryCount === 0) {
          console.log(`🔄 Concurrent modification detected for ${key}, fetching latest version...`);
          try {
            const latest = await this.getContentType(key);
            if (latest?.etag) {
              retryCount++;
              return await this.performUpdate(key, contentType, latest.etag, options?.partialUpdate);
            }
          } catch (refreshError) {
            console.error(`❌ Failed to refresh content type ${key}:`, refreshError);
          }
        }
        
        // Non-retryable error or max retries reached
        throw error;
      }
    }
    
    throw lastError || new Error(`Failed to update content type ${key} after ${maxRetries} attempts`);
  }

  private async performUpdate(
    key: string,
    contentType: Partial<OptimizelyContentType> | OptimizelyContentType,
    etag?: string,
    partialUpdate?: boolean
  ): Promise<OptimizelyContentTypeResponse> {
    return this.rateLimiter(async () => {
      let syncId: string | undefined;
      const startTime = Date.now();
      
      try {
        // Record sync attempt if tracking is enabled
        if (this.syncHistoryManager && this.syncSnapshot) {
          const versionHash = await this.syncHistoryManager.getVersionHash(contentType);
          const snapshot = await this.syncSnapshot.captureSnapshot(contentType);
          
          syncId = await this.syncHistoryManager.recordSyncAttempt({
            typeKey: key,
            versionHash,
            targetPlatform: 'optimizely',
            syncDirection: 'PUSH',
            data: snapshot,
            deploymentId: this.deploymentId,
            metadata: {
              operation: 'UPDATE',
              etag,
              partialUpdate: partialUpdate ?? false,
              timestamp: new Date().toISOString(),
              duration: null
            }
          });
        }
        
        console.log(`📤 Updating content type: ${key}${partialUpdate ? ' (partial)' : ''}`);
        const headers: HeadersInit = {
          'Content-Type': 'application/json-patch+json',
        };
        if (etag) {
          headers['If-Match'] = etag;
        }
        
        // Build JSON Patch document based on provided fields
        const patchDocument = this.buildPatchDocument(contentType, partialUpdate);
        
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
        
        // Update sync status on success
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId, 
            SyncStatus.SUCCESS, 
            { ...response, duration }
          );
        }
        
        return response;
      } catch (error) {
        const fetchError = error as FetchError;
        
        // Update sync status on failure
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId, 
            SyncStatus.FAILED, 
            { duration, errorDetails: fetchError.response },
            fetchError
          );
        }
        
        if (fetchError.status === 412) {
          console.error(`⚠️  Content type ${key} has been modified externally.`);
          throw Object.assign(new Error(`Precondition failed for ${key}`), { status: 412 });
        }
        if (fetchError.status === 415) {
          console.error(`⚠️  Content type ${key} update failed - invalid media type.`);
          throw Object.assign(new Error(`Invalid media type for ${key}`), { status: 415 });
        }
        
        this.handleApiError(fetchError, 'update', key);
        throw error;
      }
    });
  }

  private buildPatchDocument(
    contentType: Partial<OptimizelyContentType> | OptimizelyContentType,
    partialUpdate?: boolean
  ): Array<{ op: string; path: string; value: any }> {
    const patches: Array<{ op: string; path: string; value: any }> = [];
    
    if (partialUpdate) {
      // Only update provided fields
      if ('displayName' in contentType && contentType.displayName !== undefined) {
        patches.push({ op: 'replace', path: '/displayName', value: contentType.displayName });
      }
      if ('description' in contentType && contentType.description !== undefined) {
        patches.push({ op: 'replace', path: '/description', value: contentType.description });
      }
      if ('properties' in contentType && contentType.properties !== undefined) {
        patches.push({ op: 'replace', path: '/properties', value: contentType.properties });
      }
      if ('baseType' in contentType && contentType.baseType !== undefined) {
        patches.push({ op: 'replace', path: '/baseType', value: contentType.baseType });
      }
    } else {
      // Full update - replace all fields
      patches.push(
        { op: 'replace', path: '/displayName', value: contentType.displayName || '' },
        { op: 'replace', path: '/description', value: contentType.description || '' },
        { op: 'replace', path: '/properties', value: contentType.properties || [] }
      );
      if ('baseType' in contentType) {
        patches.push({ op: 'replace', path: '/baseType', value: contentType.baseType });
      }
    }
    
    return patches;
  }

  private isTransientError(error: FetchError): boolean {
    // Transient errors that should be retried
    return (
      error.status === 429 || // Rate limited
      error.status === 502 || // Bad Gateway
      error.status === 503 || // Service Unavailable
      error.status === 504 || // Gateway Timeout
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND')
    );
  }

  private calculateRetryDelay(attemptNumber: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    const jitter = Math.random() * 500; // Add up to 500ms jitter
    return exponentialDelay + jitter;
  }

  async deleteContentType(
    key: string,
    options?: {
      checkDependencies?: boolean;
      softDelete?: boolean;
      cascadeDelete?: boolean;
      requireConfirmation?: boolean;
    }
  ): Promise<void> {
    if (this.dryRun) {
      console.log(`🔍 [DRY RUN] Would delete content type: ${key}`);
      return;
    }
    
    const checkDeps = options?.checkDependencies ?? true;
    const softDelete = options?.softDelete ?? false;
    const cascadeDelete = options?.cascadeDelete ?? false;
    
    return this.rateLimiter(async () => {
      let syncId: string | undefined;
      const startTime = Date.now();
      
      try {
        // Check for dependencies if requested
        if (checkDeps) {
          const dependencies = await this.checkContentTypeDependencies(key);
          if (dependencies.length > 0) {
            if (!cascadeDelete) {
              const depList = dependencies.join(', ');
              throw new Error(
                `Cannot delete ${key}: has dependent types [${depList}]. Use cascade delete or remove dependencies first.`
              );
            }
            
            // Require explicit confirmation for cascade delete
            if (options?.requireConfirmation) {
              console.log(`⚠️  Cascade delete will remove ${dependencies.length} dependent types: ${dependencies.join(', ')}`);
              // In a real implementation, this would trigger a UI confirmation
              // For now, we'll proceed if cascadeDelete is true
            }
            
            // Delete dependent types first
            console.log(`🔄 Cascade deleting ${dependencies.length} dependent types...`);
            for (const depKey of dependencies) {
              await this.deleteContentType(depKey, { 
                ...options, 
                checkDependencies: false // Avoid infinite recursion
              });
            }
          }
        }
        
        // Record sync attempt if tracking is enabled
        if (this.syncHistoryManager && this.syncSnapshot) {
          const contentType = await this.getContentType(key);
          if (contentType) {
            const versionHash = await this.syncHistoryManager.getVersionHash(contentType);
            const snapshot = await this.syncSnapshot.captureSnapshot(contentType);
            
            syncId = await this.syncHistoryManager.recordSyncAttempt({
              typeKey: key,
              versionHash,
              targetPlatform: 'optimizely',
              syncDirection: 'PUSH',
              data: snapshot,
              deploymentId: this.deploymentId,
              metadata: {
                operation: 'DELETE',
                softDelete,
                cascadeDelete,
                timestamp: new Date().toISOString(),
                duration: null
              }
            });
          }
        }
        
        if (softDelete) {
          // Soft delete - mark as deleted without actually removing
          console.log(`🗑️  Soft deleting content type: ${key}`);
          await this.performSoftDelete(key);
        } else {
          // Hard delete - actually remove from Optimizely
          console.log(`🗑️  Deleting content type: ${key}`);
          await this.makeRequest<void>(
            `/contenttypes/${key}`,
            { method: 'DELETE' },
            `deleteContentType-${key}`
          );
        }
        
        console.log(`✅ ${softDelete ? 'Soft deleted' : 'Deleted'} content type: ${key}`);
        
        // Update sync status on success
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId,
            SyncStatus.SUCCESS,
            { duration, deleted: true }
          );
        }
      } catch (error) {
        const fetchError = error as FetchError;
        
        // Update sync status on failure
        if (syncId && this.syncHistoryManager) {
          const duration = Date.now() - startTime;
          await this.syncHistoryManager.updateSyncStatus(
            syncId,
            SyncStatus.FAILED,
            { duration, errorDetails: fetchError.response },
            fetchError
          );
        }
        
        if (fetchError.status === 404) {
          console.log(`⚠️  Content type ${key} not found in Optimizely`);
          return;
        }
        
        this.handleApiError(fetchError, 'delete', key);
        throw error;
      }
    });
  }

  private async checkContentTypeDependencies(key: string): Promise<string[]> {
    // Check for content types that depend on this type
    const dependencies: Set<string> = new Set();
    
    try {
      // Get all content types to check for dependencies
      const allTypes = await this.getContentTypes();
      
      for (const type of allTypes) {
        // Check if this type inherits from the type we're deleting
        if (type.baseType === key) {
          dependencies.add(type.key);
        }
        
        // Check if this type has properties that reference the key we're deleting
        // Note: OptimizelyProperty interface doesn't have settings field for allowedTypes
        // This would need to be extended in the future if reference validation is needed
      }
    } catch (error) {
      console.warn(`⚠️  Could not check dependencies for ${key}:`, error);
      // Continue with deletion if we can't check dependencies
    }
    
    return Array.from(dependencies);
  }

  private async performSoftDelete(key: string): Promise<void> {
    // Soft delete implementation - rename the type to mark it as deleted
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deletedKey = `${key}_DELETED_${timestamp}`;
    
    try {
      const contentType = await this.getContentType(key);
      if (contentType) {
        // Update the type with a deleted marker
        await this.updateContentType(
          key,
          {
            displayName: `[DELETED] ${contentType.displayName}`,
            description: `Soft deleted on ${new Date().toISOString()}. Original: ${contentType.description || ''}`,
          },
          contentType.etag || undefined,
          { partialUpdate: true }
        );
      }
    } catch (error) {
      console.error(`❌ Failed to soft delete ${key}:`, error);
      throw error;
    }
  }

  async restoreDeletedContentType(key: string): Promise<OptimizelyContentTypeResponse> {
    // Restore a soft-deleted content type
    try {
      const contentType = await this.getContentType(key);
      if (!contentType) {
        throw new Error(`Content type ${key} not found`);
      }
      
      if (!contentType.displayName?.startsWith('[DELETED]')) {
        console.log(`ℹ️  Content type ${key} is not soft-deleted`);
        return contentType;
      }
      
      // Remove the deleted marker
      const originalDisplayName = contentType.displayName.replace('[DELETED] ', '');
      const descMatch = contentType.description?.match(/Original: (.*)$/);
      const originalDescription = descMatch ? descMatch[1] : contentType.description;
      
      const restored = await this.updateContentType(
        key,
        {
          displayName: originalDisplayName,
          description: originalDescription || '',
        },
        contentType.etag || undefined,
        { partialUpdate: true }
      );
      
      console.log(`♻️  Restored content type: ${key}`);
      return restored;
    } catch (error) {
      console.error(`❌ Failed to restore ${key}:`, error);
      throw error;
    }
  }

  async massDeleteProtection(keys: string[]): Promise<boolean> {
    // Prevent accidental mass deletion
    const MAX_DELETE_WITHOUT_CONFIRMATION = 5;
    
    if (keys.length > MAX_DELETE_WITHOUT_CONFIRMATION) {
      console.warn(
        `⚠️  Attempting to delete ${keys.length} content types. ` +
        `This exceeds the safety limit of ${MAX_DELETE_WITHOUT_CONFIRMATION}.`
      );
      // In a real implementation, this would require explicit user confirmation
      // For now, we'll return false to prevent mass deletion
      return false;
    }
    
    return true;
  }

  // Batch Operations
  async batchUpdateContentTypes(
    updates: Array<{
      key: string;
      contentType: Partial<OptimizelyContentType> | OptimizelyContentType;
      etag?: string;
    }>,
    options?: {
      maxBatchSize?: number;
      chunkSize?: number;
      chunkDelay?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    successful: Array<{ key: string; result: OptimizelyContentTypeResponse }>;
    failed: Array<{ key: string; error: string }>;
    rollbackStatus?: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  }> {
    const maxBatchSize = options?.maxBatchSize ?? 50;
    const chunkSize = options?.chunkSize ?? 10;
    const chunkDelay = options?.chunkDelay ?? 500;
    
    if (updates.length > maxBatchSize) {
      throw new Error(`Batch size ${updates.length} exceeds maximum of ${maxBatchSize}`);
    }
    
    // Validate each item in the batch
    for (const update of updates) {
      if (!update.key || typeof update.key !== 'string') {
        throw new Error(`Invalid key in batch update: ${update.key}`);
      }
      if (!update.contentType || typeof update.contentType !== 'object') {
        throw new Error(`Invalid content type for key ${update.key}`);
      }
    }
    
    const results = {
      successful: [] as Array<{ key: string; result: OptimizelyContentTypeResponse }>,
      failed: [] as Array<{ key: string; error: string }>
    };
    
    const transactionLog: Array<{
      key: string;
      previousState?: OptimizelyContentTypeResponse;
      operation: 'UPDATE';
    }> = [];
    
    try {
      // Process in chunks with delay between chunks
      const chunks = this.chunkArray(updates, chunkSize);
      let totalProcessed = 0;
      
      for (const chunk of chunks) {
        // Parallel processing within chunk using existing rate limiter
        const chunkPromises = chunk.map(async (update) => {
          try {
            // Store previous state for rollback
            const previousState = await this.getContentType(update.key);
            if (previousState) {
              transactionLog.push({
                key: update.key,
                previousState,
                operation: 'UPDATE'
              });
            }
            
            const result = await this.updateContentType(
              update.key,
              update.contentType,
              update.etag || undefined,
              { partialUpdate: true }
            );
            
            results.successful.push({ key: update.key, result });
            return { success: true, key: update.key };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.failed.push({ key: update.key, error: errorMessage });
            throw new Error(`Failed to update ${update.key}: ${errorMessage}`);
          }
        });
        
        // Wait for chunk to complete
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        totalProcessed += chunk.length;
        if (options?.onProgress) {
          options.onProgress(totalProcessed, updates.length);
        }
        
        // Check if any failed - retry failed items once before rollback
        const failedItems = chunkResults
          .map((result, index) => ({ result, item: chunk[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ item }) => item);
        
        if (failedItems.length > 0) {
          console.log(`⏳ Retrying ${failedItems.length} failed items...`);
          const retryPromises = failedItems.map(async (update) => {
            try {
              const result = await this.updateContentType(
                update.key,
                update.contentType,
                update.etag || undefined,
                { partialUpdate: true, retryAttempts: 1 }
              );
              results.successful.push({ key: update.key, result });
              return { success: true, key: update.key };
            } catch (error) {
              // Still failed after retry
              return { success: false, key: update.key, error };
            }
          });
          
          const retryResults = await Promise.allSettled(retryPromises);
          const stillFailed = retryResults.filter(r => r.status === 'rejected').length > 0;
          
          if (stillFailed) {
            console.error('❌ Batch update failed after retry, initiating rollback...');
            const rollbackStatus = await this.rollbackBatchOperation(transactionLog);
            return { ...results, rollbackStatus };
          }
        }
        
        // Delay between chunks
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, chunkDelay));
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Batch update encountered error:', error);
      const rollbackStatus = await this.rollbackBatchOperation(transactionLog);
      return { ...results, rollbackStatus };
    }
  }

  async batchDeleteContentTypes(
    keys: string[],
    options?: {
      maxBatchSize?: number;
      chunkSize?: number;
      chunkDelay?: number;
      softDelete?: boolean;
      checkDependencies?: boolean;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<{
    successful: string[];
    failed: Array<{ key: string; error: string }>;
    rollbackStatus?: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  }> {
    const maxBatchSize = options?.maxBatchSize ?? 50;
    const chunkSize = options?.chunkSize ?? 10;
    const chunkDelay = options?.chunkDelay ?? 500;
    
    if (keys.length > maxBatchSize) {
      throw new Error(`Batch size ${keys.length} exceeds maximum of ${maxBatchSize}`);
    }
    
    // Validate each key in the batch
    for (const key of keys) {
      if (!key || typeof key !== 'string' || key.trim().length === 0) {
        throw new Error(`Invalid key in batch delete: "${key}"`);
      }
    }
    
    // Check mass delete protection
    const canProceed = await this.massDeleteProtection(keys);
    if (!canProceed) {
      throw new Error('Mass deletion blocked by safety limit');
    }
    
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ key: string; error: string }>
    };
    
    const transactionLog: Array<{
      key: string;
      previousState?: OptimizelyContentTypeResponse;
      operation: 'DELETE';
    }> = [];
    
    try {
      // Store all states before deletion for potential rollback
      for (const key of keys) {
        try {
          const previousState = await this.getContentType(key);
          if (previousState) {
            transactionLog.push({
              key,
              previousState,
              operation: 'DELETE'
            });
          }
        } catch (error) {
          // Type might not exist, continue
        }
      }
      
      // Process deletions in chunks
      const chunks = this.chunkArray(keys, chunkSize);
      let totalProcessed = 0;
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (key) => {
          try {
            await this.deleteContentType(key, {
              softDelete: options?.softDelete,
              checkDependencies: options?.checkDependencies,
              cascadeDelete: false
            });
            
            results.successful.push(key);
            return { success: true, key };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.failed.push({ key, error: errorMessage });
            throw new Error(`Failed to delete ${key}: ${errorMessage}`);
          }
        });
        
        // Wait for chunk to complete
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        totalProcessed += chunk.length;
        if (options?.onProgress) {
          options.onProgress(totalProcessed, keys.length);
        }
        
        // Check if any failed - if so, trigger rollback
        const hasFailures = chunkResults.some(r => r.status === 'rejected');
        if (hasFailures) {
          console.error('❌ Batch delete failed, initiating rollback...');
          const rollbackStatus = await this.rollbackBatchOperation(transactionLog);
          return { ...results, rollbackStatus };
        }
        
        // Delay between chunks
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, chunkDelay));
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Batch delete encountered error:', error);
      const rollbackStatus = await this.rollbackBatchOperation(transactionLog);
      return { ...results, rollbackStatus };
    }
  }

  private async rollbackBatchOperation(
    transactionLog: Array<{
      key: string;
      previousState?: OptimizelyContentTypeResponse;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
    }>
  ): Promise<'COMPLETED' | 'PARTIAL' | 'FAILED'> {
    console.log(`🔄 Rolling back ${transactionLog.length} operations...`);
    let successfulRollbacks = 0;
    let failedRollbacks = 0;
    
    // Process rollbacks in reverse order
    for (const entry of transactionLog.reverse()) {
      try {
        switch (entry.operation) {
          case 'UPDATE':
            if (entry.previousState) {
              await this.updateContentType(
                entry.key,
                entry.previousState,
                entry.previousState.etag || undefined
              );
              console.log(`  ✅ Rolled back UPDATE for ${entry.key}`);
              successfulRollbacks++;
            }
            break;
            
          case 'DELETE':
            if (entry.previousState) {
              // Re-create the deleted type
              await this.createContentType(entry.previousState);
              console.log(`  ✅ Rolled back DELETE for ${entry.key}`);
              successfulRollbacks++;
            }
            break;
            
          case 'CREATE':
            // Delete the created type
            await this.deleteContentType(entry.key, {
              checkDependencies: false
            });
            console.log(`  ✅ Rolled back CREATE for ${entry.key}`);
            successfulRollbacks++;
            break;
        }
      } catch (error) {
        console.error(`  ❌ Failed to rollback ${entry.operation} for ${entry.key}:`, error);
        failedRollbacks++;
      }
    }
    
    if (failedRollbacks === 0) {
      console.log('✅ Rollback completed successfully');
      return 'COMPLETED';
    } else if (successfulRollbacks > 0) {
      console.log(`⚠️  Partial rollback: ${successfulRollbacks} succeeded, ${failedRollbacks} failed`);
      return 'PARTIAL';
    } else {
      console.log('❌ Rollback failed completely');
      return 'FAILED';
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
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