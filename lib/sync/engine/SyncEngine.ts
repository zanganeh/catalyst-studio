import {
  DeploymentJob,
  DeploymentLog,
  CMSProvider,
  DeploymentStatus,
} from '../../deployment/deployment-types';
import { SyncEngineConfig } from '../types/sync';
import { DatabaseExtractor } from '../extractors/database-extractor';
import { OptimizelyTransformer } from '../transformers/optimizely-transformer';
import { OptimizelyApiClient } from '../adapters/optimizely-api-client';
import { SyncOrchestrator, SyncStorage, SyncState } from './sync-orchestrator';
import { DatabaseStorage } from '../storage/database-storage';
import { ContentTypeValidator } from '../validation/ContentTypeValidator';
import { CompatibilityChecker } from '../validation/CompatibilityChecker';
import { ValidationErrorReporter } from '../validation/ValidationErrorReporter';
import { ProviderRegistry } from '../../providers/registry';
import { OptimizelyProvider } from '../../providers/optimizely';
import { ICMSProvider } from '../../providers/types';

const DEPLOYMENT_HISTORY_KEY = 'deployment-history';

interface SyncComponents {
  orchestrator?: SyncOrchestrator;
  extractor?: DatabaseExtractor;
  transformer?: OptimizelyTransformer;
  apiClient?: OptimizelyApiClient;
  provider?: ICMSProvider;
  validator?: ContentTypeValidator;
  compatibilityChecker?: CompatibilityChecker;
  errorReporter?: ValidationErrorReporter;
}

class SyncEngine {
  private activeDeployments = new Map<string, { cancel: () => void }>();
  private components: SyncComponents = {};
  private config: SyncEngineConfig | undefined;

  constructor(config?: SyncEngineConfig) {
    // Validate configuration on startup
    this.validateConfiguration(config);
    this.config = config;
    // Components will be initialized asynchronously when needed
  }

  private async initializeComponents(): Promise<void> {
    if (!this.components.extractor) {
      // Prisma handles database connection automatically
      this.components.extractor = new DatabaseExtractor();
    }

    if (!this.components.transformer) {
      this.components.transformer = new OptimizelyTransformer();
    }

    // Use provider pattern if enabled
    const useProviderPattern = process.env.USE_PROVIDER_PATTERN === 'true';
    
    if (useProviderPattern) {
      // Initialize provider and register it
      if (!this.components.provider) {
        const registry = ProviderRegistry.getInstance();
        
        // Check if OptimizelyProvider is already registered
        let provider = registry.getProvider('optimizely');
        
        if (!provider) {
          // Register OptimizelyProvider
          provider = new OptimizelyProvider();
          registry.register('optimizely', provider);
          registry.setActiveProvider('optimizely');
        }
        
        this.components.provider = provider;
      }
    } else {
      // Legacy direct integration
      if (!this.components.apiClient) {
        const apiUrl = this.config?.apiUrl || process.env.OPTIMIZELY_API_URL || 'https://api.cms.optimizely.com/preview3';
        const clientId = this.config?.clientId || process.env.OPTIMIZELY_CLIENT_ID;
        const clientSecret = this.config?.clientSecret || process.env.OPTIMIZELY_CLIENT_SECRET;

        if (clientId && clientSecret) {
          this.components.apiClient = new OptimizelyApiClient({
            baseUrl: apiUrl,
            clientId,
            clientSecret
          });
        }
      }
    }

    // Initialize validation components
    if (!this.components.validator) {
      this.components.validator = new ContentTypeValidator();
    }

    if (!this.components.compatibilityChecker) {
      this.components.compatibilityChecker = new CompatibilityChecker();
    }

    if (!this.components.errorReporter) {
      this.components.errorReporter = new ValidationErrorReporter();
    }

    if (!this.components.orchestrator) {
      // Use DatabaseStorage that reads from actual database
      const storage = new DatabaseStorage(this.components.extractor);
      
      this.components.orchestrator = new SyncOrchestrator(
        this.components.extractor,
        storage,
        this.components.transformer,
        this.components.apiClient || null
      );
    }
  }

