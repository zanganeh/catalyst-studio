import { PrismaClient, SyncState } from '@/lib/generated/prisma';

export interface SyncDelta {
  action: 'INITIAL_SYNC' | 'PUSH' | 'PULL' | 'CONFLICT' | 'NO_CHANGE';
  localHash?: string;
  remoteHash?: string;
}

export interface SyncProgress {
  currentStep: number;
  totalSteps: number;
  lastProcessedId?: string;
  processedCount?: number;
  error?: string;
}

export class SyncStateManager {
  constructor(private prisma: PrismaClient) {}

  private validateSyncProgress(progress: unknown): progress is SyncProgress {
    if (!progress || typeof progress !== 'object') {
      return false;
    }
    
    const { currentStep, totalSteps, lastProcessedId, processedCount, error } = progress as any;
    
    // Required fields
    if (typeof currentStep !== 'number' || typeof totalSteps !== 'number') {
      return false;
    }
    
    // Optional fields validation
    if (lastProcessedId !== undefined && typeof lastProcessedId !== 'string') {
      return false;
    }
    if (processedCount !== undefined && typeof processedCount !== 'number') {
      return false;
    }
    if (error !== undefined && typeof error !== 'string') {
      return false;
    }
    
    // Business logic validation
    if (currentStep < 0 || totalSteps < 1 || currentStep > totalSteps) {
      return false;
    }
    
    return true;
  }

  async updateSyncState(typeKey: string, state: Partial<SyncState>): Promise<void> {
    await this.prisma.syncState.upsert({
      where: { typeKey },
      update: {
        ...state,
        updatedAt: new Date()
      } as any,
      create: {
        typeKey,
        ...state
      } as any
    });
  }

  async getSyncState(typeKey: string): Promise<SyncState | null> {
    return await this.prisma.syncState.findUnique({
      where: { typeKey }
    });
  }

  async getAllSyncStates(): Promise<SyncState[]> {
    return await this.prisma.syncState.findMany({
      orderBy: { updatedAt: 'desc' }
    });
  }

  async compareSyncStates(typeKey: string, currentLocalHash: string, currentRemoteHash: string): Promise<SyncDelta> {
    const state = await this.getSyncState(typeKey);
    
    if (!state) {
      return { action: 'INITIAL_SYNC', localHash: currentLocalHash, remoteHash: currentRemoteHash };
    }
    
    const localChanged = state.localHash !== currentLocalHash;
    const remoteChanged = state.remoteHash !== currentRemoteHash;
    
    if (localChanged && remoteChanged) {
      return { action: 'CONFLICT', localHash: currentLocalHash, remoteHash: currentRemoteHash };
    }
    
    if (localChanged) {
      return { action: 'PUSH', localHash: currentLocalHash };
    }
    
    if (remoteChanged) {
      return { action: 'PULL', remoteHash: currentRemoteHash };
    }
    
    return { action: 'NO_CHANGE' };
  }

  async getContentTypesSince(timestamp: Date): Promise<string[]> {
    const states = await this.prisma.syncState.findMany({
      where: {
        updatedAt: { gt: timestamp }
      },
      select: { typeKey: true }
    });
    return states.map(s => s.typeKey);
  }

  async calculateDelta(typeKey: string, currentLocalHash: string, currentRemoteHash: string): Promise<SyncDelta> {
    const state = await this.getSyncState(typeKey);
    
    if (!state) {
      return { action: 'INITIAL_SYNC', localHash: currentLocalHash, remoteHash: currentRemoteHash };
    }
    
    // Check if both local and remote have changed since last sync
    if (state.lastSyncedHash) {
      const localChanged = state.localHash !== currentLocalHash;
      const remoteChanged = state.remoteHash !== currentRemoteHash;
      
      if (localChanged && remoteChanged) {
        // Both changed - conflict
        return { action: 'CONFLICT', localHash: currentLocalHash, remoteHash: currentRemoteHash };
      }
      
      if (localChanged && !remoteChanged) {
        // Only local changed - push
        return { action: 'PUSH', localHash: currentLocalHash };
      }
      
      if (!localChanged && remoteChanged) {
        // Only remote changed - pull
        return { action: 'PULL', remoteHash: currentRemoteHash };
      }
    }
    
    // Check current state differences
    if (currentLocalHash !== currentRemoteHash) {
      // Determine direction based on last sync
      if (state.localHash === currentLocalHash && state.remoteHash !== currentRemoteHash) {
        return { action: 'PULL', remoteHash: currentRemoteHash };
      }
      if (state.localHash !== currentLocalHash && state.remoteHash === currentRemoteHash) {
        return { action: 'PUSH', localHash: currentLocalHash };
      }
      // Can't determine direction - conflict
      return { action: 'CONFLICT', localHash: currentLocalHash, remoteHash: currentRemoteHash };
    }
    
    return { action: 'NO_CHANGE' };
  }

