import { PrismaClient } from '@/lib/generated/prisma';
import { SyncStatus } from './SyncHistoryManager';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface FailurePattern {
  errorType: string;
  count: number;
  platforms: string[];
  syncTypes: string[];
  lastOccurrence: Date;
}

export interface HealthReport {
  platform: string;
  successRate: number;
  averageDuration: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
  inProgressSyncs: number;
  recentFailures: number;
  commonErrors: string[];
  recommendations: string[];
  lastSuccessfulSync: Date | null;
  lastFailedSync: Date | null;
}

export interface SyncMetrics {
  syncType: string;
  platform: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  averageRetries: number;
}

export class SyncAnalytics {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Calculate success rate for a platform within a time range
   */
  async calculateSuccessRate(
    platform: string, 
    timeRange?: TimeRange
  ): Promise<number> {
    const where: any = {
      targetSystem: platform,
      status: { not: SyncStatus.IN_PROGRESS }
    };
    
    if (timeRange) {
      where.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }
    
    const [totalCount, successCount] = await Promise.all([
      this.prisma.syncHistory.count({ where }),
      this.prisma.syncHistory.count({
        where: { ...where, status: SyncStatus.SUCCESS }
      })
    ]);
    
    if (totalCount === 0) return 0;
    return (successCount / totalCount) * 100;
  }
  
  /**
   * Calculate average sync time for a platform
   */
  async getAverageSyncTime(platform: string): Promise<number> {
    const syncs = await this.prisma.syncHistory.findMany({
      where: {
        targetSystem: platform,
        status: SyncStatus.SUCCESS,
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      }
    });
    
    if (syncs.length === 0) return 0;
    
    const durations = syncs.map(sync => {
      if (!sync.completedAt) return 0;
      return sync.completedAt.getTime() - sync.startedAt.getTime();
    });
    
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    return totalDuration / syncs.length;
  }
  
  /**
   * Detect common failure patterns
   */
  async detectFailurePatterns(): Promise<FailurePattern[]> {
    const failedSyncs = await this.prisma.syncHistory.findMany({
      where: { status: SyncStatus.FAILED },
      select: {
        errorMessage: true,
        targetSystem: true,
        syncType: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Analyze last 100 failures
    });
    
    const patternMap = new Map<string, FailurePattern>();
    
    for (const sync of failedSyncs) {
      if (!sync.errorMessage) continue;
      
      // Extract error type from message
      const errorType = this.extractErrorType(sync.errorMessage);
      
      if (!patternMap.has(errorType)) {
        patternMap.set(errorType, {
          errorType,
          count: 0,
          platforms: [],
          syncTypes: [],
          lastOccurrence: sync.createdAt
        });
      }
      
      const pattern = patternMap.get(errorType)!;
      pattern.count++;
      
      if (!pattern.platforms.includes(sync.targetSystem)) {
        pattern.platforms.push(sync.targetSystem);
      }
      
      if (!pattern.syncTypes.includes(sync.syncType)) {
        pattern.syncTypes.push(sync.syncType);
      }
      
      if (sync.createdAt > pattern.lastOccurrence) {
        pattern.lastOccurrence = sync.createdAt;
      }
    }
    
    return Array.from(patternMap.values())
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Generate comprehensive health report for a platform
   */
  async generateHealthReport(platform: string): Promise<HealthReport> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get overall statistics
    const [
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      partialSyncs,
      inProgressSyncs,
      recentFailures,
      lastSuccessfulSync,
      lastFailedSync
    ] = await Promise.all([
      this.prisma.syncHistory.count({ where: { targetSystem: platform } }),
      this.prisma.syncHistory.count({ 
        where: { targetSystem: platform, status: SyncStatus.SUCCESS } 
      }),
      this.prisma.syncHistory.count({ 
        where: { targetSystem: platform, status: SyncStatus.FAILED } 
      }),
      this.prisma.syncHistory.count({ 
        where: { targetSystem: platform, status: SyncStatus.PARTIAL } 
      }),
      this.prisma.syncHistory.count({ 
        where: { targetSystem: platform, status: SyncStatus.IN_PROGRESS } 
      }),
      this.prisma.syncHistory.count({ 
        where: { 
          targetSystem: platform, 
          status: SyncStatus.FAILED,
          createdAt: { gte: last24Hours }
        } 
      }),
      this.prisma.syncHistory.findFirst({
        where: { targetSystem: platform, status: SyncStatus.SUCCESS },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true }
      }),
      this.prisma.syncHistory.findFirst({
        where: { targetSystem: platform, status: SyncStatus.FAILED },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);
    
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
    const averageDuration = await this.getAverageSyncTime(platform);
    
    // Get common errors
    const failurePatterns = await this.detectFailurePatterns();
    const platformFailures = failurePatterns
      .filter(p => p.platforms.includes(platform))
      .slice(0, 5)
      .map(p => p.errorType);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      successRate,
      recentFailures,
      failurePatterns
    );
    
    return {
      platform,
      successRate,
      averageDuration,
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      partialSyncs,
      inProgressSyncs,
      recentFailures,
      commonErrors: platformFailures,
      recommendations,
      lastSuccessfulSync: lastSuccessfulSync?.completedAt || null,
      lastFailedSync: lastFailedSync?.createdAt || null
    };
  }
  
  /**
   * Get sync metrics by type and platform
   */
  async getSyncMetrics(
    syncType?: string,
    platform?: string
  ): Promise<SyncMetrics[]> {
    const where: any = {};
    if (syncType) where.syncType = syncType;
    if (platform) where.targetSystem = platform;
    
    const syncs = await this.prisma.syncHistory.findMany({
      where,
      select: {
        syncType: true,
        targetSystem: true,
        status: true,
        startedAt: true,
        completedAt: true
      }
    });
    
    // Group by syncType and platform
    const metricsMap = new Map<string, SyncMetrics>();
    
    for (const sync of syncs) {
      const key = `${sync.syncType}-${sync.targetSystem}`;
      
      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          syncType: sync.syncType,
          platform: sync.targetSystem,
          totalAttempts: 0,
          successCount: 0,
          failureCount: 0,
          averageDuration: 0,
          maxDuration: 0,
          minDuration: Number.MAX_VALUE,
          averageRetries: 0
        });
      }
      
      const metrics = metricsMap.get(key)!;
      metrics.totalAttempts++;
      
      if (sync.status === SyncStatus.SUCCESS) {
        metrics.successCount++;
      } else if (sync.status === SyncStatus.FAILED) {
        metrics.failureCount++;
      }
      
      if (sync.completedAt) {
        const duration = sync.completedAt.getTime() - sync.startedAt.getTime();
        metrics.averageDuration += duration;
        metrics.maxDuration = Math.max(metrics.maxDuration, duration);
        metrics.minDuration = Math.min(metrics.minDuration, duration);
      }
      
      // Note: retryCount field doesn't exist in SyncHistory model
      // This would need to be tracked separately if retry metrics are needed
    }
    
