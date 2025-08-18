/**
 * TypeScript implementation of Three-Way Diff
 * Provides detailed comparison between local, remote, and ancestor versions
 */

export interface DiffResult {
  local: any;
  remote: any;
  ancestor: any;
  localChanges: Changes;
  remoteChanges: Changes;
  conflicts: Conflict[];
  mergeableChanges: MergeableChange[];
  divergence: number;
  timestamp: string;
}

export interface Changes {
  added: Record<string, FieldChange>;
  modified: Record<string, FieldChange>;
  deleted: Record<string, FieldChange>;
  unchanged: Record<string, FieldChange>;
  summary: ChangeSummary;
}

export interface FieldChange {
  value?: any;
  oldValue?: any;
  newValue?: any;
  type: string;
  changeType?: string;
}

export interface ChangeSummary {
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  unchangedCount: number;
}

export interface Conflict {
  field: string;
  type: string;
  localChange?: FieldChange;
  remoteChange?: FieldChange;
  ancestorValue?: any;
  localValue?: any;
  remoteValue?: any;
  localAction?: string;
  remoteAction?: string;
  resolution?: string;
}

export interface MergeableChange {
  field: string;
  source: 'local' | 'remote';
  action: string;
  value: any;
}

export interface FieldDiff {
  field: string;
  ancestorValue: any;
  localValue: any;
  remoteValue: any;
  localChanged: boolean;
  remoteChanged: boolean;
  conflict: boolean;
  conflictType: string | null;
}

export class ThreeWayDiff {
  private diffCache: Map<string, DiffResult>;

  constructor() {
    this.diffCache = new Map();
  }

  /**
   * Compare three versions and generate comprehensive diff
   */
  compareVersions(local: any, remote: any, ancestor: any): DiffResult {
    const result: DiffResult = {
      local: this.normalizeVersion(local),
      remote: this.normalizeVersion(remote),
      ancestor: this.normalizeVersion(ancestor),
      localChanges: this.calculateChanges(ancestor, local),
      remoteChanges: this.calculateChanges(ancestor, remote),
      conflicts: [],
      mergeableChanges: [],
      divergence: 0,
      timestamp: new Date().toISOString()
    };

    // Analyze conflicts and mergeable changes
    this.analyzeConflicts(result);
    this.identifyMergeableChanges(result);
    result.divergence = this.calculateDivergence(result);

    return result;
  }

  /**
   * Normalize version data for comparison
   */
  private normalizeVersion(version: any): any {
    if (!version) {
      return { data: {}, hash: null };
    }

    return {
      data: version.data || {},
      hash: version.hash || null,
      timestamp: version.timestamp || null,
      metadata: version.metadata || {}
    };
  }

  /**
   * Calculate changes between two versions
   */
  private calculateChanges(oldVersion: any, newVersion: any): Changes {
    const oldData = (oldVersion && oldVersion.data) || {};
    const newData = (newVersion && newVersion.data) || {};
    
    const changes: Changes = {
      added: {},
      modified: {},
      deleted: {},
      unchanged: {},
      summary: {
        addedCount: 0,
        modifiedCount: 0,
        deletedCount: 0,
        unchangedCount: 0
      }
    };

    // Find added and modified fields
    for (const key in newData) {
      if (!oldData.hasOwnProperty(key)) {
        changes.added[key] = {
          value: newData[key],
          type: this.getFieldType(newData[key])
        };
        changes.summary.addedCount++;
      } else if (this.hasChanged(oldData[key], newData[key])) {
        changes.modified[key] = {
          oldValue: oldData[key],
          newValue: newData[key],
          type: this.getFieldType(newData[key]),
          changeType: this.determineChangeType(oldData[key], newData[key])
        };
        changes.summary.modifiedCount++;
      } else {
        changes.unchanged[key] = {
          value: newData[key],
          type: this.getFieldType(newData[key])
        };
        changes.summary.unchangedCount++;
      }
    }

    // Find deleted fields
    for (const key in oldData) {
      if (!newData.hasOwnProperty(key)) {
        changes.deleted[key] = {
          value: oldData[key],
          type: this.getFieldType(oldData[key])
        };
        changes.summary.deletedCount++;
      }
    }

    return changes;
  }