  async markAsSynced(typeKey: string, localHash: string, remoteHash: string): Promise<void> {
    await this.updateSyncState(typeKey, {
      localHash,
      remoteHash,
      lastSyncedHash: localHash,
      lastSyncAt: new Date(),
      syncStatus: 'in_sync',
      conflictStatus: 'none',
      syncProgress: null
    });
  }

  async detectInterruptedSync(): Promise<string[]> {
    const interrupted = await this.prisma.syncState.findMany({
      where: {
        syncStatus: 'syncing'
      },
      select: { typeKey: true }
    });
    return interrupted.map(s => s.typeKey);
  }

  async resumeSync(typeKey: string): Promise<SyncProgress | null> {
    const state = await this.getSyncState(typeKey);
    if (!state?.syncProgress) {
      return null;
    }
    
    // Validate stored progress data
    if (!this.validateSyncProgress(state.syncProgress)) {
      console.warn(`Invalid sync progress data for ${typeKey}, resetting`);
      await this.updateSyncState(typeKey, { syncProgress: null });
      return null;
    }
    
    return state.syncProgress as SyncProgress;
  }

  async rollbackPartialSync(typeKey: string): Promise<void> {
    await this.updateSyncState(typeKey, {
      syncStatus: 'failed',
      syncProgress: null
    });
  }

  async setSyncProgress(typeKey: string, progress: SyncProgress): Promise<void> {
    if (!this.validateSyncProgress(progress)) {
      throw new Error('Invalid sync progress structure');
    }
    
    await this.updateSyncState(typeKey, {
      syncStatus: 'syncing',
      syncProgress: progress as any
    });
  }

  async markAsConflicted(typeKey: string, localHash: string, remoteHash: string): Promise<void> {
    await this.updateSyncState(typeKey, {
      localHash,
      remoteHash,
      syncStatus: 'conflict',
      conflictStatus: 'detected',
      lastConflictAt: new Date()
    });
  }

  async resolveConflict(typeKey: string, resolvedHash: string): Promise<void> {
    await this.updateSyncState(typeKey, {
      localHash: resolvedHash,
      remoteHash: resolvedHash,
      lastSyncedHash: resolvedHash,
      syncStatus: 'in_sync',
      conflictStatus: 'resolved',
      lastSyncAt: new Date()
    });
  }

  async getConflictedTypes(): Promise<string[]> {
    const conflicted = await this.prisma.syncState.findMany({
      where: {
        conflictStatus: 'detected'
      },
      select: { typeKey: true }
    });
    return conflicted.map(s => s.typeKey);
  }

  async getPendingSyncTypes(): Promise<string[]> {
    const pending = await this.prisma.syncState.findMany({
      where: {
        OR: [
          { syncStatus: 'pending' },
          { syncStatus: 'modified' },
          { syncStatus: 'new' }
        ]
      },
      select: { typeKey: true }
    });
    return pending.map(s => s.typeKey);
  }

  async clearSyncState(typeKey: string): Promise<void> {
    await this.prisma.syncState.delete({
      where: { typeKey }
    });
  }

  async resetAllSyncStates(): Promise<void> {
    await this.prisma.syncState.updateMany({
      data: {
        syncStatus: 'pending',
        syncProgress: null as any,
        lastSyncAt: null,
        lastSyncedHash: null
      } as any
    });
  }
}