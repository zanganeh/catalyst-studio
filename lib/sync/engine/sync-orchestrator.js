import chalk from 'chalk';

export class SyncOrchestrator {
  constructor(extractor, storage, transformer, apiClient) {
    this.extractor = extractor;
    this.storage = storage;
    this.transformer = transformer;
    this.apiClient = apiClient;
    this.dryRun = false;
    this.statistics = {
      extracted: 0,
      transformed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  setDryRun(value) {
    this.dryRun = value;
    if (this.apiClient) {
      this.apiClient.setDryRun(value);
    }
  }

  async sync(options = {}) {
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
      console.error(chalk.red(`\n❌ Sync failed: ${error.message}`));
      return {
        success: false,
        error: error.message,
        statistics: this.statistics
      };
    }
  }

  async discoveryPhase(options) {
    const results = {
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
        results.remote = await this.apiClient.listContentTypes();
        console.log(chalk.green(`  ✓ Found ${results.remote.length} content types in Optimizely`));
      }
    } catch (error) {
      console.error(chalk.red(`  ✗ Discovery failed: ${error.message}`));
      throw error;
    }
    
    return results;
  }

  async analysisPhase(discoveryResult) {
    const analysis = {
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
        console.error(chalk.red(`  ✗ Failed to process ${localType.name}: ${error.message}`));
        this.statistics.errors++;
      }
    }
    
    console.log(chalk.green(`  ✓ Analysis complete:`));
    console.log(`    - To create: ${analysis.toCreate.length}`);
    console.log(`    - To update: ${analysis.toUpdate.length}`);
    console.log(`    - To skip: ${analysis.toSkip.length}`);
    
    return analysis;
  }

  async executionPhase(analysisResult) {
    const results = {
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
        console.error(chalk.red(`  ✗ Failed to create ${item.transformed.displayName}: ${error.message}`));
        results.failed.push({ item, error: error.message });
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
            item.etag
          );
          results.updated.push(updated);
          this.statistics.updated++;
        } else {
          console.log(chalk.gray('    [DRY-RUN] Would update content type'));
          results.updated.push(item);
        }
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to update ${item.transformed.displayName}: ${error.message}`));
        results.failed.push({ item, error: error.message });
        this.statistics.errors++;
      }
    }
    
    this.statistics.skipped = results.skipped.length;
    
    return results;
  }

  detectChanges(local, remote) {
    const localProps = JSON.stringify(local.properties || {});
    const remoteProps = JSON.stringify(remote.properties || {});
    
    return localProps !== remoteProps ||
           local.displayName !== remote.displayName ||
           local.description !== remote.description;
  }

  async saveSyncState(executionResult) {
    const state = await this.storage.loadSyncState();
    
    state.lastSync = new Date().toISOString();
    state.statistics = this.statistics;
    state.contentTypes = {};
    
    for (const item of [...executionResult.created, ...executionResult.updated]) {
      const key = item.transformed?.key || item.key;
      if (key) {
        state.contentTypes[key] = {
          lastSynced: new Date().toISOString(),
          etag: item.etag || null,
          status: 'synced'
        };
      }
    }
    
    await this.storage.saveSyncState(state);
  }

  printSummary() {
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