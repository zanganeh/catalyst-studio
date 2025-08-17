import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager, SyncStatus } from '../SyncHistoryManager';
import { ContentTypeHasher } from '../../versioning/ContentTypeHasher';

// Mock Prisma Client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    syncHistory: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    }
  }))
}));

describe('SyncHistoryManager', () => {
  let prisma: PrismaClient;
  let syncHistoryManager: SyncHistoryManager;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    syncHistoryManager = new SyncHistoryManager(prisma);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('recordSyncAttempt', () => {
    it('should record sync attempt with snapshot', async () => {
      const mockContentType = {
        key: 'test-type',
        displayName: 'Test Type',
        properties: []
      };
      
      const mockSyncRecord = {
        id: 'sync-123',
        typeKey: 'test-type',
        versionHash: 'hash-123',
        targetPlatform: 'optimizely',
        syncDirection: 'PUSH',
        syncStatus: 'IN_PROGRESS',
        pushedData: JSON.stringify(mockContentType),
        startedAt: new Date()
      };
      
      (prisma.syncHistory.create as jest.Mock).mockResolvedValue(mockSyncRecord);
      
      const syncId = await syncHistoryManager.recordSyncAttempt({
        typeKey: 'test-type',
        versionHash: 'hash-123',
        targetPlatform: 'optimizely',
        syncDirection: 'PUSH',
        data: mockContentType,
        deploymentId: 'deploy-123'
      });
      
      expect(syncId).toBe('sync-123');
      expect(prisma.syncHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          typeKey: 'test-type',
          versionHash: 'hash-123',
          targetPlatform: 'optimizely',
          syncDirection: 'PUSH',
          syncStatus: SyncStatus.IN_PROGRESS,
          deploymentId: 'deploy-123',
          retryCount: 0
        })
      });
    });
  });
  
  describe('updateSyncStatus', () => {
    it('should update sync status on completion', async () => {
      const mockResponse = { success: true, data: 'test' };
      
      await syncHistoryManager.updateSyncStatus(
        'sync-123',
        SyncStatus.SUCCESS,
        mockResponse
      );
      
      expect(prisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-123' },
        data: {
          syncStatus: SyncStatus.SUCCESS,
          completedAt: expect.any(Date),
          responseData: JSON.stringify(mockResponse)
        }
      });
    });
    
    it('should update sync status with error', async () => {
      const error = new Error('Test error');
      
      await syncHistoryManager.updateSyncStatus(
        'sync-123',
        SyncStatus.FAILED,
        undefined,
        error
      );
      
      expect(prisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-123' },
        data: {
          syncStatus: SyncStatus.FAILED,
          completedAt: expect.any(Date),
          errorMessage: 'Test error'
        }
      });
    });
  });
  
  describe('linkToVersion', () => {
    it('should link sync to version history', async () => {
      await syncHistoryManager.linkToVersion('sync-123', 'version-hash-456');
      
      expect(prisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-123' },
        data: { versionHash: 'version-hash-456' }
      });
    });
  });
  
  describe('getSyncHistory', () => {
    it('should query sync history with filters', async () => {
      const mockRecords = [
        {
          id: 'sync-1',
          typeKey: 'type-1',
          syncStatus: 'SUCCESS',
          targetPlatform: 'optimizely'
        },
        {
          id: 'sync-2',
          typeKey: 'type-2',
          syncStatus: 'FAILED',
          targetPlatform: 'optimizely'
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockRecords);
      
      const history = await syncHistoryManager.getSyncHistory({
        targetPlatform: 'optimizely',
        syncStatus: SyncStatus.SUCCESS
      });
      
      expect(prisma.syncHistory.findMany).toHaveBeenCalledWith({
        where: {
          targetPlatform: 'optimizely',
          syncStatus: SyncStatus.SUCCESS
        },
        orderBy: { createdAt: 'desc' }
      });
      
      expect(history).toEqual(mockRecords);
    });
    
    it('should handle date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue([]);
      
      await syncHistoryManager.getSyncHistory({
        dateRange: { start: startDate, end: endDate }
      });
      
      expect(prisma.syncHistory.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });
  
  describe('getLastSuccessfulSync', () => {
    it('should find last successful sync for type', async () => {
      const mockRecord = {
        id: 'sync-123',
        typeKey: 'test-type',
        syncStatus: 'SUCCESS',
        completedAt: new Date()
      };
      
      (prisma.syncHistory.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      
      const result = await syncHistoryManager.getLastSuccessfulSync(
        'test-type',
        'optimizely'
      );
      
      expect(prisma.syncHistory.findFirst).toHaveBeenCalledWith({
        where: {
          typeKey: 'test-type',
          targetPlatform: 'optimizely',
          syncStatus: SyncStatus.SUCCESS
        },
        orderBy: { completedAt: 'desc' }
      });
      
      expect(result).toEqual(mockRecord);
    });
    
    it('should return null if no successful sync found', async () => {
      (prisma.syncHistory.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await syncHistoryManager.getLastSuccessfulSync(
        'test-type',
        'optimizely'
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue({ success: true });
      
      const result = await syncHistoryManager.executeWithRetry(
        operation,
        'sync-123'
      );
      
      expect(result).toEqual({ success: true });
      expect(operation).toHaveBeenCalledTimes(1);
      expect(prisma.syncHistory.update).not.toHaveBeenCalled();
    });
    
    it('should retry on failure with exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ success: true });
      
      // Speed up test by reducing delays
      const fastRetryManager = new SyncHistoryManager(prisma, {
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffMultiplier: 2,
        maxDelayMs: 50
      });
      
      const result = await fastRetryManager.executeWithRetry(
        operation,
        'sync-123'
      );
      
      expect(result).toEqual({ success: true });
      expect(operation).toHaveBeenCalledTimes(2);
      expect(prisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-123' },
        data: { retryCount: 1 }
      });
    });
    
    it('should throw error after max attempts', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));
      
      const fastRetryManager = new SyncHistoryManager(prisma, {
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffMultiplier: 2,
        maxDelayMs: 50
      });
      
      await expect(
        fastRetryManager.executeWithRetry(operation, 'sync-123')
      ).rejects.toThrow('Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(2);
      expect(prisma.syncHistory.update).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getVersionHash', () => {
    it('should calculate version hash using ContentTypeHasher', async () => {
      const contentType = {
        key: 'test-type',
        displayName: 'Test Type',
        properties: []
      };
      
      const hasher = new ContentTypeHasher();
      const expectedHash = hasher.calculateHash(contentType);
      
      const hash = await syncHistoryManager.getVersionHash(contentType);
      
      expect(hash).toBe(expectedHash);
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });
  });
});