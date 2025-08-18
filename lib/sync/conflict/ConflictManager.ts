/**
 * TypeScript implementation of Conflict Manager
 * Handles conflict flagging and review queue
 */

import { PrismaClient, ConflictLog } from '@/lib/generated/prisma';

export interface ConflictEntry {
  id: string;
  typeKey: string;
  status: string;
  flaggedAt: string;
  localHash?: string;
  remoteHash?: string;
  ancestorHash?: string | null;
  conflictType: string;
  conflictDetails: any;
  priority: string;
  metadata?: any;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  notes?: string;
  lastUpdated?: string;
}

export interface ConflictFilter {
  status?: string;
  typeKey?: string;
  priority?: string;
}

export interface ResolutionResult {
  conflictId: string;
  typeKey: string;
  resolution: string;
  resolvedData: any;
  resolvedBy: string;
  resolvedAt: string;
  previousStatus: string;
}

export class ConflictManager {
  private database: PrismaClient;
  private conflictQueue: Map<string, ConflictEntry>;
  private resolutionHistory: ResolutionResult[];

  constructor(database: PrismaClient) {
    this.database = database;
    this.conflictQueue = new Map();
    this.resolutionHistory = [];
  }

  /**
   * Flag a conflict for manual review
   */
  async flagForReview(typeKey: string, conflictDetails: any): Promise<ConflictEntry> {
    try {
      const conflictEntry: ConflictEntry = {
        id: this.generateConflictId(),
        typeKey,
        status: 'pending_review',
        flaggedAt: new Date().toISOString(),
        localHash: conflictDetails.localVersion?.hash,
        remoteHash: conflictDetails.remoteVersion?.hash,
        ancestorHash: conflictDetails.ancestorVersion?.hash,
        conflictType: conflictDetails.type,
        conflictDetails: conflictDetails.details,
        priority: this.calculatePriority(conflictDetails),
        metadata: {
          localChanges: conflictDetails.details?.localChanges,
          remoteChanges: conflictDetails.details?.remoteChanges,
          conflictingFields: conflictDetails.details?.conflictingFields
        }
      };

      // Add to in-memory queue
      this.conflictQueue.set(conflictEntry.id, conflictEntry);

      // Persist to database
      await this.persistConflict(conflictEntry);

      return conflictEntry;
    } catch (error) {
      console.error(`Error flagging conflict for ${typeKey}:`, error);
      throw error;
    }
  }

