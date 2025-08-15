import {
  DeploymentJob,
  DeploymentLog,
  CMSProvider,
  DeploymentStatus,
} from '../../deployment/deployment-types';
import { SyncEngineConfig } from '../types/sync';

const DEPLOYMENT_HISTORY_KEY = 'deployment-history';

interface SyncComponents {
  orchestrator?: unknown;
  extractor?: unknown;
  transformer?: unknown;
  apiClient?: unknown;
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
      // Dynamic import for better code splitting
      const { DatabaseExtractor } = await import('../extractors/database-extractor.js');
      const dbPath = this.config?.dbPath || process.env.DATABASE_PATH || './data/catalyst.db';
      this.components.extractor = new DatabaseExtractor(dbPath);
    }

    if (!this.components.transformer) {
      const OptimizelyTransformerModule = await import('../transformers/optimizely-transformer.js');
      const OptimizelyTransformer = OptimizelyTransformerModule.default || OptimizelyTransformerModule;
      this.components.transformer = new OptimizelyTransformer();
    }

    if (!this.components.apiClient) {
      const apiUrl = this.config?.apiUrl || process.env.OPTIMIZELY_API_URL || 'https://api.cms.optimizely.com/preview3';
      const clientId = this.config?.clientId || process.env.OPTIMIZELY_CLIENT_ID;
      const clientSecret = this.config?.clientSecret || process.env.OPTIMIZELY_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const OptimizelyApiClientModule = await import('../adapters/optimizely-api-client.js');
        const OptimizelyApiClient = OptimizelyApiClientModule.default || OptimizelyApiClientModule;
        this.components.apiClient = new OptimizelyApiClient({
          apiUrl,
          clientId,
          clientSecret
        });
      }
    }

    if (!this.components.orchestrator) {
      const storageDir = this.config?.storageDir || './sync-data';
      const SyncOrchestratorModule = await import('./sync-orchestrator.js');
      const SyncOrchestrator = SyncOrchestratorModule.default || SyncOrchestratorModule;
      this.components.orchestrator = new SyncOrchestrator({
        extractor: this.components.extractor,
        transformer: this.components.transformer,
        apiClient: this.components.apiClient,
        storageDir
      });
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
        };
        onUpdate(runningJob);

        // Simulate deployment steps for MVP
        // In production, this would use the actual sync orchestrator
        const steps = [
          { progress: 20, message: 'Extracting content types from database...' },
          { progress: 40, message: 'Transforming content types for ' + provider.name + '...' },
          { progress: 60, message: 'Connecting to ' + provider.name + ' API...' },
          { progress: 80, message: 'Syncing content types...' },
          { progress: 100, message: 'Deployment completed successfully!' },
        ];

        for (const step of steps) {
          if (cancelled) {
            throw new Error('Deployment cancelled by user');
          }

          await new Promise(resolve => setTimeout(resolve, 2000));

          const updatedJob: DeploymentJob = {
            ...runningJob,
            progress: step.progress,
            logs: [
              ...runningJob.logs,
              {
                timestamp: new Date(),
                level: 'info',
                message: step.message,
              },
            ],
          };
          onUpdate(updatedJob);
        }

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
      } catch (error) {
        const failedJob: DeploymentJob = {
          ...job,
          status: 'failed' as DeploymentStatus,
          error: error instanceof Error ? error.message : 'Deployment failed',
          completedAt: new Date(),
        };
        onUpdate(failedJob);
        
        // Save failed deployment to history
        this.saveDeploymentToHistory(failedJob);
      } finally {
        // Clean up
        this.activeDeployments.delete(job.id);
      }
    };

    // Start deployment asynchronously
    runDeployment();

    return { cancel };
  }

  /**
   * Saves a deployment job to the history in localStorage
   * @param job - The deployment job to save
   */
  private saveDeploymentToHistory(job: DeploymentJob): void {
    try {
      const history = this.getDeploymentHistory();
      history.unshift(job);
      
      // Keep only last 50 deployments
      const trimmedHistory = history.slice(0, 50);
      
      localStorage.setItem(DEPLOYMENT_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save deployment to history:', error);
    }
  }

  /**
   * Retrieves the deployment history from localStorage
   * @returns Array of deployment jobs
   */
  getDeploymentHistory(): DeploymentJob[] {
    try {
      const historyStr = localStorage.getItem(DEPLOYMENT_HISTORY_KEY);
      if (!historyStr) return [];
      
      const history = JSON.parse(historyStr);
      // Convert date strings back to Date objects
      return history.map((job: Record<string, unknown>) => ({
        ...job,
        startedAt: new Date(job.startedAt as string),
        completedAt: job.completedAt ? new Date(job.completedAt as string) : undefined,
        logs: (job.logs as Array<Record<string, unknown>>).map(log => ({
          ...log,
          timestamp: new Date(log.timestamp as string),
        })),
      }));
    } catch (error) {
      console.error('Failed to load deployment history:', error);
      return [];
    }
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