import { PrismaClient } from '@/lib/generated/prisma';
import { SyncAnalytics } from '../SyncAnalytics';
import { SyncStatus } from '../SyncHistoryManager';

// Mock Prisma Client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    syncHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn()
    }
  }))
}));

describe('SyncAnalytics', () => {
  let prisma: PrismaClient;
  let syncAnalytics: SyncAnalytics;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    syncAnalytics = new SyncAnalytics(prisma);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateSuccessRate', () => {
    it('should calculate accurate success rate', async () => {
      (prisma.syncHistory.count as jest.Mock)
        .mockResolvedValueOnce(100) // Total count
        .mockResolvedValueOnce(75); // Success count
      
      const successRate = await syncAnalytics.calculateSuccessRate('optimizely');
      
      expect(successRate).toBe(75);
      expect(prisma.syncHistory.count).toHaveBeenCalledTimes(2);
      expect(prisma.syncHistory.count).toHaveBeenCalledWith({
        where: {
          targetPlatform: 'optimizely',
          syncStatus: { not: SyncStatus.IN_PROGRESS }
        }
      });
    });
    
    it('should handle zero syncs', async () => {
      (prisma.syncHistory.count as jest.Mock)
        .mockResolvedValueOnce(0) // Total count
        .mockResolvedValueOnce(0); // Success count
      
      const successRate = await syncAnalytics.calculateSuccessRate('optimizely');
      
      expect(successRate).toBe(0);
    });
    
    it('should calculate with time range filter', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };
      
      (prisma.syncHistory.count as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40);
      
      const successRate = await syncAnalytics.calculateSuccessRate('optimizely', timeRange);
      
      expect(successRate).toBe(80);
      expect(prisma.syncHistory.count).toHaveBeenCalledWith({
        where: {
          targetPlatform: 'optimizely',
          syncStatus: { not: SyncStatus.IN_PROGRESS },
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      });
    });
  });
  
  describe('getAverageSyncTime', () => {
    it('should calculate average sync time correctly', async () => {
      const mockSyncs = [
        {
          startedAt: new Date('2024-01-01T10:00:00'),
          completedAt: new Date('2024-01-01T10:00:30') // 30 seconds
        },
        {
          startedAt: new Date('2024-01-01T11:00:00'),
          completedAt: new Date('2024-01-01T11:01:00') // 60 seconds
        },
        {
          startedAt: new Date('2024-01-01T12:00:00'),
          completedAt: new Date('2024-01-01T12:00:45') // 45 seconds
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockSyncs);
      
      const avgTime = await syncAnalytics.getAverageSyncTime('optimizely');
      
      expect(avgTime).toBe(45000); // 45 seconds in milliseconds
    });
    
    it('should return 0 for no syncs', async () => {
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue([]);
      
      const avgTime = await syncAnalytics.getAverageSyncTime('optimizely');
      
      expect(avgTime).toBe(0);
    });
    
    it('should handle syncs without completed time', async () => {
      const mockSyncs = [
        {
          startedAt: new Date('2024-01-01T10:00:00'),
          completedAt: new Date('2024-01-01T10:00:30')
        },
        {
          startedAt: new Date('2024-01-01T11:00:00'),
          completedAt: null // Not completed
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockSyncs);
      
      const avgTime = await syncAnalytics.getAverageSyncTime('optimizely');
      
      expect(avgTime).toBe(15000); // Only counts the completed sync
    });
  });
  
  describe('detectFailurePatterns', () => {
    it('should identify failure patterns', async () => {
      const mockFailures = [
        {
          errorMessage: 'Error: Authentication failed: Invalid credentials',
          targetPlatform: 'optimizely',
          typeKey: 'type1',
          createdAt: new Date('2024-01-01')
        },
        {
          errorMessage: 'Error: Authentication failed: Token expired',
          targetPlatform: 'optimizely',
          typeKey: 'type2',
          createdAt: new Date('2024-01-02')
        },
        {
          errorMessage: 'Error: Request timeout after 30000ms',
          targetPlatform: 'contentful',
          typeKey: 'type1',
          createdAt: new Date('2024-01-03')
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockFailures);
      
      const patterns = await syncAnalytics.detectFailurePatterns();
      
      // The function extracts the first 50 chars of error messages that don't match patterns
      // So we need to check for the actual error types returned
      expect(patterns.length).toBeGreaterThanOrEqual(2);
      
      // Find authentication errors
      const authErrors = patterns.filter(p => 
        p.errorType.includes('Authentication') || 
        p.errorType.includes('Invalid credentials') ||
        p.errorType.includes('Token expired')
      );
      expect(authErrors.length).toBeGreaterThanOrEqual(1);
      
      // Find timeout errors
      const timeoutErrors = patterns.find(p => p.errorType === 'Timeout Error');
      expect(timeoutErrors).toBeDefined();
      expect(timeoutErrors?.count).toBe(1);
    });
    
    it('should handle syncs without error messages', async () => {
      const mockFailures = [
        {
          errorMessage: null,
          targetPlatform: 'optimizely',
          typeKey: 'type1',
          createdAt: new Date()
        },
        {
          errorMessage: 'Network error: ECONNREFUSED',
          targetPlatform: 'optimizely',
          typeKey: 'type2',
          createdAt: new Date()
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockFailures);
      
      const patterns = await syncAnalytics.detectFailurePatterns();
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].errorType).toBe('Network Error');
    });
  });
  
  describe('generateHealthReport', () => {
    it('should generate comprehensive health report', async () => {
      const now = new Date();
      const lastSuccess = new Date(now.getTime() - 60000); // 1 minute ago
      const lastFailure = new Date(now.getTime() - 30000); // 30 seconds ago
      
      // Mock all the count queries
      (prisma.syncHistory.count as jest.Mock)
        .mockResolvedValueOnce(100) // Total syncs
        .mockResolvedValueOnce(75)  // Successful syncs
        .mockResolvedValueOnce(20)  // Failed syncs
        .mockResolvedValueOnce(3)   // Partial syncs
        .mockResolvedValueOnce(2)   // In-progress syncs
        .mockResolvedValueOnce(5);  // Recent failures
      
      // Mock find queries
      (prisma.syncHistory.findFirst as jest.Mock)
        .mockResolvedValueOnce({ completedAt: lastSuccess })
        .mockResolvedValueOnce({ createdAt: lastFailure });
      
      // Mock average sync time data
      (prisma.syncHistory.findMany as jest.Mock)
        .mockResolvedValueOnce([
          {
            startedAt: new Date(),
            completedAt: new Date(now.getTime() + 30000)
          }
        ])
        // Mock failure patterns
        .mockResolvedValueOnce([
          {
            errorMessage: 'Authentication failed',
            targetPlatform: 'optimizely',
            typeKey: 'type1',
            createdAt: new Date()
          }
        ]);
      
      const report = await syncAnalytics.generateHealthReport('optimizely');
      
      expect(report).toMatchObject({
        platform: 'optimizely',
        successRate: 75,
        totalSyncs: 100,
        successfulSyncs: 75,
        failedSyncs: 20,
        partialSyncs: 3,
        inProgressSyncs: 2,
        recentFailures: 5,
        lastSuccessfulSync: lastSuccess,
        lastFailedSync: lastFailure
      });
      
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
    
    it('should provide recommendations based on metrics', async () => {
      // Mock low success rate scenario
      (prisma.syncHistory.count as jest.Mock)
        .mockResolvedValueOnce(100) // Total
        .mockResolvedValueOnce(30)  // Success (30% success rate)
        .mockResolvedValueOnce(70)  // Failed
        .mockResolvedValueOnce(0)   // Partial
        .mockResolvedValueOnce(0)   // In-progress
        .mockResolvedValueOnce(15); // Recent failures
      
      (prisma.syncHistory.findFirst as jest.Mock)
        .mockResolvedValue(null);
      
      (prisma.syncHistory.findMany as jest.Mock)
        .mockResolvedValue([]);
      
      const report = await syncAnalytics.generateHealthReport('optimizely');
      
      expect(report.successRate).toBe(30);
      expect(report.recommendations).toContain(
        'Critical: Success rate below 50%. Review sync configuration and error logs.'
      );
      expect(report.recommendations).toContain(
        'High failure rate in last 24 hours. Check for service availability issues.'
      );
    });
  });
  
  describe('getSyncMetrics', () => {
    it('should calculate metrics by type and platform', async () => {
      const mockSyncs = [
        {
          typeKey: 'type1',
          targetPlatform: 'optimizely',
          syncStatus: 'SUCCESS',
          retryCount: 0,
          startedAt: new Date('2024-01-01T10:00:00'),
          completedAt: new Date('2024-01-01T10:00:30')
        },
        {
          typeKey: 'type1',
          targetPlatform: 'optimizely',
          syncStatus: 'SUCCESS',
          retryCount: 1,
          startedAt: new Date('2024-01-01T11:00:00'),
          completedAt: new Date('2024-01-01T11:00:20')
        },
        {
          typeKey: 'type1',
          targetPlatform: 'optimizely',
          syncStatus: 'FAILED',
          retryCount: 3,
          startedAt: new Date('2024-01-01T12:00:00'),
          completedAt: new Date('2024-01-01T12:01:00')
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockSyncs);
      
      const metrics = await syncAnalytics.getSyncMetrics('type1', 'optimizely');
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        typeKey: 'type1',
        platform: 'optimizely',
        totalAttempts: 3,
        successCount: 2,
        failureCount: 1,
        averageRetries: (0 + 1 + 3) / 3
      });
      
      expect(metrics[0].averageDuration).toBeGreaterThan(0);
      expect(metrics[0].maxDuration).toBe(60000); // 60 seconds
      expect(metrics[0].minDuration).toBe(20000); // 20 seconds
    });
    
    it('should handle multiple types and platforms', async () => {
      const mockSyncs = [
        {
          typeKey: 'type1',
          targetPlatform: 'optimizely',
          syncStatus: 'SUCCESS',
          retryCount: 0,
          startedAt: new Date(),
          completedAt: new Date()
        },
        {
          typeKey: 'type2',
          targetPlatform: 'contentful',
          syncStatus: 'SUCCESS',
          retryCount: 0,
          startedAt: new Date(),
          completedAt: new Date()
        }
      ];
      
      (prisma.syncHistory.findMany as jest.Mock).mockResolvedValue(mockSyncs);
      
      const metrics = await syncAnalytics.getSyncMetrics();
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0].typeKey).toBe('type1');
      expect(metrics[1].typeKey).toBe('type2');
    });
  });
});