  /**
   * Check if a field has changed
   */
  private hasChanged(oldValue: any, newValue: any): boolean {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  /**
   * Get the type of a field value
   */
  private getFieldType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  /**
   * Determine the type of change between two values
   */
  private determineChangeType(oldValue: any, newValue: any): string {
    const oldType = this.getFieldType(oldValue);
    const newType = this.getFieldType(newValue);

    if (oldType !== newType) {
      return 'type_change';
    }

    if (oldType === 'array') {
      if (oldValue.length !== newValue.length) {
        return 'array_resize';
      }
      return 'array_content';
    }

    if (oldType === 'object') {
      const oldKeys = Object.keys(oldValue || {});
      const newKeys = Object.keys(newValue || {});
      if (oldKeys.length !== newKeys.length) {
        return 'object_structure';
      }
      return 'object_content';
    }

    return 'value_change';
  }

  /**
   * Analyze conflicts between local and remote changes
   */
  private analyzeConflicts(result: DiffResult): void {
    const conflicts: Conflict[] = [];
    const localMod = result.localChanges.modified;
    const remoteMod = result.remoteChanges.modified;

    // Check for fields modified in both versions
    for (const field in localMod) {
      if (remoteMod.hasOwnProperty(field)) {
        const conflict: Conflict = {
          field,
          type: 'both_modified',
          localChange: localMod[field],
          remoteChange: remoteMod[field],
          ancestorValue: result.ancestor.data[field],
          resolution: this.suggestResolution(
            localMod[field],
            remoteMod[field],
            result.ancestor.data[field]
          )
        };
        conflicts.push(conflict);
      }
    }

    // Check for add/delete conflicts
    for (const field in result.localChanges.added) {
      if (result.remoteChanges.deleted.hasOwnProperty(field)) {
        conflicts.push({
          field,
          type: 'add_delete_conflict',
          localAction: 'added',
          remoteAction: 'deleted',
          resolution: 'manual_required'
        });
      }
    }

    for (const field in result.localChanges.deleted) {
      if (result.remoteChanges.added.hasOwnProperty(field)) {
        conflicts.push({
          field,
          type: 'delete_add_conflict',
          localAction: 'deleted',
          remoteAction: 'added',
          resolution: 'manual_required'
        });
      }
    }

    result.conflicts = conflicts;
  }

  /**
   * Identify changes that can be merged automatically
   */
  private identifyMergeableChanges(result: DiffResult): void {
    const mergeableChanges: MergeableChange[] = [];

    // Local additions that don't conflict
    for (const field in result.localChanges.added) {
      if (!result.remoteChanges.deleted.hasOwnProperty(field) &&
          !result.remoteChanges.added.hasOwnProperty(field)) {
        mergeableChanges.push({
          field,
          source: 'local',
          action: 'add',
          value: result.localChanges.added[field].value
        });
      }
    }

    // Remote additions that don't conflict
    for (const field in result.remoteChanges.added) {
      if (!result.localChanges.deleted.hasOwnProperty(field) &&
          !result.localChanges.added.hasOwnProperty(field)) {
        mergeableChanges.push({
          field,
          source: 'remote',
          action: 'add',
          value: result.remoteChanges.added[field].value
        });
      }
    }

    // Non-conflicting modifications
    for (const field in result.localChanges.modified) {
      if (!result.remoteChanges.modified.hasOwnProperty(field)) {
        mergeableChanges.push({
          field,
          source: 'local',
          action: 'modify',
          value: result.localChanges.modified[field].newValue
        });
      }
    }

    for (const field in result.remoteChanges.modified) {
      if (!result.localChanges.modified.hasOwnProperty(field)) {
        mergeableChanges.push({
          field,
          source: 'remote',
          action: 'modify',
          value: result.remoteChanges.modified[field].newValue
        });
      }
    }

    result.mergeableChanges = mergeableChanges;
  }

  /**
   * Suggest resolution for a conflict
   */
  private suggestResolution(localChange: FieldChange, remoteChange: FieldChange, ancestorValue: any): string {
    // If both changed to the same value, auto-resolve
    if (JSON.stringify(localChange.newValue) === JSON.stringify(remoteChange.newValue)) {
      return 'auto_resolve_same';
    }

    // If one is reverting to ancestor, prefer the other
    if (JSON.stringify(localChange.newValue) === JSON.stringify(ancestorValue)) {
      return 'prefer_remote';
    }
    if (JSON.stringify(remoteChange.newValue) === JSON.stringify(ancestorValue)) {
      return 'prefer_local';
    }

    // For arrays, check if changes are at different indices
    if (localChange.changeType === 'array_content' && 
        remoteChange.changeType === 'array_content') {
      const localDiff = this.getArrayDifferences(ancestorValue, localChange.newValue);
      const remoteDiff = this.getArrayDifferences(ancestorValue, remoteChange.newValue);
      
      if (!this.hasArrayConflict(localDiff, remoteDiff)) {
        return 'auto_merge_arrays';
      }
    }

    return 'manual_required';
  }

  /**
   * Get differences in array content
   */
  private getArrayDifferences(oldArray: any[], newArray: any[]): any {
    oldArray = oldArray || [];
    newArray = newArray || [];
    
    return {
      added: newArray.filter(item => !oldArray.includes(item)),
      removed: oldArray.filter(item => !newArray.includes(item)),
      modified: newArray.filter((item, index) => 
        index < oldArray.length && item !== oldArray[index]
      )
    };
  }

  /**
   * Check if array changes conflict
   */
  private hasArrayConflict(localDiff: any, remoteDiff: any): boolean {
    return localDiff.modified.some((item: any) => remoteDiff.modified.includes(item));
  }

  /**
   * Calculate divergence score between versions
   */
  private calculateDivergence(result: DiffResult): number {
    const totalFields = new Set([
      ...Object.keys(result.local.data),
      ...Object.keys(result.remote.data),
      ...Object.keys(result.ancestor.data)
    ]).size;

    if (totalFields === 0) return 0;

    const conflictScore = result.conflicts.length / totalFields;
    const changeScore = (
      result.localChanges.summary.modifiedCount +
      result.remoteChanges.summary.modifiedCount
    ) / (totalFields * 2);

    return Math.min(1, conflictScore * 0.7 + changeScore * 0.3);
  }

  /**
   * Generate field-level diff information for UI display
   */
  generateFieldLevelDiff(local: any, remote: any, ancestor: any): FieldDiff[] {
    const fields = new Set([
      ...Object.keys(local.data || {}),
      ...Object.keys(remote.data || {}),
      ...Object.keys(ancestor.data || {})
    ]);

    const fieldDiffs: FieldDiff[] = [];

    for (const field of fields) {
      const localValue = local.data ? local.data[field] : undefined;
      const remoteValue = remote.data ? remote.data[field] : undefined;
      const ancestorValue = ancestor.data ? ancestor.data[field] : undefined;

      const diff: FieldDiff = {
        field,
        ancestorValue,
        localValue,
        remoteValue,
        localChanged: this.hasChanged(ancestorValue, localValue),
        remoteChanged: this.hasChanged(ancestorValue, remoteValue),
        conflict: false,
        conflictType: null
      };

      // Determine if there's a conflict
      if (diff.localChanged && diff.remoteChanged) {
        diff.conflict = true;
        if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
          diff.conflictType = 'both_same';
        } else {
          diff.conflictType = 'different_values';
        }
      }

      fieldDiffs.push(diff);
    }

    return fieldDiffs;
  }