    // Calculate averages
    for (const metrics of metricsMap.values()) {
      if (metrics.totalAttempts > 0) {
        metrics.averageDuration /= metrics.totalAttempts;
        metrics.averageRetries /= metrics.totalAttempts;
      }
      if (metrics.minDuration === Number.MAX_VALUE) {
        metrics.minDuration = 0;
      }
    }
    
    return Array.from(metricsMap.values());
  }
  
  /**
   * Extract error type from error message
   */
  private extractErrorType(errorMessage: string): string {
    // Common error patterns
    if (errorMessage.includes('timeout')) return 'Timeout Error';
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) return 'Authentication Error';
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) return 'Authorization Error';
    if (errorMessage.includes('404') || errorMessage.includes('not found')) return 'Not Found Error';
    if (errorMessage.includes('409') || errorMessage.includes('conflict')) return 'Conflict Error';
    if (errorMessage.includes('412') || errorMessage.includes('precondition')) return 'Precondition Failed';
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) return 'Rate Limit Error';
    if (errorMessage.includes('500') || errorMessage.includes('internal server')) return 'Server Error';
    if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) return 'Service Unavailable';
    if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) return 'Network Error';
    if (errorMessage.includes('validation')) return 'Validation Error';
    
    // Return first 50 chars of error message if no pattern matches
    return errorMessage.substring(0, 50);
  }
  
  /**
   * Generate recommendations based on health metrics
   */
  private generateRecommendations(
    successRate: number,
    recentFailures: number,
    failurePatterns: FailurePattern[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Success rate recommendations
    if (successRate < 50) {
      recommendations.push('Critical: Success rate below 50%. Review sync configuration and error logs.');
    } else if (successRate < 80) {
      recommendations.push('Warning: Success rate below 80%. Consider implementing retry strategies.');
    }
    
    // Recent failure recommendations
    if (recentFailures > 10) {
      recommendations.push('High failure rate in last 24 hours. Check for service availability issues.');
    }
    
    // Pattern-based recommendations
    const authErrors = failurePatterns.find(p => 
      p.errorType.includes('Authentication') || p.errorType.includes('Authorization')
    );
    if (authErrors && authErrors.count > 5) {
      recommendations.push('Multiple authentication failures detected. Verify API credentials.');
    }
    
    const timeoutErrors = failurePatterns.find(p => p.errorType.includes('Timeout'));
    if (timeoutErrors && timeoutErrors.count > 5) {
      recommendations.push('Frequent timeouts occurring. Consider increasing timeout limits or optimizing payload size.');
    }
    
    const rateLimit = failurePatterns.find(p => p.errorType.includes('Rate Limit'));
    if (rateLimit && rateLimit.count > 3) {
      recommendations.push('Rate limiting detected. Implement request throttling or increase rate limits.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System operating normally. Continue monitoring for optimal performance.');
    }
    
    return recommendations;
  }
}