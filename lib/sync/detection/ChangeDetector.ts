import { PrismaClient } from '@/lib/generated/prisma';
import { ContentTypeHasher } from '../versioning/ContentTypeHasher';
import { SyncStateManager } from '../persistence/SyncStateManager';
import crypto from 'crypto';

export interface ContentType {
  key: string;
  name: string;
  fields?: Array<{
    key: string;
    name: string;
    type: string;
    required?: boolean;
    unique?: boolean;
    indexed?: boolean;
    settings?: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

export interface HashData {
  hash: string;
  contentType: ContentType;
}

export interface ChangeSet {
  created: Array<{
    key: string;
    remoteHash: string;
    contentType: ContentType;
  }>;
  updated: Array<{
    key: string;
    localHash: string;
    remoteHash: string;
    localContentType: ContentType;
    remoteContentType: ContentType;
  }>;
  deleted: Array<{
    key: string;
    localHash: string;
    contentType: ContentType;
  }>;
  unchanged: string[];
}

export interface FieldChanges {
  added: string[];
  modified: string[];
  removed: string[];
}

export interface ChangeSummary {
  summary: {
    total: number;
    created: number;
    updated: number;
    deleted: number;
    unchanged: number;
  };
  details?: {
    created: Array<{
      key: string;
      name?: string;
      fieldsCount: number;
    }>;
    updated: Array<{
      key: string;
      localName?: string;
      remoteName?: string;
      fieldChanges: FieldChanges;
    }>;
    deleted: Array<{
      key: string;
      name?: string;
      fieldsCount: number;
    }>;
  };
  timestamp: string;
}

export class ChangeDetector {
  private hasher: ContentTypeHasher;
  private syncStateManager: SyncStateManager | null;
  
  constructor(
    private prisma: PrismaClient,
    syncStateManager: SyncStateManager | null = null
  ) {
    this.hasher = new ContentTypeHasher();
    this.syncStateManager = syncStateManager;
  }

  /**
   * Generate SHA-256 hash for a content type
   */
  generateHash(contentType: ContentType): string {
    const normalizedData = {
      key: contentType.key,
      name: contentType.name,
      fields: (contentType.fields || []).map(field => ({
        key: field.key,
        name: field.name,
        type: field.type,
        required: field.required || false,
        unique: field.unique || false,
        indexed: field.indexed || false,
        settings: field.settings || {}
      })).sort((a, b) => a.key.localeCompare(b.key))
    };
    
    const jsonString = JSON.stringify(normalizedData);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Calculate hashes for all local content types
   */
  async calculateLocalHashes(): Promise<Map<string, HashData>> {
    try {
      // Get content types from database
      const contentTypes = await this.getLocalContentTypes();
      const hashes = new Map<string, HashData>();
      
      for (const type of contentTypes) {
        const hash = this.generateHash(type);
        hashes.set(type.key, {
          hash,
          contentType: type
        });
      }
      
      console.log(`Calculated hashes for ${hashes.size} local content types`);
      return hashes;
    } catch (error) {
      console.error('Error calculating local hashes:', error);
      throw error;
    }
  }

  /**
   * Fetch and calculate hashes for remote content types
   */
  async fetchRemoteHashes(): Promise<Map<string, HashData>> {
    try {
      // Get remote content types (this would be from API in real implementation)
      const remoteTypes = await this.getRemoteContentTypes();
      const hashes = new Map<string, HashData>();
      
      for (const type of remoteTypes) {
        const hash = this.generateHash(type);
        hashes.set(type.key, {
          hash,
          contentType: type
        });
      }
      
      console.log(`Calculated hashes for ${hashes.size} remote content types`);
      return hashes;
    } catch (error) {
      console.error('Error fetching remote hashes:', error);
      throw error;
    }
  }

  /**
   * Compare local and remote hashes to detect changes
   */
  async compareHashes(
    localHashes: Map<string, HashData>,
    remoteHashes: Map<string, HashData>
  ): Promise<ChangeSet> {
    const changes: ChangeSet = {
      created: [],
      updated: [],
      deleted: [],
      unchanged: []
    };
    
    // Detect CREATE and UPDATE
    for (const [key, remoteData] of remoteHashes) {
      const localData = localHashes.get(key);
      if (!localData) {
        changes.created.push({
          key,
          remoteHash: remoteData.hash,
          contentType: remoteData.contentType
        });
      } else if (localData.hash !== remoteData.hash) {
        changes.updated.push({
          key,
          localHash: localData.hash,
          remoteHash: remoteData.hash,
          localContentType: localData.contentType,
          remoteContentType: remoteData.contentType
        });
      } else {
        changes.unchanged.push(key);
      }
    }
    
    // Detect DELETE
    for (const [key, localData] of localHashes) {
      if (!remoteHashes.has(key)) {
        changes.deleted.push({
          key,
          localHash: localData.hash,
          contentType: localData.contentType
        });
      }
    }
    
    return changes;
  }

  /**
   * Detect change type for a single content type
   */
  async detectChangeType(
    typeKey: string,
    localHash?: string,
    remoteHash?: string
  ): Promise<'CREATE' | 'UPDATE' | 'DELETE' | 'NO_CHANGE'> {
    if (!localHash && remoteHash) return 'CREATE';
    if (localHash && !remoteHash) return 'DELETE';
    if (localHash !== remoteHash) return 'UPDATE';
    return 'NO_CHANGE';
  }

  /**
   * Generate detailed diff report
   */
  async generateDiffReport(
    changes: ChangeSet,
    includeDetails = true
  ): Promise<ChangeSummary> {
    const report: ChangeSummary = {
      summary: {
        total: changes.created.length + changes.updated.length + changes.deleted.length,
        created: changes.created.length,
        updated: changes.updated.length,
        deleted: changes.deleted.length,
        unchanged: changes.unchanged.length
      },
      timestamp: new Date().toISOString()
    };

    if (includeDetails) {
      report.details = {
        created: changes.created.map(item => ({
          key: item.key,
          name: item.contentType?.name,
          fieldsCount: item.contentType?.fields?.length || 0
        })),
        updated: changes.updated.map(item => ({
          key: item.key,
          localName: item.localContentType?.name,
          remoteName: item.remoteContentType?.name,
          fieldChanges: this.detectFieldChanges(
            item.localContentType?.fields || [],
            item.remoteContentType?.fields || []
          )
        })),
        deleted: changes.deleted.map(item => ({
          key: item.key,
          name: item.contentType?.name,
          fieldsCount: item.contentType?.fields?.length || 0
        }))
      };
    }

    return report;
  }

  /**
   * Detect field-level changes between content types
   */
  detectFieldChanges(
    localFields: ContentType['fields'] = [],
    remoteFields: ContentType['fields'] = []
  ): FieldChanges {
    const localFieldMap = new Map(localFields.map(f => [f.key, f]));
    const remoteFieldMap = new Map(remoteFields.map(f => [f.key, f]));
    
    const changes: FieldChanges = {
      added: [],
      modified: [],
      removed: []
    };

    // Find added and modified fields
    for (const [key, remoteField] of remoteFieldMap) {
      const localField = localFieldMap.get(key);
      if (!localField) {
        changes.added.push(key);
      } else if (JSON.stringify(localField) !== JSON.stringify(remoteField)) {
        changes.modified.push(key);
      }
    }

    // Find removed fields
    for (const [key] of localFieldMap) {
      if (!remoteFieldMap.has(key)) {
        changes.removed.push(key);
      }
    }

    return changes;
  }

  /**
   * Main entry point for detecting all changes
   */
  async detectChanges(): Promise<ChangeSummary> {
    console.log('Starting change detection process...');
    
    try {
      const [localHashes, remoteHashes] = await Promise.all([
        this.calculateLocalHashes(),
        this.fetchRemoteHashes()
      ]);
      
      const changes = await this.compareHashes(localHashes, remoteHashes);
      const report = await this.generateDiffReport(changes);
      
      // Persist sync state if manager is available
      if (this.syncStateManager) {
        await this.persistSyncStates(localHashes, remoteHashes, changes);
      }
      
      console.log('Change detection complete:', report.summary);
      return report;
    } catch (error) {
      console.error('Error during change detection:', error);
      throw error;
    }
  }

  /**
   * Detect changes for specific content types
   */
  async detectBatchChanges(contentTypeKeys: string[]): Promise<ChangeSummary> {
    console.log(`Starting batch change detection for ${contentTypeKeys.length} content types`);
    
    try {
      const [localHashes, remoteHashes] = await Promise.all([
        this.calculateLocalHashes(),
        this.fetchRemoteHashes()
      ]);
      
      // Filter to only requested keys
      const filteredLocal = new Map<string, HashData>();
      const filteredRemote = new Map<string, HashData>();
      
      for (const key of contentTypeKeys) {
        const localData = localHashes.get(key);
        if (localData) {
          filteredLocal.set(key, localData);
        }
        
        const remoteData = remoteHashes.get(key);
        if (remoteData) {
          filteredRemote.set(key, remoteData);
        }
      }
      
      const changes = await this.compareHashes(filteredLocal, filteredRemote);
      const report = await this.generateDiffReport(changes);
      
      console.log('Batch change detection complete:', report.summary);
      return report;
    } catch (error) {
      console.error('Error during batch change detection:', error);
      throw error;
    }
  }

  /**
   * Persist sync states to database
   */
  private async persistSyncStates(
    localHashes: Map<string, HashData>,
    remoteHashes: Map<string, HashData>,
    changes: ChangeSet
  ): Promise<void> {
    if (!this.syncStateManager) return;
    
    const updates = [];
    
    // Process created items (new in remote)
    for (const item of changes.created) {
      updates.push({
        typeKey: item.key,
        localHash: '',
        remoteHash: item.remoteHash,
        syncStatus: 'new',
        changeSource: 'SYNC'
      });
    }
    
    // Process updated items
    for (const item of changes.updated) {
      updates.push({
        typeKey: item.key,
        localHash: item.localHash,
        remoteHash: item.remoteHash,
        syncStatus: 'modified',
        changeSource: 'SYNC'
      });
    }
    
    // Process deleted items
    for (const item of changes.deleted) {
      updates.push({
        typeKey: item.key,
        localHash: item.localHash,
        remoteHash: null,
        syncStatus: 'modified',
        changeSource: 'SYNC'
      });
    }
    
    // Process unchanged items
    for (const key of changes.unchanged) {
      const localData = localHashes.get(key);
      if (localData) {
        updates.push({
          typeKey: key,
          localHash: localData.hash,
          remoteHash: localData.hash,
          lastSyncedHash: localData.hash,
          syncStatus: 'in_sync',
          changeSource: 'SYNC'
        });
      }
    }
    
    // Batch update sync states
    if (updates.length > 0) {
      try {
        // Use the SyncStateManager to persist
        for (const update of updates) {
          await this.syncStateManager.upsertSyncState({
          ...update,
          syncStatus: update.syncStatus as 'new' | 'modified' | 'conflict' | 'in_sync'
        });
        }
        console.log(`Persisted ${updates.length} sync states to database`);
      } catch (error) {
        console.error('Error persisting sync states:', error);
        // Don't throw - persistence failure shouldn't stop change detection
      }
    }
  }

  /**
   * Get local content types from database
   */
  private async getLocalContentTypes(): Promise<ContentType[]> {
    try {
      // Query actual content types from the database
      const contentTypes = await this.prisma.contentType.findMany({
        where: {
          deletedAt: null
        },
        include: {
          website: true
        }
      });

      // Transform database content types to our format
      return contentTypes.map(ct => ({
        key: ct.id, // Using ID as key for now
        name: ct.name,
        fields: this.parseFields(ct.fields as any)
      }));
    } catch (error) {
      console.error('Error fetching local content types:', error);
      // Fallback to empty array if database query fails
      return [];
    }
  }

  /**
   * Parse fields from database JSON format
   */
  private parseFields(fields: any): ContentType['fields'] {
    if (!fields) return [];
    
    // Handle if fields is already an array
    if (Array.isArray(fields)) {
      return fields.map(field => ({
        key: field.id || field.key || field.name,
        name: field.name || field.label,
        type: field.type || 'string',
        required: field.required || false,
        unique: field.unique || false,
        indexed: field.indexed || false,
        settings: field.settings || {}
      }));
    }
    
    // Handle if fields is an object with a fields property
    if (fields.fields && Array.isArray(fields.fields)) {
      return this.parseFields(fields.fields);
    }
    
    return [];
  }

  /**
   * Get remote content types from API
   * This is a placeholder - in real implementation would call actual API
   */
  private async getRemoteContentTypes(): Promise<ContentType[]> {
    // For now, return mock data simulating remote changes
    // In real implementation, this would call the Optimizely API
    return [
      {
        key: 'article',
        name: 'Article',
        fields: [
          { key: 'title', name: 'Title', type: 'string', required: true },
          { key: 'content', name: 'Content', type: 'text', required: true },
          { key: 'author', name: 'Author', type: 'string', required: false },
          { key: 'tags', name: 'Tags', type: 'array', required: false } // Added field
        ]
      },
      {
        key: 'page',
        name: 'Page',
        fields: [
          { key: 'slug', name: 'URL Slug', type: 'string', required: true }, // Modified
          { key: 'content', name: 'Page Content', type: 'richtext', required: true } // Modified
          // legacy_field removed
        ]
      },
      {
        key: 'blog_post',
        name: 'Blog Post',
        fields: [
          { key: 'title', name: 'Title', type: 'string', required: true },
          { key: 'body', name: 'Body', type: 'richtext', required: true },
          { key: 'publishDate', name: 'Publish Date', type: 'datetime', required: true }
        ]
      },
      {
        key: 'product',
        name: 'Product',
        fields: [
          { key: 'name', name: 'Name', type: 'string', required: true },
          { key: 'price', name: 'Price', type: 'number', required: true },
          { key: 'description', name: 'Description', type: 'text', required: false }
        ]
      }
      // deprecated_type is not in remote (deleted)
    ];
  }
}