  /**
   * Format diff output for UI display
   */
  formatDiffOutput(diffResult: DiffResult): any {
    return {
      summary: {
        totalConflicts: diffResult.conflicts.length,
        autoMergeable: diffResult.mergeableChanges.length,
        divergenceScore: Math.round(diffResult.divergence * 100) + '%',
        localChanges: diffResult.localChanges.summary,
        remoteChanges: diffResult.remoteChanges.summary
      },
      conflicts: diffResult.conflicts.map(c => ({
        field: c.field,
        type: c.type,
        description: this.getConflictDescription(c),
        resolution: c.resolution,
        values: {
          ancestor: c.ancestorValue,
          local: c.localChange ? c.localChange.newValue : undefined,
          remote: c.remoteChange ? c.remoteChange.newValue : undefined
        }
      })),
      mergeableChanges: diffResult.mergeableChanges.map(m => ({
        field: m.field,
        action: m.action,
        source: m.source,
        value: m.value
      })),
      fieldDiffs: this.generateFieldLevelDiff(
        diffResult.local,
        diffResult.remote,
        diffResult.ancestor
      )
    };
  }

  /**
   * Get human-readable conflict description
   */
  private getConflictDescription(conflict: Conflict): string {
    switch (conflict.type) {
      case 'both_modified':
        return `Field "${conflict.field}" was modified differently in both versions`;
      case 'add_delete_conflict':
        return `Field "${conflict.field}" was added locally but deleted remotely`;
      case 'delete_add_conflict':
        return `Field "${conflict.field}" was deleted locally but added remotely`;
      default:
        return `Field "${conflict.field}" has a conflict`;
    }
  }
}