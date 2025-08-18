/**
 * TypeScript implementation of Resolution Strategy Engine
 * Implements various strategies for resolving conflicts
 */

export interface Conflict {
  type: string;
  details?: any;
  localVersion?: any;
  remoteVersion?: any;
  ancestorVersion?: any;
  local?: any;
  remote?: any;
  ancestor?: any;
}

export interface Resolution {
  winner: string;
  merged: any;
  changes: any[];
  strategy: string;
  timestamp: string;
  description: string;
  conflicts?: any[];
  discarded?: any;
  strategyUsed?: string;
  autoResolved?: boolean;
}

export interface ResolutionResult {
  success: boolean;
  resolution?: Resolution;
  error?: string;
  requiresManual?: boolean;
  manualResolutionData?: any;
}

/**
 * Base ResolutionStrategy class
 */
export abstract class ResolutionStrategy {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Check if this strategy can auto-resolve the conflict
   */
  abstract canAutoResolve(conflict: Conflict): boolean;

  /**
   * Resolve the conflict using this strategy
   */
  abstract resolve(conflict: Conflict): ResolutionResult;

  /**
   * Validate the resolution result
   */
  validateResolution(resolution: Resolution): boolean {
    return !!(resolution && resolution.merged && resolution.winner);
  }
}

/**
 * LocalWins Strategy - Prefer local changes
 */
export class LocalWinsStrategy extends ResolutionStrategy {
  constructor() {
    super('local_wins');
  }

  canAutoResolve(conflict: Conflict): boolean {
    return conflict.type !== 'structural' && 
           conflict.type !== 'delete' &&
           conflict.type !== 'add_delete_conflict' &&
           conflict.type !== 'delete_add_conflict';
  }

  resolve(conflict: Conflict): ResolutionResult {
    if (!this.canAutoResolve(conflict)) {
      return {
        success: false,
        error: 'Cannot auto-resolve this conflict type with LocalWins strategy',
        requiresManual: true
      };
    }

    const resolution: Resolution = {
      winner: 'local',
      merged: conflict.localVersion?.data || conflict.local?.data || {},
      changes: conflict.details?.localChanges || [],
      strategy: this.name,
      timestamp: new Date().toISOString(),
      conflicts: conflict.details?.conflictingFields || [],
      description: 'Resolved by keeping all local changes',
      discarded: {
        source: 'remote',
        changes: conflict.details?.remoteChanges || [],
        data: conflict.remoteVersion?.data || conflict.remote?.data || {}
      }
    };

    return {
      success: true,
      resolution
    };
  }
}

/**
 * RemoteWins Strategy - Prefer remote changes
 */
export class RemoteWinsStrategy extends ResolutionStrategy {
  constructor() {
    super('remote_wins');
  }

  canAutoResolve(conflict: Conflict): boolean {
    return conflict.type !== 'structural' && 
           conflict.type !== 'delete' &&
           conflict.type !== 'add_delete_conflict' &&
           conflict.type !== 'delete_add_conflict';
  }

  resolve(conflict: Conflict): ResolutionResult {
    if (!this.canAutoResolve(conflict)) {
      return {
        success: false,
        error: 'Cannot auto-resolve this conflict type with RemoteWins strategy',
        requiresManual: true
      };
    }

    const resolution: Resolution = {
      winner: 'remote',
      merged: conflict.remoteVersion?.data || conflict.remote?.data || {},
      changes: conflict.details?.remoteChanges || [],
      strategy: this.name,
      timestamp: new Date().toISOString(),
      conflicts: conflict.details?.conflictingFields || [],
      description: 'Resolved by keeping all remote changes',
      discarded: {
        source: 'local',
        changes: conflict.details?.localChanges || [],
        data: conflict.localVersion?.data || conflict.local?.data || {}
      }
    };

    return {
      success: true,
      resolution
    };
  }
}

/**
 * ManualMerge Strategy - Require user input
 */
export class ManualMergeStrategy extends ResolutionStrategy {
  constructor() {
    super('manual_merge');
  }

  canAutoResolve(conflict: Conflict): boolean {
    return false;
  }

