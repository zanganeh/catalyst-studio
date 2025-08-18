import { PrismaClient } from '@/lib/generated/prisma';
import { SyncStateManager } from '../SyncStateManager';

describe('SyncStateManager', () => {
  let prisma: PrismaClient;
  let manager: SyncStateManager;
  const testPrefix = 'test_ssm_';

  beforeAll(() => {
    prisma = new PrismaClient();
    manager = new SyncStateManager(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.syncState.deleteMany({
      where: {
        typeKey: {
          startsWith: testPrefix
        }
      }
    });
  });

  describe('updateSyncState', () => {
    it('should create new sync state if not exists', async () => {
      const typeKey = `${testPrefix}new_type`;
      await manager.updateSyncState(typeKey, {
        localHash: 'hash123',
        syncStatus: 'pending'
      });

      const state = await manager.getSyncState(typeKey);
      expect(state).toBeTruthy();
      expect(state?.localHash).toBe('hash123');
      expect(state?.syncStatus).toBe('pending');
    });

    it('should update existing sync state', async () => {
      const typeKey = `${testPrefix}existing_type`;
      
      // Create initial state
      await manager.updateSyncState(typeKey, {
        localHash: 'initial',
        syncStatus: 'pending'
      });

      // Update state
      await manager.updateSyncState(typeKey, {
        localHash: 'updated',
        syncStatus: 'in_sync',
        lastSyncAt: new Date()
      });

      const state = await manager.getSyncState(typeKey);
      expect(state?.localHash).toBe('updated');
      expect(state?.syncStatus).toBe('in_sync');
      expect(state?.lastSyncAt).toBeInstanceOf(Date);
    });
  });

  describe('getSyncState', () => {
    it('should return null for non-existent state', async () => {
      const state = await manager.getSyncState(`${testPrefix}nonexistent`);
      expect(state).toBeNull();
    });

    it('should return existing state', async () => {
      const typeKey = `${testPrefix}get_test`;
      await manager.updateSyncState(typeKey, {
        localHash: 'test_hash'
      });

      const state = await manager.getSyncState(typeKey);
      expect(state).toBeTruthy();
      expect(state?.typeKey).toBe(typeKey);
      expect(state?.localHash).toBe('test_hash');
    });
  });

  describe('compareSyncStates', () => {
    it('should return INITIAL_SYNC for new type', async () => {
      const delta = await manager.compareSyncStates(
        `${testPrefix}new`,
        'local123',
        'remote456'
      );
      
      expect(delta.action).toBe('INITIAL_SYNC');
      expect(delta.localHash).toBe('local123');
      expect(delta.remoteHash).toBe('remote456');
    });

    it('should detect CONFLICT when both changed', async () => {
      const typeKey = `${testPrefix}conflict`;
      await manager.updateSyncState(typeKey, {
        localHash: 'old_local',
        remoteHash: 'old_remote'
      });

      const delta = await manager.compareSyncStates(
        typeKey,
        'new_local',
        'new_remote'
      );
      
      expect(delta.action).toBe('CONFLICT');
    });

    it('should detect PUSH when only local changed', async () => {
      const typeKey = `${testPrefix}push`;
      const remoteHash = 'stable_remote';
      
      await manager.updateSyncState(typeKey, {
        localHash: 'old_local',
        remoteHash: remoteHash
      });

      const delta = await manager.compareSyncStates(
        typeKey,
        'new_local',
        remoteHash
      );
      
      expect(delta.action).toBe('PUSH');
      expect(delta.localHash).toBe('new_local');
    });

    it('should detect PULL when only remote changed', async () => {
      const typeKey = `${testPrefix}pull`;
      const localHash = 'stable_local';
      
      await manager.updateSyncState(typeKey, {
        localHash: localHash,
        remoteHash: 'old_remote'
      });

      const delta = await manager.compareSyncStates(
        typeKey,
        localHash,
        'new_remote'
      );
      
      expect(delta.action).toBe('PULL');
      expect(delta.remoteHash).toBe('new_remote');
    });

    it('should return NO_CHANGE when hashes match', async () => {
      const typeKey = `${testPrefix}no_change`;
      const hash = 'same_hash';
      
      await manager.updateSyncState(typeKey, {
        localHash: hash,
        remoteHash: hash
      });

      const delta = await manager.compareSyncStates(typeKey, hash, hash);
      
      expect(delta.action).toBe('NO_CHANGE');
    });
  });

  describe('getContentTypesSince', () => {
    it('should return types updated after timestamp', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create test states
      await manager.updateSyncState(`${testPrefix}recent1`, {
        syncStatus: 'in_sync'
      });
      await manager.updateSyncState(`${testPrefix}recent2`, {
        syncStatus: 'pending'
      });

      // Get types updated since yesterday
      const types = await manager.getContentTypesSince(yesterday);
      const testTypes = types.filter(t => t.startsWith(testPrefix));
      
      expect(testTypes).toContain(`${testPrefix}recent1`);
      expect(testTypes).toContain(`${testPrefix}recent2`);

      // Get types updated since tomorrow (should be empty)
      const futureTypes = await manager.getContentTypesSince(tomorrow);
      const testFutureTypes = futureTypes.filter(t => t.startsWith(testPrefix));
      
      expect(testFutureTypes).toHaveLength(0);
    });
  });

  describe('markAsSynced', () => {
    it('should update all sync-related fields', async () => {
      const typeKey = `${testPrefix}synced`;
      const localHash = 'final_hash';
      const remoteHash = 'final_hash';

      await manager.markAsSynced(typeKey, localHash, remoteHash);

      const state = await manager.getSyncState(typeKey);
      expect(state?.localHash).toBe(localHash);
      expect(state?.remoteHash).toBe(remoteHash);
      expect(state?.lastSyncedHash).toBe(localHash);
      expect(state?.syncStatus).toBe('in_sync');
      expect(state?.conflictStatus).toBe('none');
      expect(state?.lastSyncAt).toBeInstanceOf(Date);
      expect(state?.syncProgress).toBeNull();
    });
  });

  describe('detectInterruptedSync', () => {
    it('should find all syncing states', async () => {
      await manager.updateSyncState(`${testPrefix}int1`, {
        syncStatus: 'syncing'
      });
      await manager.updateSyncState(`${testPrefix}int2`, {
        syncStatus: 'syncing'
      });
      await manager.updateSyncState(`${testPrefix}done`, {
        syncStatus: 'in_sync'
      });

      const interrupted = await manager.detectInterruptedSync();
      const testInterrupted = interrupted.filter(t => t.startsWith(testPrefix));
      
      expect(testInterrupted).toHaveLength(2);
      expect(testInterrupted).toContain(`${testPrefix}int1`);
      expect(testInterrupted).toContain(`${testPrefix}int2`);
    });

    it('should return empty array when no interrupted syncs', async () => {
      await manager.updateSyncState(`${testPrefix}complete`, {
        syncStatus: 'in_sync'
      });

      const interrupted = await manager.detectInterruptedSync();
      const testInterrupted = interrupted.filter(t => t.startsWith(testPrefix));
      
      expect(testInterrupted).toHaveLength(0);
    });
  });

  describe('resumeSync', () => {
    it('should return sync progress if available', async () => {
      const typeKey = `${testPrefix}resume`;
      const progress = {
        currentStep: 2,
        totalSteps: 5,
        lastProcessedId: 'abc123',
        processedCount: 10
      };

      await manager.setSyncProgress(typeKey, progress);

      const resumed = await manager.resumeSync(typeKey);
      expect(resumed).toEqual(progress);
    });

    it('should return null if no progress available', async () => {
      const typeKey = `${testPrefix}no_progress`;
      await manager.updateSyncState(typeKey, {
        syncStatus: 'pending'
      });

      const resumed = await manager.resumeSync(typeKey);
      expect(resumed).toBeNull();
    });
  });

  describe('rollbackPartialSync', () => {
    it('should mark sync as failed and clear progress', async () => {
      const typeKey = `${testPrefix}rollback`;
      
      // Set up a sync in progress
      await manager.setSyncProgress(typeKey, {
        currentStep: 3,
        totalSteps: 5
      });

      // Rollback
      await manager.rollbackPartialSync(typeKey);

      const state = await manager.getSyncState(typeKey);
      expect(state?.syncStatus).toBe('failed');
      expect(state?.syncProgress).toBeNull();
    });
  });

  describe('conflict management', () => {
    it('should mark type as conflicted', async () => {
      const typeKey = `${testPrefix}conflict_mark`;
      
      await manager.markAsConflicted(typeKey, 'local_hash', 'remote_hash');

      const state = await manager.getSyncState(typeKey);
      expect(state?.syncStatus).toBe('conflict');
      expect(state?.conflictStatus).toBe('detected');
      expect(state?.lastConflictAt).toBeInstanceOf(Date);
    });

    it('should resolve conflict', async () => {
      const typeKey = `${testPrefix}conflict_resolve`;
      const resolvedHash = 'resolved_hash';
      
      // First mark as conflicted
      await manager.markAsConflicted(typeKey, 'local', 'remote');
      
      // Then resolve
      await manager.resolveConflict(typeKey, resolvedHash);

      const state = await manager.getSyncState(typeKey);
      expect(state?.localHash).toBe(resolvedHash);
      expect(state?.remoteHash).toBe(resolvedHash);
      expect(state?.lastSyncedHash).toBe(resolvedHash);
      expect(state?.syncStatus).toBe('in_sync');
      expect(state?.conflictStatus).toBe('resolved');
    });

    it('should get all conflicted types', async () => {
      await manager.markAsConflicted(`${testPrefix}conf1`, 'l1', 'r1');
      await manager.markAsConflicted(`${testPrefix}conf2`, 'l2', 'r2');
      await manager.updateSyncState(`${testPrefix}ok`, {
        syncStatus: 'in_sync',
        conflictStatus: 'none'
      });

      const conflicted = await manager.getConflictedTypes();
      const testConflicted = conflicted.filter(t => t.startsWith(testPrefix));
      
      expect(testConflicted).toHaveLength(2);
      expect(testConflicted).toContain(`${testPrefix}conf1`);
      expect(testConflicted).toContain(`${testPrefix}conf2`);
    });
  });

  describe('getPendingSyncTypes', () => {
    it('should return all pending, modified, and new types', async () => {
      await manager.updateSyncState(`${testPrefix}pend1`, {
        syncStatus: 'pending'
      });
      await manager.updateSyncState(`${testPrefix}mod1`, {
        syncStatus: 'modified'
      });
      await manager.updateSyncState(`${testPrefix}new1`, {
        syncStatus: 'new'
      });
      await manager.updateSyncState(`${testPrefix}sync1`, {
        syncStatus: 'in_sync'
      });

      const pending = await manager.getPendingSyncTypes();
      const testPending = pending.filter(t => t.startsWith(testPrefix));
      
      expect(testPending).toHaveLength(3);
      expect(testPending).toContain(`${testPrefix}pend1`);
      expect(testPending).toContain(`${testPrefix}mod1`);
      expect(testPending).toContain(`${testPrefix}new1`);
    });
  });

  describe('setSyncProgress', () => {
    it('should store sync progress', async () => {
      const typeKey = `${testPrefix}progress`;
      const progress = {
        currentStep: 1,
        totalSteps: 3,
        lastProcessedId: 'item_123',
        processedCount: 5
      };

      await manager.setSyncProgress(typeKey, progress);

      const state = await manager.getSyncState(typeKey);
      expect(state?.syncStatus).toBe('syncing');
      expect(state?.syncProgress).toEqual(progress);
    });
  });

  describe('calculateDelta', () => {
    it('should handle complex sync scenarios', async () => {
      const typeKey = `${testPrefix}delta`;
      
      // Initial sync
      let delta = await manager.calculateDelta(typeKey, 'local1', 'remote1');
      expect(delta.action).toBe('INITIAL_SYNC');

      // After initial sync
      await manager.markAsSynced(typeKey, 'hash1', 'hash1');
      
      // Local change only
      delta = await manager.calculateDelta(typeKey, 'hash2', 'hash1');
      expect(delta.action).toBe('PUSH');

      // Sync the change
      await manager.markAsSynced(typeKey, 'hash2', 'hash2');
      
      // Remote change only
      delta = await manager.calculateDelta(typeKey, 'hash2', 'hash3');
      expect(delta.action).toBe('PULL');
      
      // Both changed (conflict)
      await manager.updateSyncState(typeKey, {
        localHash: 'hash2',
        remoteHash: 'hash3',
        lastSyncedHash: 'hash2'
      });
      
      delta = await manager.calculateDelta(typeKey, 'hash4', 'hash5');
      expect(delta.action).toBe('CONFLICT');
    });
  });
});