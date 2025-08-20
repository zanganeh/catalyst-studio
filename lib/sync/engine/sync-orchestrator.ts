import * as chalk from 'chalk';
import { DatabaseExtractor, ExtractedContentType } from '../extractors/database-extractor';
import { OptimizelyTransformer, TransformationResult } from '../transformers/optimizely-transformer';
import { ICMSProvider } from '../../providers/types';
import { OptimizelyContentTypeResponse } from '../../providers/optimizely/types';

export interface SyncStorage {
  loadAllContentTypes(): Promise<ExtractedContentType[]>;
  saveContentType(contentType: ExtractedContentType): Promise<void>;
  loadSyncState(): Promise<SyncState>;
  saveSyncState(state: SyncState): Promise<void>;
}

export interface SyncState {
  lastSync?: string;
  statistics?: SyncStatistics;
  contentTypes: Record<string, {
    lastSynced: string;
    etag: string | null;
    status: string;
    localHash?: string;
    remoteHash?: string;
    operationType?: 'CREATE' | 'UPDATE' | 'DELETE';
  }>;
}

export interface SyncStatistics {
  extracted: number;
  transformed: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: number;
}

export interface SyncOptions {
  websiteId?: string;
}

export interface DiscoveryResult {
  local: ExtractedContentType[];
  stored: ExtractedContentType[];
  remote: OptimizelyContentTypeResponse[];
}

export interface AnalysisResult {
  toCreate: TransformationResult[];
  toUpdate: Array<TransformationResult & { existing: OptimizelyContentTypeResponse; etag: string | null }>;
  toDelete: Array<{ key: string; type: OptimizelyContentTypeResponse }>;
  toSkip: TransformationResult[];
  conflicts: any[];
}

export interface ExecutionResult {
  created: any[];
  updated: any[];
  deleted: string[];
  skipped: TransformationResult[];
  failed: Array<{ item: any; error: string; operation: 'CREATE' | 'UPDATE' | 'DELETE' }>;
}

export class SyncOrchestrator {
  private extractor: DatabaseExtractor;
  private storage: SyncStorage;
  private transformer: OptimizelyTransformer;
  private provider: ICMSProvider | null;
  private dryRun: boolean = false;
  private statistics: SyncStatistics = {
    extracted: 0,
    transformed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    errors: 0
  };

  constructor(
    extractor: DatabaseExtractor,
    storage: SyncStorage,
    transformer: OptimizelyTransformer,
    provider: ICMSProvider | null
  ) {
    this.extractor = extractor;
    this.storage = storage;
    this.transformer = transformer;
    this.provider = provider;
  }

  setDryRun(value: boolean): void {
    this.dryRun = value;
    // Pass dry-run mode to provider if it supports it
    if (this.provider && 'setDryRun' in this.provider && typeof this.provider.setDryRun === 'function') {
      this.provider.setDryRun(value);
    }
  }