  resolve(conflict: Conflict): ResolutionResult {
    const manualResolutionData = {
      requiresManual: true,
      strategy: this.name,
      conflictType: conflict.type,
      conflictingFields: conflict.details?.conflictingFields || [],
      localData: conflict.localVersion?.data || conflict.local?.data || {},
      remoteData: conflict.remoteVersion?.data || conflict.remote?.data || {},
      ancestorData: conflict.ancestorVersion?.data || conflict.ancestor?.data || {},
      suggestedActions: this.generateSuggestedActions(conflict),
      instructions: 'Manual intervention required. Please review the conflicting changes and select appropriate values for each field.',
      timestamp: new Date().toISOString()
    };

    return {
      success: false,
      requiresManual: true,
      manualResolutionData
    };
  }

  private generateSuggestedActions(conflict: Conflict): any[] {
    const actions: any[] = [];
    const conflictingFields = conflict.details?.conflictingFields || [];

    for (const field of conflictingFields) {
      actions.push({
        field: field.field,
        options: [
          {
            source: 'local',
            value: field.localValue,
            description: 'Use local value'
          },
          {
            source: 'remote',
            value: field.remoteValue,
            description: 'Use remote value'
          },
          {
            source: 'ancestor',
            value: field.ancestorValue,
            description: 'Revert to original value'
          },
          {
            source: 'custom',
            value: null,
            description: 'Enter custom value'
          }
        ]
      });
    }

    return actions;
  }
}

/**
 * AutoMerge Strategy - Merge non-conflicting changes
 */
export class AutoMergeStrategy extends ResolutionStrategy {
  constructor() {
    super('auto_merge');
  }

  canAutoResolve(conflict: Conflict): boolean {
    return !this.hasOverlappingChanges(conflict);
  }

  resolve(conflict: Conflict): ResolutionResult {
    if (!this.canAutoResolve(conflict)) {
      return {
        success: false,
        error: 'Cannot auto-merge due to overlapping changes',
        requiresManual: true
      };
    }

    const merged = { ...(conflict.ancestorVersion?.data || conflict.ancestor?.data || {}) };
    const mergeLog: any[] = [];

    const localChanges = conflict.details?.localChanges || {};
    const remoteChanges = conflict.details?.remoteChanges || {};
    const localData = conflict.localVersion?.data || conflict.local?.data || {};
    const remoteData = conflict.remoteVersion?.data || conflict.remote?.data || {};
    
    // Apply local additions
    for (const field of (localChanges.added || [])) {
      if (!(remoteChanges.deleted || []).includes(field)) {
        merged[field] = localData[field];
        mergeLog.push({
          field,
          action: 'added',
          source: 'local',
          value: localData[field]
        });
      }
    }

    // Apply remote additions
    for (const field of (remoteChanges.added || [])) {
      if (!(localChanges.deleted || []).includes(field)) {
        merged[field] = remoteData[field];
        mergeLog.push({
          field,
          action: 'added',
          source: 'remote',
          value: remoteData[field]
        });
      }
    }

    // Apply local modifications (non-conflicting)
    for (const field of (localChanges.modified || [])) {
      if (!(remoteChanges.modified || []).includes(field)) {
        merged[field] = localData[field];
        mergeLog.push({
          field,
          action: 'modified',
          source: 'local',
          value: localData[field]
        });
      }
    }

    // Apply remote modifications (non-conflicting)
    for (const field of (remoteChanges.modified || [])) {
      if (!(localChanges.modified || []).includes(field)) {
        merged[field] = remoteData[field];
        mergeLog.push({
          field,
          action: 'modified',
          source: 'remote',
          value: remoteData[field]
        });
      }
    }

    // Remove deleted fields
    for (const field of (localChanges.deleted || [])) {
      if (!(remoteChanges.modified || []).includes(field) && 
          !(remoteChanges.added || []).includes(field)) {
        delete merged[field];
        mergeLog.push({
          field,
          action: 'deleted',
          source: 'local'
        });
      }
    }

    for (const field of (remoteChanges.deleted || [])) {
      if (!(localChanges.modified || []).includes(field) && 
          !(localChanges.added || []).includes(field)) {
        delete merged[field];
        mergeLog.push({
          field,
          action: 'deleted',
          source: 'remote'
        });
      }
    }

    const resolution: Resolution = {
      winner: 'merged',
      merged,
      changes: mergeLog,
      strategy: this.name,
      timestamp: new Date().toISOString(),
      description: 'Auto-merged non-conflicting changes from both versions'
    };

    return {
      success: true,
      resolution
    };
  }

