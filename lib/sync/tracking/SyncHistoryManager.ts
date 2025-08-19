import { PrismaClient } from '@/lib/generated/prisma';
import { ContentTypeHasher } from '../versioning/ContentTypeHasher';

export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface SyncHistoryFilters {
  typeKey?: string;
  targetPlatform?: string;
  syncStatus?: SyncStatus;
  dateRange?: { start: Date; end: Date };
  deploymentId?: string;
}

export interface SyncRecord {
  id: string;
  typeKey: string;
  versionHash: string;
  targetPlatform: string;
  syncDirection: string;
  syncStatus: string;
  pushedData: string;
  responseData: string | null;
  errorMessage: string | null;
  retryCount: number;
  syncMetadata: string | null;
  deploymentId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,  // 1 second
  maxDelayMs: 30000      // 30 seconds max
};

export class SyncHistoryManager {
  private hasher: ContentTypeHasher;
  private retryConfig: RetryConfig;
  
  constructor(
    private prisma: PrismaClient,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.hasher = new ContentTypeHasher();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }
  
  /**
   * Get version hash for a content type using ContentTypeHasher
   */
  async getVersionHash(contentType: any): Promise<string> {
    return this.hasher.calculateHash(contentType);
  }
  
  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    syncId: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Note: retryCount field doesn't exist in SyncHistory model
        // Would need to store in syncData or add field to schema
        // await this.prisma.syncHistory.update({
        //   where: { id: syncId },
        //   data: { retryCount: attempt }
        // });
        
        if (attempt < this.retryConfig.maxAttempts) {
          // Calculate delay with exponential backoff
          const delay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelayMs
          );
          
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Record a sync attempt with snapshot of data
   */
  async recordSyncAttempt(params: {
    typeKey: string;
    versionHash: string;
    targetPlatform: string;
    syncDirection: 'PUSH' | 'PULL';
    data: any;
    deploymentId?: string;
    metadata?: any;
  }): Promise<string> {
    const syncRecord = await this.prisma.syncHistory.create({
      data: {
        websiteId: '', // TODO: Need to pass websiteId
        syncType: params.typeKey,
        sourceSystem: 'catalyst-studio',
        targetSystem: params.targetPlatform,
        syncData: {
          versionHash: params.versionHash,
          syncDirection: params.syncDirection,
          data: params.data,
          deploymentId: params.deploymentId,
          metadata: params.metadata
        } as any,
        status: SyncStatus.IN_PROGRESS,
        startedAt: new Date()
      }
    });
    
    return syncRecord.id;
  }
  
  /**
   * Update sync status with result
   */
  async updateSyncStatus(
    syncId: string, 
    status: SyncStatus, 
    response?: any, 
    error?: Error
  ): Promise<void> {
    const updateData: any = {
      status: status,
      completedAt: new Date()
    };
    
    // Note: responseData field doesn't exist in SyncHistory model
    // Would need to store in syncData
    if (response) {
      // updateData.responseData = JSON.stringify(response);
    }
    
    if (error) {
      updateData.errorMessage = error.message;
    }
    
    await this.prisma.syncHistory.update({
      where: { id: syncId },
      data: updateData
    });
  }
  
  /**
   * Link sync record to version history
   */
  async linkToVersion(syncId: string, versionHash: string): Promise<void> {
    // Note: versionHash field doesn't exist in SyncHistory model
    // Would need to store in syncData
    // await this.prisma.syncHistory.update({
    //   where: { id: syncId },
    //   data: { versionHash }
    // });
  }
  
  /**
   * Query sync history with filters
   */
  async getSyncHistory(filters: SyncHistoryFilters = {}): Promise<SyncRecord[]> {
    const where: any = {};
    
    if (filters.typeKey) {
      where.syncType = filters.typeKey;
    }
    
    if (filters.targetPlatform) {
      where.targetSystem = filters.targetPlatform;
    }
    
    if (filters.syncStatus) {
      where.status = filters.syncStatus;
    }
    
    // Note: deploymentId doesn't exist in SyncHistory model
    // Would need to filter from syncData
    // if (filters.deploymentId) {
    //   where.deploymentId = filters.deploymentId;
    // }
    
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }
    
    const records = await this.prisma.syncHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return records as any;
  }
  
  /**
   * Get the last successful sync for a type and platform
   */
  async getLastSuccessfulSync(
    typeKey: string, 
    platform: string
  ): Promise<SyncRecord | null> {
    const record = await this.prisma.syncHistory.findFirst({
      where: {
        syncType: typeKey,
        targetSystem: platform,
        status: SyncStatus.SUCCESS
      },
      orderBy: { completedAt: 'desc' }
    });
    
    return record as any;
  }
  
  /**
   * Get sync by ID
   */
  async getSyncById(syncId: string): Promise<SyncRecord | null> {
    const record = await this.prisma.syncHistory.findUnique({
      where: { id: syncId }
    });
    return record as any;
  }
}