import { PrismaClient, SyncState } from '@/lib/generated/prisma';

export interface SyncStateUpdate {
  typeKey: string;
  localHash: string;
  remoteHash?: string;
  lastSyncedHash?: string;
  syncStatus: 'new' | 'modified' | 'conflict' | 'in_sync';
}

export class SyncStateManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update or create sync state for a content type
   */
  async upsertSyncState(update: SyncStateUpdate): Promise<SyncState> {
    return await this.prisma.syncState.upsert({
      where: { typeKey: update.typeKey },
      update: {
        localHash: update.localHash,
        remoteHash: update.remoteHash,
        lastSyncedHash: update.lastSyncedHash,
        syncStatus: update.syncStatus,
        lastSyncAt: new Date()
      },
      create: {
        typeKey: update.typeKey,
        localHash: update.localHash,
        remoteHash: update.remoteHash,
        lastSyncedHash: update.lastSyncedHash,
        syncStatus: update.syncStatus,
        lastSyncAt: new Date()
      }
    });
  }

  /**
   * Batch update sync states
   */
  async batchUpdateSyncStates(updates: SyncStateUpdate[]): Promise<void> {
    const operations = updates.map(update => 
      this.prisma.syncState.upsert({
        where: { typeKey: update.typeKey },
        update: {
          localHash: update.localHash,
          remoteHash: update.remoteHash,
          lastSyncedHash: update.lastSyncedHash,
          syncStatus: update.syncStatus,
          lastSyncAt: new Date()
        },
        create: {
          typeKey: update.typeKey,
          localHash: update.localHash,
          remoteHash: update.remoteHash,
          lastSyncedHash: update.lastSyncedHash,
          syncStatus: update.syncStatus,
          lastSyncAt: new Date()
        }
      })
    );

    await this.prisma.$transaction(operations);
  }

  /**
   * Get sync state for a content type
   */
  async getSyncState(typeKey: string): Promise<SyncState | null> {
    return await this.prisma.syncState.findUnique({
      where: { typeKey }
    });
  }

  /**
   * Get all sync states
   */
  async getAllSyncStates(): Promise<SyncState[]> {
    return await this.prisma.syncState.findMany({
      orderBy: { lastSyncAt: 'desc' }
    });
  }

  /**
   * Get sync states by status
   */
  async getSyncStatesByStatus(status: string): Promise<SyncState[]> {
    return await this.prisma.syncState.findMany({
      where: { syncStatus: status },
      orderBy: { lastSyncAt: 'desc' }
    });
  }

  /**
   * Mark content type as synced
   */
  async markAsSynced(typeKey: string, hash: string): Promise<SyncState> {
    return await this.prisma.syncState.update({
      where: { typeKey },
      data: {
        lastSyncedHash: hash,
        syncStatus: 'in_sync',
        lastSyncAt: new Date()
      }
    });
  }

  /**
   * Detect conflicts based on stored hashes
   */
  async detectConflicts(): Promise<SyncState[]> {
    const states = await this.prisma.syncState.findMany();
    const conflicts = [];

    for (const state of states) {
      // Conflict: local and remote both changed since last sync
      if (
        state.lastSyncedHash &&
        state.localHash !== state.lastSyncedHash &&
        state.remoteHash &&
        state.remoteHash !== state.lastSyncedHash
      ) {
        // Update status to conflict
        const updated = await this.prisma.syncState.update({
          where: { typeKey: state.typeKey },
          data: { syncStatus: 'conflict' }
        });
        conflicts.push(updated);
      }
    }

    return conflicts;
  }

  /**
   * Clear sync state for a content type
   */
  async clearSyncState(typeKey: string): Promise<void> {
    await this.prisma.syncState.delete({
      where: { typeKey }
    });
  }

  /**
   * Clear all sync states
   */
  async clearAllSyncStates(): Promise<void> {
    await this.prisma.syncState.deleteMany();
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    total: number;
    inSync: number;
    modified: number;
    new: number;
    conflicts: number;
  }> {
    const [total, inSync, modified, newItems, conflicts] = await Promise.all([
      this.prisma.syncState.count(),
      this.prisma.syncState.count({ where: { syncStatus: 'in_sync' } }),
      this.prisma.syncState.count({ where: { syncStatus: 'modified' } }),
      this.prisma.syncState.count({ where: { syncStatus: 'new' } }),
      this.prisma.syncState.count({ where: { syncStatus: 'conflict' } })
    ]);

    return {
      total,
      inSync,
      modified,
      new: newItems,
      conflicts
    };
  }
}