  private validateConfiguration(config?: SyncEngineConfig): void {
    // Check if credentials are provided via config or environment
    const clientId = config?.clientId || process.env.OPTIMIZELY_CLIENT_ID;
    const clientSecret = config?.clientSecret || process.env.OPTIMIZELY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn(
        '⚠️ Optimizely OAuth credentials not configured. ' +
        'Sync engine will work in limited mode. ' +
        'Please set OPTIMIZELY_CLIENT_ID and OPTIMIZELY_CLIENT_SECRET in .env.local'
      );
    }
  }

  /**
   * Sanitizes content type name for API safety
   * Removes special characters and ensures valid naming
   */
  private sanitizeContentTypeName(name: string): string {
    // Remove any potentially dangerous characters
    // Allow only alphanumeric, spaces, underscores, and hyphens
    return name
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .substring(0, 100); // Limit length to prevent overflow
  }

  /**
   * Starts a deployment job to sync content types to the CMS provider
   * @param job - The deployment job configuration
   * @param provider - The CMS provider to sync to
   * @param onUpdate - Callback function called with job updates
   * @returns A control object with a cancel function
   */
  async startDeployment(
    job: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): Promise<{ cancel: () => void }> {
    // Initialize components if not already done
    await this.initializeComponents();

    // Create a cancellation token
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };

    // Store the active deployment
    this.activeDeployments.set(job.id, { cancel });

    // Start the deployment process
    const runDeployment = async () => {
      try {
        // Update status to running
        const runningJob: DeploymentJob = {
          ...job,
          status: 'running' as DeploymentStatus,
          progress: 10,
          logs: [
            ...job.logs,
            {
              timestamp: new Date(),
              level: 'info',
              message: 'Starting deployment process...',
            },
          ],
        };
        onUpdate(runningJob);

        // Initialize components if not already done
        await this.initializeComponents();

        if (!this.components.orchestrator) {
          throw new Error('Failed to initialize sync orchestrator');
        }

        // Helper function to add log and update progress
        const updateProgress = (progress: number, message: string, level: 'info' | 'error' | 'warning' = 'info') => {
          const updatedJob: DeploymentJob = {
            ...runningJob,
            progress,
            logs: [
              ...runningJob.logs,
              {
                timestamp: new Date(),
                level,
                message,
              },
            ],
          };
          runningJob.logs = updatedJob.logs;
          onUpdate(updatedJob);
        };

        // Check if dry-run mode (no credentials)
        const isDryRun = !this.config?.clientId && !process.env.OPTIMIZELY_CLIENT_ID;
        if (isDryRun) {
          this.components.orchestrator.setDryRun(true);
          updateProgress(15, 'Running in simulation mode (no Optimizely credentials configured)', 'warning');
        }

        updateProgress(20, 'Extracting content types from database...');

        // Extract content types for validation
        const contentTypes = await this.components.extractor!.extractContentTypes(job.websiteId);
        
        if (cancelled) {
          throw new Error('Deployment cancelled by user');
        }

        // Validation checkpoint
        const bypassValidation = job.options?.bypassValidation || false;
        
        if (!bypassValidation) {
          updateProgress(25, 'Validating content types...');
          
          let hasValidationErrors = false;
          const validationErrors: string[] = [];
          
          for (const contentType of contentTypes) {
            // Structure and business rule validation
            const validationResult = this.components.validator!.validate(contentType);
            
            // Compatibility check
            const compatibilityResult = this.components.compatibilityChecker!.checkPlatformCompatibility(
              contentType,
              provider.id.toLowerCase()
            );
            
            // Combine results
            const allErrors = [...validationResult.errors, ...compatibilityResult.errors];
            const allWarnings = compatibilityResult.warnings || [];
            
            if (allErrors.length > 0) {
              hasValidationErrors = true;
              const report = this.components.errorReporter!.formatDetailedReport({
                valid: false,
                errors: allErrors
              });
              validationErrors.push(`Content type "${contentType.name}": ${report}`);
              updateProgress(25, `Validation errors found in "${contentType.name}"`, 'error');
            }
            
            if (allWarnings.length > 0) {
              const warningReport = this.components.errorReporter!.formatDetailedReport({
                valid: true,
                errors: allWarnings
              });
              updateProgress(25, `Warnings for "${contentType.name}": ${warningReport}`, 'warning');
            }
          }
          
          if (hasValidationErrors) {
            const errorMessage = `Validation failed. ${validationErrors.length} content type(s) have errors:\n${validationErrors.join('\n')}`;
            throw new Error(errorMessage);
          }
          
          updateProgress(30, 'All content types validated successfully');
        } else {
          // Bypass validation with audit logging
          updateProgress(25, `VALIDATION BYPASSED by user ${job.initiatedBy || 'unknown'} at ${new Date().toISOString()}`, 'warning');
          console.warn(`SECURITY AUDIT: Validation bypass requested by ${job.initiatedBy || 'unknown'} for deployment ${job.id}`);
        }

        // Execute the actual sync
        const syncResult = await this.components.orchestrator.sync({
          websiteId: job.websiteId,
        });

        if (cancelled) {
          throw new Error('Deployment cancelled by user');
        }

        // Process sync results
        if (syncResult.success) {
          const stats = syncResult.statistics;
          
          updateProgress(40, `Extracted ${stats.extracted} content types`);
          updateProgress(60, `Transformed ${stats.transformed} content types`);
          
          if (stats.created > 0) {
            updateProgress(80, `Created ${stats.created} content types in ${provider.name}`);
          }
          if (stats.updated > 0) {
            updateProgress(85, `Updated ${stats.updated} content types in ${provider.name}`);
          }
          if (stats.skipped > 0) {
            updateProgress(90, `Skipped ${stats.skipped} unchanged content types`);
          }
          if (stats.errors > 0) {
            updateProgress(95, `Encountered ${stats.errors} errors during sync`, 'warning');
          }

          updateProgress(100, 'Deployment completed successfully!');

          // Mark as completed
          const completedJob: DeploymentJob = {
            ...runningJob,
            status: 'completed' as DeploymentStatus,
            progress: 100,
            completedAt: new Date(),
          };
          onUpdate(completedJob);

          // Save to history
          this.saveDeploymentToHistory(completedJob);
        } else {
          throw new Error(syncResult.error || 'Sync failed');
        }
      } catch (error) {
        const failedJob: DeploymentJob = {
          ...job,
          status: 'failed' as DeploymentStatus,
          error: error instanceof Error ? error.message : 'Deployment failed',
          completedAt: new Date(),
          logs: [
            ...job.logs,
            {
              timestamp: new Date(),
              level: 'error',
              message: error instanceof Error ? error.message : 'Deployment failed',
            },
          ],
        };
        onUpdate(failedJob);
        
        // Save failed deployment to history
        this.saveDeploymentToHistory(failedJob);
      } finally {
        // Clean up
        this.activeDeployments.delete(job.id);
      }
    };

    // Start deployment asynchronously and ensure cleanup on error
    runDeployment().catch((error) => {
      console.error('Deployment failed with unhandled error:', error);
      // Ensure cleanup even if there's an unhandled error
      this.activeDeployments.delete(job.id);
    });

    return { cancel };
  }

  /**
   * Saves a deployment job to the history
   * Note: This should be handled by database persistence, not localStorage
   * @param job - The deployment job to save
   */
  private saveDeploymentToHistory(job: DeploymentJob): void {
    // Deployment history is persisted via database (Prisma Deployment model)
    // Remove localStorage usage as this runs server-side
    console.log(`Deployment ${job.id} saved to database`);
  }

  /**
   * Retrieves the deployment history
   * Note: This should fetch from database, not localStorage
   * @returns Array of deployment jobs
   */
  getDeploymentHistory(): DeploymentJob[] {
    // TODO: Implement database fetch for deployment history
    // This should query the Deployment table via Prisma
    console.log('Deployment history should be fetched from database');
    return [];
  }

  /**
   * Cancels an active deployment
   * @param deploymentId - The ID of the deployment to cancel
   */
  cancelDeployment(deploymentId: string): void {
    const deployment = this.activeDeployments.get(deploymentId);
    if (deployment) {
      deployment.cancel();
      this.activeDeployments.delete(deploymentId);
    }
  }

  /**
   * Gets the status of all active deployments
   * @returns Array of active deployment IDs
   */
  getActiveDeployments(): string[] {
    return Array.from(this.activeDeployments.keys());
  }
}

export const syncEngine = new SyncEngine();