import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager } from '../sync/tracking/SyncHistoryManager';
import { SyncSnapshot } from '../sync/tracking/SyncSnapshot';
import { ContentTypeHasher } from '../sync/versioning/ContentTypeHasher';
import { OptimizelyApiClient } from '../sync/adapters/optimizely-api-client';
import { SyncStateManager } from '../sync/persistence/SyncStateManager';
import { ChangeDetector } from '../sync/detection/ChangeDetector';

export interface DeploymentConfig {
  deploymentId: string;
  websiteId: string;
  provider: string;
  selectedTypes: string[];
}

export interface ContentType {
  key: string;
  versionHash?: string;
  data: Record<string, unknown>;
}

export interface ChangeSummary {
  summary: {
    total: number;
    created: number;
    updated: number;
    deleted: number;
    unchanged: number;
  };
  details?: {
    created: Array<Record<string, unknown>>;
    updated: Array<Record<string, unknown>>;
    deleted: Array<Record<string, unknown>>;
  };
  timestamp: string;
}

export class DeploymentService {
  private syncHistoryManager: SyncHistoryManager;
  private syncSnapshot: SyncSnapshot;
  private syncStateManager: SyncStateManager;
  private hasher: ContentTypeHasher;
  private changeDetector: ChangeDetector;
  
  constructor(
    private prisma: PrismaClient,
    private provider: string = 'optimizely'
  ) {
    this.syncHistoryManager = new SyncHistoryManager(prisma);
    this.syncSnapshot = new SyncSnapshot();
    this.syncStateManager = new SyncStateManager(prisma);
    this.hasher = new ContentTypeHasher();
    // Initialize the native TypeScript change detector
    this.changeDetector = new ChangeDetector(prisma, this.syncStateManager);
  }
  
  /**
   * Detect changes between local and remote content types
   */
  async detectChanges(): Promise<ChangeSummary> {
    try {
      const changes = await this.changeDetector.detectChanges();
      console.log('Changes detected:', changes.summary);
      return changes;
    } catch (error) {
      console.error('Error detecting changes:', error);
      throw error;
    }
  }
  
  /**
   * Get change summary for deployment preview
   */
  async getChangeSummary(contentTypeKeys?: string[]): Promise<ChangeSummary> {
    try {
      if (contentTypeKeys && contentTypeKeys.length > 0) {
        // Detect changes for specific content types
        const batchResult = await this.changeDetector.detectBatchChanges(contentTypeKeys);
        return batchResult;
      } else {
        // Detect all changes
        return await this.detectChanges();
      }
    } catch (error) {
      console.error('Error getting change summary:', error);
      throw error;
    }
  }
  
