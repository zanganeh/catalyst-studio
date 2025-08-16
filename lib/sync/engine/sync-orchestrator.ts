import * as chalk from 'chalk';
import { DatabaseExtractor, ExtractedContentType } from '../extractors/database-extractor';
import { OptimizelyTransformer, TransformationResult } from '../transformers/optimizely-transformer';
import { OptimizelyApiClient, OptimizelyContentTypeResponse } from '../adapters/optimizely-api-client';

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
  }>;
}

export interface SyncStatistics {
  extracted: number;
  transformed: number;
  created: number;
  updated: number;
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
  toSkip: TransformationResult[];
  conflicts: any[];
}

export interface ExecutionResult {
  created: any[];
  updated: any[];
  skipped: TransformationResult[];
  failed: Array<{ item: any; error: string }>;
}

export class SyncOrchestrator {
  private extractor: DatabaseExtractor;
  private storage: SyncStorage;
  private transformer: OptimizelyTransformer;
  private apiClient: OptimizelyApiClient | null;
  private dryRun: boolean = false;
  private statistics: SyncStatistics = {
    extracted: 0,
    transformed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  constructor(
    extractor: DatabaseExtractor,
    storage: SyncStorage,
    transformer: OptimizelyTransformer,
    apiClient: OptimizelyApiClient | null
  ) {
    this.extractor = extractor;
    this.storage = storage;
    this.transformer = transformer;
    this.apiClient = apiClient;
  }

  setDryRun(value: boolean): void {
    this.dryRun = value;
    if (this.apiClient) {
      this.apiClient.setDryRun(value);
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
      
      if (this.apiClient) {
        console.log('  🌐 Fetching remote content types from Optimizely...');
        results.remote = await this.apiClient.getContentTypes();
        console.log(chalk.green(`  ✓ Found ${results.remote.length} content types in Optimizely`));
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
      toSkip: [],
      conflicts: []
    };
    
    console.log('  🔄 Transforming content types to Optimizely format...');
    
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
        
        if (!this.apiClient) {
          analysis.toSkip.push(transformed);
          continue;
        }
        
        const existingRemote = discoveryResult.remote.find(
          r => r.key === transformed.transformed.key
        );
        
        if (existingRemote) {
          const hasChanges = this.detectChanges(transformed.transformed, existingRemote);
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
    
    console.log(chalk.green(`  ✓ Analysis complete:`));
    console.log(`    - To create: ${analysis.toCreate.length}`);
    console.log(`    - To update: ${analysis.toUpdate.length}`);
    console.log(`    - To skip: ${analysis.toSkip.length}`);
    
    return analysis;
  }

  private async executionPhase(analysisResult: AnalysisResult): Promise<ExecutionResult> {
    const results: ExecutionResult = {
      created: [],
      updated: [],
      skipped: analysisResult.toSkip,
      failed: []
    };
    
    if (!this.apiClient) {
      console.log(chalk.yellow('  ⚠ No API client configured - skipping execution'));
      return results;
    }
    
    for (const item of analysisResult.toCreate) {
      try {
        console.log(`  🚀 Creating: ${item.transformed.displayName}`);
        if (!this.dryRun) {
          const created = await this.apiClient.createContentType(item.transformed);
          results.created.push(created);
          this.statistics.created++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would create content type'));
          results.created.push(item);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to create ${item.transformed.displayName}: ${errorMessage}`));
        results.failed.push({ item, error: errorMessage });
        this.statistics.errors++;
      }
    }
    
    for (const item of analysisResult.toUpdate) {
      try {
        console.log(`  🔄 Updating: ${item.transformed.displayName}`);
        if (!this.dryRun) {
          const updated = await this.apiClient.updateContentType(
            item.transformed.key,
            item.transformed,
            item.etag || undefined
          );
          results.updated.push(updated);
          this.statistics.updated++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would update content type'));
          results.updated.push(item);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`  ✗ Failed to update ${item.transformed.displayName}: ${errorMessage}`));
        results.failed.push({ item, error: errorMessage });
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
    
    for (const item of [...executionResult.created, ...executionResult.updated]) {
      const key = (item as any).transformed?.key || (item as any).key;
      if (key) {
        state.contentTypes[key] = {
          lastSynced: new Date().toISOString(),
          etag: (item as any).etag || null,
          status: 'synced'
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
    console.log(chalk.gray(`     Skipped: ${this.statistics.skipped}`));
    if (this.statistics.errors > 0) {
      console.log(chalk.red(`     Errors: ${this.statistics.errors}`));
    }
    console.log(chalk.blue('\n━━━━━━━━━━━━━━━━━━━\n'));
  }
}