  private hasOverlappingChanges(conflict: Conflict): boolean {
    const localChanges = conflict.details?.localChanges || {};
    const remoteChanges = conflict.details?.remoteChanges || {};

    const localModified = new Set(localChanges.modified || []);
    const remoteModified = new Set(remoteChanges.modified || []);

    // Check for fields modified in both
    for (const field of localModified) {
      if (remoteModified.has(field)) {
        return true;
      }
    }

    // Check for add/delete conflicts
    const localAdded = new Set(localChanges.added || []);
    const remoteDeleted = new Set(remoteChanges.deleted || []);
    const localDeleted = new Set(localChanges.deleted || []);
    const remoteAdded = new Set(remoteChanges.added || []);

    for (const field of localAdded) {
      if (remoteDeleted.has(field)) {
        return true;
      }
    }

    for (const field of remoteAdded) {
      if (localDeleted.has(field)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Resolution Strategy Manager
 */
export class ResolutionStrategyManager {
  private strategies: Map<string, ResolutionStrategy>;
  private defaultStrategy: string;

  constructor() {
    this.strategies = new Map();
    this.defaultStrategy = 'manual_merge';
    
    // Register default strategies
    this.registerStrategy(new LocalWinsStrategy());
    this.registerStrategy(new RemoteWinsStrategy());
    this.registerStrategy(new ManualMergeStrategy());
    this.registerStrategy(new AutoMergeStrategy());
  }

  /**
   * Register a resolution strategy
   */
  registerStrategy(strategy: ResolutionStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Get a strategy by name
   */
  getStrategy(name: string): ResolutionStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Set default strategy
   */
  setDefaultStrategy(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Strategy ${name} not found`);
    }
    this.defaultStrategy = name;
  }

  /**
   * Resolve a conflict using specified strategy
   */
  resolveConflict(conflict: Conflict, strategyName?: string): ResolutionResult {
    const name = strategyName || this.selectBestStrategy(conflict);
    const strategy = this.strategies.get(name);

    if (!strategy) {
      return {
        success: false,
        error: `Strategy ${name} not found`,
        requiresManual: true
      };
    }

    try {
      const result = strategy.resolve(conflict);
      
      // Add strategy metadata
      if (result.resolution) {
        result.resolution.strategyUsed = name;
        result.resolution.autoResolved = strategy.canAutoResolve(conflict);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: `Strategy ${name} failed: ${error.message}`,
        requiresManual: true
      };
    }
  }

  /**
   * Select the best strategy for a conflict
   */
  selectBestStrategy(conflict: Conflict): string {
    // Try auto-merge first for non-conflicting changes
    const autoMerge = this.strategies.get('auto_merge');
    if (autoMerge && autoMerge.canAutoResolve(conflict)) {
      return 'auto_merge';
    }

    // Check if any strategy can auto-resolve
    for (const [name, strategy] of this.strategies) {
      if (name !== 'manual_merge' && strategy.canAutoResolve(conflict)) {
        return name;
      }
    }

    // Default to manual merge
    return this.defaultStrategy;
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): any[] {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
      name,
      canAutoResolve: typeof strategy.canAutoResolve === 'function',
      description: this.getStrategyDescription(name)
    }));
  }

  /**
   * Get strategy description
   */
  private getStrategyDescription(name: string): string {
    const descriptions: Record<string, string> = {
      local_wins: 'Always prefer local changes over remote changes',
      remote_wins: 'Always prefer remote changes over local changes',
      manual_merge: 'Require manual intervention to resolve conflicts',
      auto_merge: 'Automatically merge non-conflicting changes'
    };
    return descriptions[name] || 'Custom resolution strategy';
  }
}