  async sync(options: SyncOptions = {}): Promise<{
    success: boolean;
    statistics: SyncStatistics;
    results?: ExecutionResult;
    error?: string;
  }> {
    console.log(chalk.blue('\n━━━ Content Type Sync Started ━━━\n'));
    
    if (this.dryRun) {
      console.log(chalk.yellow('🔍 Running in DRY-RUN mode - no changes will be made\n'));
    }

    try {
      console.log(chalk.cyan('Step 1: Discovery Phase'));
      const discoveryResult = await this.discoveryPhase(options);
      
      console.log(chalk.cyan('\nStep 2: Analysis Phase'));
      const analysisResult = await this.analysisPhase(discoveryResult);
      
      console.log(chalk.cyan('\nStep 3: Execution Phase'));
      const executionResult = await this.executionPhase(analysisResult);
      
      await this.saveSyncState(executionResult);
      
      this.printSummary();
      
      return {
        success: true,
        statistics: this.statistics,
        results: executionResult
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`\n❌ Sync failed: ${errorMessage}`));
      return {
        success: false,
        error: errorMessage,
        statistics: this.statistics
      };
    }
  }

  private async discoveryPhase(options: SyncOptions): Promise<DiscoveryResult> {
    const results: DiscoveryResult = {
      local: [],
      stored: [],
      remote: []
    };
    
    try {
      console.log('  📋 Extracting content types from database...');
      await this.extractor.connect();
      results.local = await this.extractor.extractContentTypes(options.websiteId);
      await this.extractor.close();
      this.statistics.extracted = results.local.length;
      console.log(chalk.green(`  ✓ Found ${results.local.length} content types in database`));
      
      console.log('  📁 Loading stored JSON files...');
      results.stored = await this.storage.loadAllContentTypes();
      console.log(chalk.green(`  ✓ Found ${results.stored.length} stored content types`));
      
      if (this.provider) {
        console.log('  🌐 Fetching remote content types from provider...');
        const universalTypes = await this.provider.getContentTypes();
        // Convert UniversalContentTypes to OptimizelyContentTypeResponse format for compatibility
        results.remote = universalTypes.map(ut => this.provider!.mapFromUniversal(ut));
        console.log(chalk.green(`  ✓ Found ${results.remote.length} content types in provider`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`  ✗ Discovery failed: ${errorMessage}`));
      throw error;
    }
    
    return results;
  }

  private async analysisPhase(discoveryResult: DiscoveryResult): Promise<AnalysisResult> {
    const analysis: AnalysisResult = {
      toCreate: [],
      toUpdate: [],
      toDelete: [],
      toSkip: [],
      conflicts: []
    };
    
    console.log('  🔄 Transforming content types to Optimizely format...');
    
    // Track which remote types are matched with local types
    const matchedRemoteKeys = new Set<string>();
    
    for (const localType of discoveryResult.local) {
      try {
        const transformed = this.transformer.transformContentType(localType);
        const validation = this.transformer.validateTransformation(transformed);
        
        if (!validation.valid) {
          console.log(chalk.red(`  ✗ Validation failed for ${localType.name}:`));
          validation.errors.forEach(err => console.log(chalk.red(`    - ${err}`)));
          this.statistics.errors++;
          continue;
        }
        
        if (validation.warnings.length > 0) {
          console.log(chalk.yellow(`  ⚠ Warnings for ${localType.name}:`));
          validation.warnings.forEach(warn => console.log(chalk.yellow(`    - ${warn}`)));
        }
        
        this.statistics.transformed++;
        
        await this.storage.saveContentType(localType);
        
        if (!this.provider) {
          analysis.toSkip.push(transformed);
          continue;
        }
        
        const existingRemote = discoveryResult.remote.find(
          r => r.key === transformed.transformed.key
        );
        
        if (existingRemote) {
          matchedRemoteKeys.add(existingRemote.key);
          const hasChanges = await this.detectChangesWithHash(transformed.transformed, existingRemote);
          if (hasChanges) {
            analysis.toUpdate.push({
              ...transformed,
              existing: existingRemote,
              etag: existingRemote.etag
            });
          } else {
            analysis.toSkip.push(transformed);
          }
        } else {
          analysis.toCreate.push(transformed);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to process ${localType.name}: ${errorMessage}`));
        this.statistics.errors++;
      }
    }
    
    // Identify remote types that no longer exist locally (candidates for deletion)
    for (const remoteType of discoveryResult.remote) {
      if (!matchedRemoteKeys.has(remoteType.key) && this.isManagedType(remoteType)) {
        analysis.toDelete.push({
          key: remoteType.key,
          type: remoteType
        });
      }
    }
    
    console.log(chalk.green(`  ✓ Analysis complete:`));
    console.log(`    - To create: ${analysis.toCreate.length}`);
    console.log(`    - To update: ${analysis.toUpdate.length}`);
    console.log(`    - To delete: ${analysis.toDelete.length}`);
    console.log(`    - To skip: ${analysis.toSkip.length}`);
    
    return analysis;
  }

  private isManagedType(remoteType: OptimizelyContentTypeResponse): boolean {
    // Check if this type was created/managed by our sync process
    // Types with our specific naming convention or metadata are considered managed
    return remoteType.key.startsWith('CMS_') || 
           remoteType.description?.includes('[Synced]') ||
           false; // Default to false for safety - don't delete unknown types
  }

  private async detectChangesWithHash(local: any, remote: any): Promise<boolean> {
    // Generate content hash for comparison
    const localHash = this.generateContentHash(local);
    const remoteHash = this.generateContentHash({
      displayName: remote.displayName,
      description: remote.description,
      properties: remote.properties,
      baseType: remote.baseType
    });
    
    return localHash !== remoteHash;
  }

  private generateContentHash(content: any): string {
    // Simple hash generation - in production use crypto.createHash
    const str = JSON.stringify({
      displayName: content.displayName,
      description: content.description,
      properties: content.properties,
      baseType: content.baseType
    }, null, 0);
    
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private async executionPhase(analysisResult: AnalysisResult): Promise<ExecutionResult> {
    const results: ExecutionResult = {
      created: [],
      updated: [],
      deleted: [],
      skipped: analysisResult.toSkip,
      failed: []
    };
    
    if (!this.provider) {
      console.log(chalk.yellow('  ⚠ No provider configured - skipping execution'));
      return results;
    }
    
    // CREATE operations
    for (const item of analysisResult.toCreate) {
      try {
        console.log(`  🚀 Creating: ${item.transformed.displayName}`);
        if (!this.dryRun) {
          // Convert to UniversalContentType and create
          const universalType = this.provider.mapToUniversal(item.transformed);
          const created = await this.provider.createContentType(universalType);
          results.created.push(this.provider.mapFromUniversal(created));
          this.statistics.created++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would create content type'));
          results.created.push(item);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to create ${item.transformed.displayName}: ${errorMessage}`));
        results.failed.push({ item, error: errorMessage, operation: 'CREATE' });
        this.statistics.errors++;
      }
    }
    
    // UPDATE operations
    for (const item of analysisResult.toUpdate) {
      try {
        console.log(`  🔄 Updating: ${item.transformed.displayName}`);
        if (!this.dryRun) {
          // Convert to UniversalContentType and update
          const universalType = this.provider.mapToUniversal(item.transformed);
          const updated = await this.provider.updateContentType(
            item.transformed.key,
            universalType
          );
          results.updated.push(this.provider.mapFromUniversal(updated));
          this.statistics.updated++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would update content type'));
          results.updated.push(item);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to update ${item.transformed.displayName}: ${errorMessage}`));
        results.failed.push({ item, error: errorMessage, operation: 'UPDATE' });
        this.statistics.errors++;
      }
    }
    
    // DELETE operations
    for (const item of analysisResult.toDelete) {
      try {
        console.log(`  🗑️  Deleting: ${item.key}`);
        if (!this.dryRun) {
          await this.provider.deleteContentType(item.key);
          results.deleted.push(item.key);
          this.statistics.deleted++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would delete content type'));
          results.deleted.push(item.key);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to delete ${item.key}: ${errorMessage}`));
        results.failed.push({ item, error: errorMessage, operation: 'DELETE' });
        this.statistics.errors++;
      }
    }
    
    this.statistics.skipped = results.skipped.length;
    
    return results;
  }

  private detectChanges(local: any, remote: any): boolean {
    const localProps = JSON.stringify(local.properties || {});
    const remoteProps = JSON.stringify(remote.properties || {});
    
    return localProps !== remoteProps ||
           local.displayName !== remote.displayName ||
           local.description !== remote.description;
  }

  private async saveSyncState(executionResult: ExecutionResult): Promise<void> {
    const state = await this.storage.loadSyncState();
    
    state.lastSync = new Date().toISOString();
    state.statistics = this.statistics;
    state.contentTypes = state.contentTypes || {};
    
    // Track created types
    for (const item of executionResult.created) {
      const key = (item as any).transformed?.key || (item as any).key;
      if (key) {
        const localHash = this.generateContentHash((item as any).transformed || item);
        state.contentTypes[key] = {
          lastSynced: new Date().toISOString(),
          etag: (item as any).etag || null,
          status: 'synced',
          localHash,
          remoteHash: localHash, // Same on creation
          operationType: 'CREATE'
        };
      }
    }
    
    // Track updated types
    for (const item of executionResult.updated) {
      const key = (item as any).transformed?.key || (item as any).key;
      if (key) {
        const localHash = this.generateContentHash((item as any).transformed || item);
        state.contentTypes[key] = {
          lastSynced: new Date().toISOString(),
          etag: (item as any).etag || null,
          status: 'synced',
          localHash,
          remoteHash: localHash, // Updated to match local
          operationType: 'UPDATE'
        };
      }
    }
    
    // Track deleted types
    for (const key of executionResult.deleted) {
      if (state.contentTypes[key]) {
        state.contentTypes[key] = {
          ...state.contentTypes[key],
          lastSynced: new Date().toISOString(),
          status: 'deleted',
          operationType: 'DELETE'
        };
      }
    }
    
    await this.storage.saveSyncState(state);
  }

  private printSummary(): void {
    console.log(chalk.blue('\n━━━ Sync Summary ━━━\n'));
    console.log(`  📊 Statistics:`);
    console.log(`     Extracted: ${this.statistics.extracted}`);
    console.log(`     Transformed: ${this.statistics.transformed}`);
    console.log(chalk.green(`     Created: ${this.statistics.created}`));
    console.log(chalk.yellow(`     Updated: ${this.statistics.updated}`));
    console.log(chalk.red(`     Deleted: ${this.statistics.deleted}`));
    console.log(chalk.gray(`     Skipped: ${this.statistics.skipped}`));
    if (this.statistics.errors > 0) {
      console.log(chalk.red(`     Errors: ${this.statistics.errors}`));
    }
    console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━\n'));
  }
}