  /**
   * Deploy content types to provider with sync tracking
   */
  async deployToProvider(
    deploymentId: string, 
    contentTypes: ContentType[]
  ): Promise<void> {
    console.log(`Starting deployment ${deploymentId} to ${this.provider}`);
    
    // Detect changes before deployment
    const changes = await this.detectChanges();
    console.log(`Detected changes - Created: ${changes.summary.created}, Updated: ${changes.summary.updated}, Deleted: ${changes.summary.deleted}`);
    
    // Record change detection in sync history
    await this.syncHistoryManager.recordSyncAttempt({
      typeKey: '_change_detection',
      versionHash: this.hasher.generateHash({ timestamp: new Date().toISOString(), changes: changes.summary }),
      targetPlatform: this.provider,
      syncDirection: 'PUSH',
      data: { changes: changes.summary },
      deploymentId,
      metadata: {
        deploymentId,
        changeDetection: true,
        timestamp: new Date().toISOString()
      }
    });
    
    // Update deployment status
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'processing',
        startedAt: new Date()
      }
    });
    
    const results = {
      successful: 0,
      failed: 0,
      partial: 0
    };
    
    for (const contentType of contentTypes) {
      try {
        // Calculate version hash if not provided
        const versionHash = contentType.versionHash || 
          this.hasher.generateHash(contentType.data);
        
        // Capture snapshot
        const snapshot = await this.syncSnapshot.captureSnapshot(contentType.data);
        
        // Record sync attempt
        const syncId = await this.syncHistoryManager.recordSyncAttempt({
          typeKey: contentType.key,
          versionHash,
          targetPlatform: this.provider,
          syncDirection: 'PUSH',
          data: snapshot,
          deploymentId,
          metadata: {
            deploymentId,
            timestamp: new Date().toISOString()
          }
        });
        
        // Here you would call the actual provider API
        // For now, we'll simulate success
        console.log(`Syncing content type ${contentType.key} to ${this.provider}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update sync status
        await this.syncHistoryManager.updateSyncStatus(
          syncId,
          'SUCCESS' as any,
          { message: 'Successfully synced to provider' }
        );
        
        results.successful++;
        
        // Update deployment progress
        const progress = Math.round(
          ((results.successful + results.failed) / contentTypes.length) * 100
        );
        
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            progress,
            logs: JSON.stringify([{
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `Synced ${contentType.key} successfully`
            }])
          }
        });
        
      } catch (error) {
        console.error(`Failed to sync ${contentType.key}:`, error);
        results.failed++;
        
        // Log error but continue with next item
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            logs: JSON.stringify([{
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Failed to sync ${contentType.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
            }])
          }
        });
      }
    }
    
    // Update final deployment status
    const finalStatus = results.failed === 0 ? 'completed' : 
                       results.successful === 0 ? 'failed' : 'partial';
    
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        progress: 100,
        logs: JSON.stringify([{
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Deployment completed: ${results.successful} successful, ${results.failed} failed`
        }])
      }
    });
  }
  
  /**
   * Deploy with Optimizely API client
   */
  async deployWithOptimizely(
    deploymentId: string,
    contentTypes: any[],
    config: {
      clientId?: string;
      clientSecret?: string;
      projectId?: string;
    }
  ): Promise<void> {
    // Initialize Optimizely client with sync tracking
    const optimizelyClient = new OptimizelyApiClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      projectId: config.projectId
    });
    
    // Initialize sync tracking in the client
    optimizelyClient.initializeSyncTracking(this.prisma, deploymentId || undefined);
    
    // Authenticate
    await optimizelyClient.authenticate();
    
    // Deploy each content type
    for (const contentType of contentTypes) {
      try {
        // Check if exists
        const existing = await optimizelyClient.getContentType(contentType.key);
        
        if (existing) {
          // Update existing
          await optimizelyClient.updateContentType(
            contentType.key,
            contentType,
            existing.etag
          );
        } else {
          // Create new
          await optimizelyClient.createContentType(contentType);
        }
      } catch (error) {
        console.error(`Failed to deploy ${contentType.key}:`, error);
        // Continue with next type
      }
    }
  }
  
  /**
   * Get deployment sync history
   */
  async getDeploymentSyncHistory(deploymentId: string) {
    return await this.syncHistoryManager.getSyncHistory({
      deploymentId
    });
  }
  
  /**
   * Retry failed syncs for a deployment
   */
  async retryFailedSyncs(deploymentId: string): Promise<void> {
    const failedSyncs = await this.prisma.syncHistory.findMany({
      where: {
        deploymentId,
        syncStatus: 'FAILED'
      }
    });
    
    console.log(`Found ${failedSyncs.length} failed syncs to retry`);
    
    for (const sync of failedSyncs) {
      try {
        // Restore snapshot data
        const data = await this.syncSnapshot.restoreSnapshot(sync.pushedData);
        
        // Retry with exponential backoff
        await this.syncHistoryManager.executeWithRetry(
          async () => {
            // Here you would call the actual provider API
            console.log(`Retrying sync for ${sync.typeKey}`);
            
            // Simulate retry
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return { success: true };
          },
          sync.id
        );
        
        // Update status on success
        await this.syncHistoryManager.updateSyncStatus(
          sync.id,
          'SUCCESS' as any,
          { message: 'Retry successful' }
        );
        
      } catch (error) {
        console.error(`Retry failed for ${sync.typeKey}:`, error);
      }
    }
  }
}