  /**
   * Get all conflicts in the review queue
   */
  async getConflictQueue(filter: ConflictFilter = {}): Promise<ConflictEntry[]> {
    try {
      let conflicts = Array.from(this.conflictQueue.values());

      // Apply filters
      if (filter.status) {
        conflicts = conflicts.filter(c => c.status === filter.status);
      }
      if (filter.typeKey) {
        conflicts = conflicts.filter(c => c.typeKey === filter.typeKey);
      }
      if (filter.priority) {
        conflicts = conflicts.filter(c => c.priority === filter.priority);
      }

      // Sort by priority and timestamp
      conflicts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
        }
        return new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime();
      });

      return conflicts;
    } catch (error) {
      console.error('Error getting conflict queue:', error);
      throw error;
    }
  }

  /**
   * Get a specific conflict by ID
   */
  async getConflict(conflictId: string): Promise<ConflictEntry | null> {
    const conflict = this.conflictQueue.get(conflictId);
    
    if (!conflict) {
      // Try to load from database
      return await this.loadConflictFromDatabase(conflictId);
    }

    return conflict;
  }

  /**
   * Update conflict status
   */
  async updateConflictStatus(
    conflictId: string, 
    status: string, 
    metadata: any = {}
  ): Promise<ConflictEntry> {
    try {
      const conflict = await this.getConflict(conflictId);
      
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      conflict.status = status;
      conflict.lastUpdated = new Date().toISOString();
      
      if (metadata.resolvedBy) {
        conflict.resolvedBy = metadata.resolvedBy;
      }
      if (metadata.resolution) {
        conflict.resolution = metadata.resolution;
      }
      if (metadata.notes) {
        conflict.notes = metadata.notes;
      }

      // Update in-memory queue
      this.conflictQueue.set(conflictId, conflict);

      // Persist to database
      await this.updateConflictInDatabase(conflict);

      // Add to resolution history if resolved
      if (status === 'resolved') {
        this.addToResolutionHistory(conflict);
      }

      return conflict;
    } catch (error) {
      console.error(`Error updating conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a conflict with a specific strategy
   */
  async resolveConflict(
    conflictId: string,
    resolution: string,
    resolvedData: any,
    resolvedBy: string
  ): Promise<ResolutionResult> {
    try {
      const conflict = await this.getConflict(conflictId);
      
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      const resolutionResult: ResolutionResult = {
        conflictId,
        typeKey: conflict.typeKey,
        resolution,
        resolvedData,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        previousStatus: conflict.status
      };

      // Update conflict status
      await this.updateConflictStatus(conflictId, 'resolved', {
        resolvedBy,
        resolution,
        resolvedAt: resolutionResult.resolvedAt
      });

      // Store resolution in history
      this.resolutionHistory.push(resolutionResult);

      // Persist resolution
      await this.persistResolution(resolutionResult);

      return resolutionResult;
    } catch (error) {
      console.error(`Error resolving conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate priority for a conflict
   */
  private calculatePriority(conflictDetails: any): string {
    // Structural conflicts are highest priority
    if (conflictDetails.type === 'structural') {
      return 'critical';
    }

    // Delete conflicts are high priority
    if (conflictDetails.type === 'delete') {
      return 'high';
    }

    // Multiple field conflicts are medium priority
    const conflictingFields = conflictDetails.details?.conflictingFields || [];
    if (conflictingFields.length > 3) {
      return 'medium';
    }

    // Single field conflicts are low priority
    return 'low';
  }

  /**
   * Get numeric value for priority
   */
  private getPriorityValue(priority: string): number {
    const priorities: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };
    return priorities[priority] || 0;
  }

  /**
   * Generate unique conflict ID
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add conflict to resolution history
   */
  private addToResolutionHistory(conflict: ConflictEntry): void {
    const resolution: ResolutionResult = {
      conflictId: conflict.id,
      typeKey: conflict.typeKey,
      resolution: conflict.resolution || '',
      resolvedData: conflict.conflictDetails,
      resolvedBy: conflict.resolvedBy || 'system',
      resolvedAt: conflict.resolvedAt || conflict.lastUpdated || '',
      previousStatus: 'pending_review'
    };

    this.resolutionHistory.unshift(resolution);

    // Keep only last 100 resolutions in memory
    if (this.resolutionHistory.length > 100) {
      this.resolutionHistory = this.resolutionHistory.slice(0, 100);
    }
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(filter: any = {}): ResolutionResult[] {
    let history = [...this.resolutionHistory];

    if (filter.typeKey) {
      history = history.filter(h => h.typeKey === filter.typeKey);
    }
    if (filter.resolvedBy) {
      history = history.filter(h => h.resolvedBy === filter.resolvedBy);
    }
    if (filter.startDate) {
      history = history.filter(h => new Date(h.resolvedAt) >= new Date(filter.startDate));
    }
    if (filter.endDate) {
      history = history.filter(h => new Date(h.resolvedAt) <= new Date(filter.endDate));
    }

    return history;
  }

  /**
   * Clear resolved conflicts from queue
   */
  async clearResolvedConflicts(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let clearedCount = 0;
    
    for (const [id, conflict] of this.conflictQueue.entries()) {
      if (conflict.status === 'resolved' && 
          conflict.lastUpdated &&
          new Date(conflict.lastUpdated) < cutoffDate) {
        this.conflictQueue.delete(id);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Get conflict statistics
   */
  getStatistics(): any {
    const stats = {
      total: this.conflictQueue.size,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      resolutionRate: '0%'
    };

    for (const conflict of this.conflictQueue.values()) {
      // Count by status
      stats.byStatus[conflict.status] = (stats.byStatus[conflict.status] || 0) + 1;
      
      // Count by type
      stats.byType[conflict.conflictType] = (stats.byType[conflict.conflictType] || 0) + 1;
      
      // Count by priority
      stats.byPriority[conflict.priority] = (stats.byPriority[conflict.priority] || 0) + 1;
    }

    // Calculate resolution rate
    const resolved = stats.byStatus.resolved || 0;
    if (stats.total > 0) {
      stats.resolutionRate = (resolved / stats.total * 100).toFixed(2) + '%';
    }

    return stats;
  }

  /**
   * Persist conflict to database
   */
  private async persistConflict(conflict: ConflictEntry): Promise<void> {
    try {
      await this.database.conflictLog.create({
        data: {
          id: conflict.id,
          typeKey: conflict.typeKey,
          localHash: conflict.localHash || '',
          remoteHash: conflict.remoteHash || '',
          ancestorHash: conflict.ancestorHash,
          conflictType: conflict.conflictType,
          conflictDetails: conflict.conflictDetails,
          resolution: null,
          resolvedBy: null,
          resolvedAt: null
        }
      });
    } catch (error) {
      console.error('Error persisting conflict to database:', error);
      // Don't throw - allow operation to continue with in-memory storage
    }
  }

  /**
   * Load conflict from database
   */
  private async loadConflictFromDatabase(conflictId: string): Promise<ConflictEntry | null> {
    try {
      const dbConflict = await this.database.conflictLog.findUnique({
        where: { id: conflictId }
      });

      if (dbConflict) {
        return {
          id: dbConflict.id,
          typeKey: dbConflict.typeKey,
          status: dbConflict.resolution ? 'resolved' : 'pending_review',
          flaggedAt: dbConflict.createdAt.toISOString(),
          localHash: dbConflict.localHash,
          remoteHash: dbConflict.remoteHash,
          ancestorHash: dbConflict.ancestorHash,
          conflictType: dbConflict.conflictType,
          conflictDetails: dbConflict.conflictDetails,
          priority: 'medium', // Default priority
          resolution: dbConflict.resolution,
          resolvedBy: dbConflict.resolvedBy,
          resolvedAt: dbConflict.resolvedAt?.toISOString()
        };
      }
    } catch (error) {
      console.error('Error loading conflict from database:', error);
    }

    return null;
  }

  /**
   * Update conflict in database
   */
  private async updateConflictInDatabase(conflict: ConflictEntry): Promise<void> {
    try {
      await this.database.conflictLog.update({
        where: { id: conflict.id },
        data: {
          resolution: conflict.resolution,
          resolvedBy: conflict.resolvedBy,
          resolvedAt: conflict.status === 'resolved' ? new Date() : null
        }
      });
    } catch (error) {
      console.error('Error updating conflict in database:', error);
    }
  }

  /**
   * Persist resolution to database
   */
  private async persistResolution(resolution: ResolutionResult): Promise<void> {
    try {
      await this.database.conflictLog.update({
        where: { id: resolution.conflictId },
        data: {
          resolution: resolution.resolution,
          resolvedBy: resolution.resolvedBy,
          resolvedAt: new Date(resolution.resolvedAt)
        }
      });
    } catch (error) {
      console.error('Error persisting resolution to database:', error);
    }
  }
}