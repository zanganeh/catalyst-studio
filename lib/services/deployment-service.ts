import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager } from '../sync/tracking/SyncHistoryManager';
import { SyncSnapshot } from '../sync/tracking/SyncSnapshot';
import { ContentTypeHasher } from '../sync/versioning/ContentTypeHasher';
import { SyncStateManager } from '../sync/state/SyncStateManager';
import { ChangeDetector } from '../sync/detection/ChangeDetector';
import { ProviderRegistry } from '../providers/registry';
import { ProviderFactory } from '../providers/factory';
import { ConflictDetector } from '../sync/conflict/ConflictDetector';
import { ConflictManager } from '../sync/conflict/ConflictManager';
import { ResolutionStrategyManager } from '../sync/conflict/ResolutionStrategy';
import { VersionHistory } from '../sync/versioning/VersionHistory';

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
  private conflictDetector: ConflictDetector;
  private conflictManager: ConflictManager;
  private resolutionManager: ResolutionStrategyManager;
  private versionHistory: VersionHistory;
  
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
    // Initialize conflict detection components
    this.versionHistory = new VersionHistory(prisma);
    this.conflictDetector = new ConflictDetector(this.changeDetector, this.versionHistory, prisma);
    this.conflictManager = new ConflictManager(prisma);
    this.resolutionManager = new ResolutionStrategyManager();
  }
  
  /**
   * Check for interrupted syncs and optionally resume
   */
  async checkInterruptedSyncs(): Promise<{
    interrupted: string[];
    resumed: string[];
    failed: string[];
  }> {
    const result = {
      interrupted: [] as string[],
      resumed: [] as string[],
      failed: [] as string[]
    };
    
    try {
      // Detect interrupted syncs
      result.interrupted = await this.syncStateManager.detectInterruptedSync();
      
      if (result.interrupted.length > 0) {
        console.log(`Found ${result.interrupted.length} interrupted syncs`);
        
        for (const typeKey of result.interrupted) {
          try {
            // Get sync progress
            const progress = await this.syncStateManager.resumeSync(typeKey);
            
            if (progress) {
              console.log(`Resuming sync for ${typeKey} from step ${progress.currentStep}/${progress.totalSteps}`);
              // In a real implementation, you would resume from the saved progress
              // For now, we'll mark it as resumed
              result.resumed.push(typeKey);
            } else {
              // No progress to resume from, rollback
              await this.syncStateManager.rollbackPartialSync(typeKey);
              result.failed.push(typeKey);
            }
          } catch (error) {
            console.error(`Failed to resume sync for ${typeKey}:`, error);
            await this.syncStateManager.rollbackPartialSync(typeKey);
            result.failed.push(typeKey);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error checking interrupted syncs:', error);
      throw error;
    }
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
   * Check for conflicts before deployment
   */
  async checkForConflicts(contentTypeKeys?: string[]): Promise<{
    hasConflicts: boolean;
    conflicts: any[];
    canAutoResolve: boolean;
  }> {
    try {
      let conflicts: any[] = [];
      
      if (contentTypeKeys && contentTypeKeys.length > 0) {
        // Check specific content types
        for (const typeKey of contentTypeKeys) {
          const conflict = await this.conflictDetector.detectConflicts(typeKey);
          if (conflict.hasConflict) {
            const flagged = await this.conflictManager.flagForReview(typeKey, conflict);
            conflicts.push({
              ...conflict,
              id: flagged.id,
              priority: flagged.priority
            });
          }
        }
      } else {
        // Check all modified types
        conflicts = await this.conflictDetector.detectAllConflicts();
        for (const conflict of conflicts) {
          const flagged = await this.conflictManager.flagForReview(
            (conflict as any).typeKey,
            conflict
          );
          (conflict as any).id = flagged.id;
          (conflict as any).priority = flagged.priority;
        }
      }
      
      // Check if any conflicts can be auto-resolved
      let canAutoResolve = false;
      for (const conflict of conflicts) {
        const strategy = this.resolutionManager.selectBestStrategy(conflict);
        if (strategy !== 'manual_merge') {
          canAutoResolve = true;
          break;
        }
      }
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        canAutoResolve
      };
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      throw error;
    }
  }
  
  /**
   * Resolve conflicts with specified strategy
   */
  async resolveConflicts(
    conflicts: any[],
    strategy: string = 'auto_merge',
    resolvedBy: string = 'system'
  ): Promise<{
    resolved: number;
    failed: number;
    results: any[];
  }> {
    const results = {
      resolved: 0,
      failed: 0,
      results: [] as any[]
    };
    
    for (const conflict of conflicts) {
      try {
        const resolution = this.resolutionManager.resolveConflict(conflict, strategy);
        
        if (resolution.success) {
          await this.conflictManager.resolveConflict(
            conflict.id,
            strategy,
            resolution.resolution?.merged,
            resolvedBy
          );
          
          // Update sync state
          await this.prisma.syncState.update({
            where: { typeKey: (conflict as any).typeKey },
            data: {
              conflictStatus: 'resolved'
            }
          });
          
          results.resolved++;
          results.results.push({
            conflictId: conflict.id,
            success: true,
            resolution: resolution.resolution
          });
        } else {
          results.failed++;
          results.results.push({
            conflictId: conflict.id,
            success: false,
            error: resolution.error,
            requiresManual: resolution.requiresManual
          });
        }
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
        results.failed++;
        results.results.push({
          conflictId: conflict.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Deploy content types to provider with sync tracking
   */
  async deployToProvider(
    deploymentId: string, 
    contentTypes: ContentType[],
    options: {
      skipConflictCheck?: boolean;
      autoResolveConflicts?: boolean;
      conflictResolutionStrategy?: string;
    } = {}
  ): Promise<void> {
    console.log(`Starting deployment ${deploymentId} to ${this.provider}`);
    
    // Check for conflicts unless skipped
    if (!options.skipConflictCheck) {
      const contentTypeKeys = contentTypes.map(ct => ct.key);
      const conflictCheck = await this.checkForConflicts(contentTypeKeys);
      
      if (conflictCheck.hasConflicts) {
        console.log(`Found ${conflictCheck.conflicts.length} conflicts`);
        
        if (options.autoResolveConflicts && conflictCheck.canAutoResolve) {
          console.log('Attempting to auto-resolve conflicts...');
          const resolutionResult = await this.resolveConflicts(
            conflictCheck.conflicts,
            options.conflictResolutionStrategy || 'auto_merge'
          );
          
          if (resolutionResult.failed > 0) {
            // Update deployment status to indicate conflicts
            await this.prisma.deployment.update({
              where: { id: deploymentId },
              data: {
                status: 'conflict',
                deploymentData: {
                  logs: [{
                    timestamp: new Date().toISOString(),
                    level: 'warning',
                    message: `${resolutionResult.failed} conflicts require manual resolution`
                  }]
                } as any
              }
            });
            
            throw new Error(`${resolutionResult.failed} conflicts could not be auto-resolved. Manual intervention required.`);
          }
          
          console.log(`Successfully resolved ${resolutionResult.resolved} conflicts`);
        } else {
          // Halt deployment if conflicts detected and not auto-resolving
          await this.prisma.deployment.update({
            where: { id: deploymentId },
            data: {
              status: 'conflict',
              deploymentData: {
                logs: [{
                  timestamp: new Date().toISOString(),
                  level: 'error',
                  message: `Deployment halted: ${conflictCheck.conflicts.length} conflicts detected`
                }]
              } as any
            }
          });
          
          throw new Error(`Deployment halted: ${conflictCheck.conflicts.length} conflicts detected. Please resolve conflicts before deploying.`);
        }
      }
    }
    
    // Detect changes before deployment
    const changes = await this.detectChanges();
    console.log(`Detected changes - Created: ${changes.summary.created}, Updated: ${changes.summary.updated}, Deleted: ${changes.summary.deleted}`);
    
    // Record change detection in sync history
    await this.syncHistoryManager.recordSyncAttempt({
      typeKey: '_change_detection',
      versionHash: this.hasher.calculateHash({ timestamp: new Date().toISOString(), changes: changes.summary }),
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
        deployedAt: new Date()
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
          this.hasher.calculateHash(contentType.data);
        
        // Update sync state to 'syncing' with progress
        await this.syncStateManager.setSyncProgress(contentType.key, {
          currentStep: 1,
          totalSteps: 3,
          lastProcessedId: contentType.key,
          processedCount: 0
        });
        
        // Capture snapshot
        const snapshot = await this.syncSnapshot.captureSnapshot(contentType.data);
        
        // Update progress
        await this.syncStateManager.setSyncProgress(contentType.key, {
          currentStep: 2,
          totalSteps: 3,
          lastProcessedId: contentType.key,
          processedCount: 0
        });
        
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
        
        // Mark as synced in sync state
        const localHash = versionHash;
        const remoteHash = versionHash; // In real implementation, get from remote
        await this.syncStateManager.markAsSynced(contentType.key, localHash, remoteHash);
        
        results.successful++;
        
        // Update deployment progress
        const progress = Math.round(
          ((results.successful + results.failed) / contentTypes.length) * 100
        );
        
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            deploymentData: {
              progress,
              logs: [{
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Synced ${contentType.key} successfully`
              }]
            } as any
          }
        });
        
      } catch (error) {
        console.error(`Failed to sync ${contentType.key}:`, error);
        results.failed++;
        
        // Rollback sync state on failure
        await this.syncStateManager.rollbackPartialSync(contentType.key);
        
        // Log error but continue with next item
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            deploymentData: {
              logs: [{
                timestamp: new Date().toISOString(),
                level: 'error',
                message: `Failed to sync ${contentType.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
              }]
            } as any
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
        deployedAt: new Date(),
        deploymentData: {
          progress: 100,
          logs: [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Deployment completed: ${results.successful} successful, ${results.failed} failed`
          }]
        } as any
      }
    });
  }
  
  /**
   * Deploy with specified provider
   */
  async deployWithProvider(
    deploymentId: string,
    contentTypes: any[],
    providerId: string = 'optimizely',
    config?: Record<string, any>
  ): Promise<void> {
    // Always use provider pattern
    const registry = ProviderRegistry.getInstance();
    let provider = registry.getProvider(providerId);
    
    if (!provider) {
      // Create provider using factory
      provider = ProviderFactory.createProvider(providerId, config);
      registry.register(providerId, provider);
      registry.setActiveProvider(providerId);
    }
    
    // Deploy each content type using provider
    for (const contentType of contentTypes) {
      try {
        // Convert to Universal format for provider
        const universalType = provider.mapToUniversal(contentType);
        
        // Check if exists
        const existing = await provider.getContentType(contentType.key);
        
        if (existing) {
          // Update existing
          await provider.updateContentType(contentType.key, universalType);
        } else {
          // Create new
          await provider.createContentType(universalType);
        }
      } catch (error) {
        console.error(`Failed to deploy ${contentType.key}:`, error);
        // Continue with next type
      }
    }
  }
  
  /**
   * Legacy method - redirects to deployWithProvider
   * @deprecated Use deployWithProvider instead
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
    return this.deployWithProvider(deploymentId, contentTypes, 'optimizely', config);
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
    // TODO: Implement retry logic when SyncHistory is properly integrated with deployments
    // For now, this is a placeholder
    console.log(`Retry failed syncs for deployment ${deploymentId} - not implemented yet`);
    return;
    
    /* Original implementation needs refactoring:
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
    */
  }
}