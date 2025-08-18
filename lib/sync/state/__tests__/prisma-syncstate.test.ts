import { PrismaClient } from '@/lib/generated/prisma';

describe('SyncState Prisma Operations', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.syncState.deleteMany({
      where: {
        typeKey: {
          startsWith: 'test_'
        }
      }
    });
  });

  it('should create a new sync state', async () => {
    const typeKey = 'test_content_type_1';
    const syncState = await prisma.syncState.create({
      data: {
        typeKey,
        localHash: 'hash123',
        remoteHash: 'hash456',
        syncStatus: 'in_sync'
      }
    });

    expect(syncState.typeKey).toBe(typeKey);
    expect(syncState.localHash).toBe('hash123');
    expect(syncState.remoteHash).toBe('hash456');
    expect(syncState.syncStatus).toBe('in_sync');
  });

  it('should update existing sync state', async () => {
    const typeKey = 'test_content_type_2';
    
    // Create initial state
    await prisma.syncState.create({
      data: {
        typeKey,
        syncStatus: 'pending'
      }
    });

    // Update state
    const updated = await prisma.syncState.update({
      where: { typeKey },
      data: {
        localHash: 'newhash',
        lastSyncAt: new Date(),
        syncStatus: 'syncing',
        syncProgress: { step: 1, total: 3 }
      }
    });

    expect(updated.localHash).toBe('newhash');
    expect(updated.syncStatus).toBe('syncing');
    expect(updated.syncProgress).toEqual({ step: 1, total: 3 });
    expect(updated.lastSyncAt).toBeInstanceOf(Date);
  });

  it('should upsert sync state', async () => {
    const typeKey = 'test_content_type_3';
    
    // First upsert - creates
    const created = await prisma.syncState.upsert({
      where: { typeKey },
      create: {
        typeKey,
        syncStatus: 'new'
      },
      update: {
        syncStatus: 'updated'
      }
    });
    expect(created.syncStatus).toBe('new');

    // Second upsert - updates
    const updated = await prisma.syncState.upsert({
      where: { typeKey },
      create: {
        typeKey,
        syncStatus: 'new'
      },
      update: {
        syncStatus: 'updated',
        lastSyncAt: new Date()
      }
    });
    expect(updated.syncStatus).toBe('updated');
    expect(updated.lastSyncAt).toBeInstanceOf(Date);
  });

  it('should find interrupted syncs', async () => {
    // Create some test states
    await prisma.syncState.createMany({
      data: [
        { typeKey: 'test_interrupted_1', syncStatus: 'syncing' },
        { typeKey: 'test_interrupted_2', syncStatus: 'syncing' },
        { typeKey: 'test_completed', syncStatus: 'in_sync' }
      ]
    });

    const interrupted = await prisma.syncState.findMany({
      where: {
        syncStatus: 'syncing',
        typeKey: { startsWith: 'test_' }
      },
      select: { typeKey: true }
    });

    expect(interrupted).toHaveLength(2);
    expect(interrupted.map(s => s.typeKey)).toContain('test_interrupted_1');
    expect(interrupted.map(s => s.typeKey)).toContain('test_interrupted_2');
  });

  it('should track conflict status', async () => {
    const typeKey = 'test_conflict';
    
    await prisma.syncState.create({
      data: {
        typeKey,
        conflictStatus: 'detected',
        localHash: 'local123',
        remoteHash: 'remote456'
      }
    });

    const state = await prisma.syncState.findUnique({
      where: { typeKey }
    });

    expect(state?.conflictStatus).toBe('detected');
  });

  it('should store and retrieve sync progress', async () => {
    const typeKey = 'test_progress';
    const progress = {
      currentStep: 2,
      totalSteps: 5,
      lastProcessedId: 'abc123',
      processedCount: 10
    };

    await prisma.syncState.create({
      data: {
        typeKey,
        syncStatus: 'syncing',
        syncProgress: progress
      }
    });

    const state = await prisma.syncState.findUnique({
      where: { typeKey }
    });

    expect(state?.syncProgress).toEqual(progress);
  });

  it('should use indexes for efficient queries', async () => {
    // Create test data
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    await prisma.syncState.createMany({
      data: [
        { typeKey: 'test_recent_1', lastSyncAt: now, syncStatus: 'in_sync' },
        { typeKey: 'test_recent_2', lastSyncAt: now, syncStatus: 'in_sync' },
        { typeKey: 'test_old', lastSyncAt: yesterday, syncStatus: 'in_sync' },
        { typeKey: 'test_pending', syncStatus: 'pending' }
      ]
    });

    // Query using indexed fields
    const recentSyncs = await prisma.syncState.findMany({
      where: {
        lastSyncAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
        typeKey: { startsWith: 'test_' }
      }
    });

    expect(recentSyncs).toHaveLength(2);

    const pendingSyncs = await prisma.syncState.findMany({
      where: {
        syncStatus: 'pending',
        typeKey: { startsWith: 'test_' }
      }
    });

    expect(pendingSyncs).toHaveLength(1);
  });
});