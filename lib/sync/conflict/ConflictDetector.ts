/**
 * TypeScript implementation of Conflict Detection System
 * Detects concurrent modifications and provides three-way diff capabilities
 */

import { ChangeDetector } from '../detection/ChangeDetector';
import { VersionHistory } from '../versioning/VersionHistory';
import { ThreeWayDiff } from './ThreeWayDiff';

export interface ConflictResult {
  hasConflict: boolean;
  type?: string;
  details?: any;
  localVersion?: any;
  remoteVersion?: any;
  ancestorVersion?: any;
  reason?: string;
}

export interface Version {
  hash: string;
  typeKey: string;
  data: any;
  parentHash?: string | null;
  timestamp?: Date;
  deleted?: boolean;
  modified?: boolean;
}

export class ConflictDetector {
  private changeDetector: ChangeDetector;
  private versionHistory: VersionHistory;
  private threeWayDiff: ThreeWayDiff;

  constructor(changeDetector: ChangeDetector, versionHistory: VersionHistory) {
    this.changeDetector = changeDetector;
    this.versionHistory = versionHistory;
    this.threeWayDiff = new ThreeWayDiff();
  }

  /**
   * Detect conflicts for a specific content type
   */
  async detectConflicts(typeKey: string): Promise<ConflictResult> {
    try {
      // Get current local and remote versions
      const localVersion = await this.versionHistory.getLatestVersion(typeKey, 'local');
      const remoteVersion = await this.versionHistory.getLatestVersion(typeKey, 'remote');
      
      if (!localVersion || !remoteVersion) {
        return { hasConflict: false, reason: 'Missing version data' };
      }
      
      // Find common ancestor
      const ancestor = await this.findCommonAncestor(localVersion, remoteVersion);
      
      // Check if both modified since ancestor
      if (localVersion.hash !== ancestor.hash && 
          remoteVersion.hash !== ancestor.hash) {
        
        const conflictType = this.determineConflictType(localVersion, remoteVersion, ancestor);
        const conflictDetails = this.generateConflictDetails(localVersion, remoteVersion, ancestor);
        
        return {
          hasConflict: true,
          type: conflictType,
          details: conflictDetails,
          localVersion,
          remoteVersion,
          ancestorVersion: ancestor
        };
      }
      
      return { hasConflict: false };
    } catch (error) {
      console.error(`Error detecting conflicts for ${typeKey}:`, error);
      throw error;
    }
  }

  /**
   * Find the common ancestor between two versions
   */
  async findCommonAncestor(localVersion: Version, remoteVersion: Version): Promise<Version> {
    try {
      // Handle same version case
      if (localVersion.hash === remoteVersion.hash) {
        return localVersion;
      }
      
      // Get ancestor chains for both versions
      const localAncestors = await this.getAncestorChain(localVersion);
      const remoteAncestors = await this.getAncestorChain(remoteVersion);
      
      // Find first common hash
      for (const localAncestor of localAncestors) {
        const commonAncestor = remoteAncestors.find(r => r.hash === localAncestor.hash);
        if (commonAncestor) {
          return commonAncestor;
        }
      }
      
      // If no common ancestor found, use initial version
      return await this.versionHistory.getInitialVersion(localVersion.typeKey);
    } catch (error) {
      console.error('Error finding common ancestor:', error);
      throw error;
    }
  }

  /**
   * Get the ancestor chain for a version
   */
  private async getAncestorChain(version: Version): Promise<Version[]> {
    const ancestors: Version[] = [];
    let current: Version | null = version;
    
    while (current) {
      ancestors.push(current);
      if (current.parentHash) {
        current = await this.versionHistory.getVersionByHash(current.typeKey, current.parentHash);
      } else {
        break;
      }
    }
    
    return ancestors;
  }

  /**
   * Determine the type of conflict
   */
  private determineConflictType(localVersion: Version, remoteVersion: Version, ancestor: Version): string {
    // Check for structural changes
    const localStructure = this.extractStructure(localVersion.data);
    const remoteStructure = this.extractStructure(remoteVersion.data);
    const ancestorStructure = this.extractStructure(ancestor.data);
    
    if (JSON.stringify(localStructure) !== JSON.stringify(ancestorStructure) &&
        JSON.stringify(remoteStructure) !== JSON.stringify(ancestorStructure)) {
      return 'structural';
    }
    
    // Check for delete conflicts
    if ((localVersion.deleted && remoteVersion.modified) ||
        (localVersion.modified && remoteVersion.deleted)) {
      return 'delete';
    }
    
    // Default to field-level conflict
    return 'field';
  }

  /**
   * Extract structure from content type data
   */
  private extractStructure(data: any): Record<string, string> {
    if (!data) return {};
    
    const structure: Record<string, string> = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (Array.isArray(data[key])) {
          structure[key] = 'array';
        } else if (data[key] && typeof data[key] === 'object') {
          structure[key] = 'object';
        } else {
          structure[key] = typeof data[key];
        }
      }
    }
    return structure;
  }

  /**
   * Generate detailed conflict information
   */
  private generateConflictDetails(localVersion: Version, remoteVersion: Version, ancestor: Version): any {
    const details = {
      typeKey: localVersion.typeKey,
      localHash: localVersion.hash,
      remoteHash: remoteVersion.hash,
      ancestorHash: ancestor.hash,
      localChanges: this.diffVersions(ancestor.data, localVersion.data),
      remoteChanges: this.diffVersions(ancestor.data, remoteVersion.data),
      conflictingFields: [] as any[],
      timestamp: new Date().toISOString()
    };
    
    // Identify conflicting fields
    const localModified = new Set(details.localChanges.modified);
    const remoteModified = new Set(details.remoteChanges.modified);
    
    for (const field of localModified) {
      if (remoteModified.has(field)) {
        details.conflictingFields.push({
          field,
          localValue: localVersion.data[field],
          remoteValue: remoteVersion.data[field],
          ancestorValue: ancestor.data ? ancestor.data[field] : undefined
        });
      }
    }
    
    return details;
  }

  /**
   * Compare two versions and identify differences
   */
  private diffVersions(oldData: any, newData: any): any {
    const diff = {
      added: [] as string[],
      modified: [] as string[],
      deleted: [] as string[]
    };
    
    oldData = oldData || {};
    newData = newData || {};
    
    // Check for added and modified fields
    for (const key in newData) {
      if (!oldData.hasOwnProperty(key)) {
        diff.added.push(key);
      } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        diff.modified.push(key);
      }
    }
    
    // Check for deleted fields
    for (const key in oldData) {
      if (!newData.hasOwnProperty(key)) {
        diff.deleted.push(key);
      }
    }
    
    return diff;
  }

  /**
   * Generate a three-way diff for conflict resolution
   */
  generateThreeWayDiff(local: Version, remote: Version, ancestor: Version): any {
    return this.threeWayDiff.compareVersions(local, remote, ancestor);
  }

  /**
   * Detect conflicts for all modified types
   */
  async detectAllConflicts(): Promise<ConflictResult[]> {
    try {
      const changes = await this.changeDetector.detectChanges();
      const conflicts: ConflictResult[] = [];
      
      // Check each modified type for conflicts
      for (const typeKey of changes.updated) {
        const conflict = await this.detectConflicts(typeKey);
        if (conflict.hasConflict) {
          conflicts.push({
            ...conflict,
            typeKey
          } as ConflictResult);
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Error detecting all conflicts:', error);
      throw error;
    }
  }
}