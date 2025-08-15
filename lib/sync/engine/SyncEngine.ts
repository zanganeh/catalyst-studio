import {
  DeploymentJob,
  DeploymentLog,
  CMSProvider,
  DeploymentStatus,
} from '../../deployment/deployment-types';
import { SyncEngineConfig } from '../types/sync';

// Import the JavaScript modules
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SyncOrchestrator = require('./sync-orchestrator.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DatabaseExtractor = require('../extractors/database-extractor.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OptimizelyTransformer = require('../transformers/optimizely-transformer.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OptimizelyApiClient = require('../adapters/optimizely-api-client.js');

const DEPLOYMENT_HISTORY_KEY = 'deployment-history';

class SyncEngine {
  private activeDeployments = new Map<string, { cancel: () => void }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private orchestrator: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractor: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private apiClient: any;

  constructor(config?: SyncEngineConfig) {
    // Initialize the sync components
    const dbPath = config?.dbPath || process.env.DATABASE_PATH || './data/catalyst.db';
    const storageDir = config?.storageDir || './sync-data';
    
    // Initialize components
    this.extractor = new DatabaseExtractor(dbPath);
    this.transformer = new OptimizelyTransformer();
    
    // Initialize API client with environment variables
    const apiUrl = config?.apiUrl || process.env.OPTIMIZELY_API_URL || 'https://api.cms.optimizely.com/preview3';
    const clientId = config?.clientId || process.env.OPTIMIZELY_CLIENT_ID;
    const clientSecret = config?.clientSecret || process.env.OPTIMIZELY_CLIENT_SECRET;

    if (clientId && clientSecret) {
      this.apiClient = new OptimizelyApiClient({
        apiUrl,
        clientId,
        clientSecret
      });
    }

    // Initialize orchestrator
    this.orchestrator = new SyncOrchestrator({
      extractor: this.extractor,
      transformer: this.transformer,
      apiClient: this.apiClient,
      storageDir
    });
  }

  startDeployment(
    job: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): { cancel: () => void } {
    let cancelled = false;
    let currentJob = { ...job, status: 'running' as DeploymentStatus };
    
    // Initial update
    onUpdate(currentJob);
    
    // Function to add log and update job
    const addLog = (message: string, level: 'info' | 'warning' | 'error' = 'info', progress?: number) => {
      const log: DeploymentLog = {
        timestamp: new Date(),
        level,
        message,
      };
      
      currentJob = {
        ...currentJob,
        logs: [...currentJob.logs, log],
        ...(progress !== undefined && { progress })
      };
      
      onUpdate(currentJob);
    };

    // Perform the actual sync
    const performSync = async () => {
      try {
        // Validate environment variables
        if (!process.env.OPTIMIZELY_CLIENT_ID || !process.env.OPTIMIZELY_CLIENT_SECRET) {
          throw new Error('Optimizely OAuth credentials not configured. Please set OPTIMIZELY_CLIENT_ID and OPTIMIZELY_CLIENT_SECRET in .env.local');
        }

        addLog('Initializing sync engine...', 'info', 5);
        
        if (cancelled) return;

        // Extract content types from database
        addLog('Extracting content types from database...', 'info', 10);
        const extractedTypes = await this.extractor.extractContentTypes();
        
        if (cancelled) return;
        
        addLog(`Found ${extractedTypes.length} content types to sync`, 'info', 20);

        // Transform content types
        addLog('Transforming content types for Optimizely...', 'info', 30);
        const transformedTypes = [];
        let transformProgress = 30;
        const transformStep = 20 / extractedTypes.length;

        for (const type of extractedTypes) {
          if (cancelled) return;
          
          const transformed = await this.transformer.transform(type);
          transformedTypes.push(transformed);
          transformProgress += transformStep;
          addLog(`Transformed ${type.name}`, 'info', Math.floor(transformProgress));
        }

        if (cancelled) return;

        // Sync to Optimizely
        addLog('Connecting to Optimizely CMS...', 'info', 50);
        
        if (!this.apiClient) {
          throw new Error('Optimizely API client not initialized. Check OAuth credentials.');
        }

        await this.apiClient.authenticate();
        addLog('Successfully authenticated with Optimizely', 'info', 55);

        if (cancelled) return;

        // Sync each content type
        let successful = 0;
        let failed = 0;
        let syncProgress = 55;
        const syncStep = 40 / transformedTypes.length;
        const details: Array<{ type: string; status: 'success' | 'failed'; message?: string }> = [];

        for (const type of transformedTypes) {
          if (cancelled) return;
          
          try {
            addLog(`Syncing ${type.name} to Optimizely...`, 'info');
            await this.apiClient.createContentType(type);
            successful++;
            details.push({ type: type.name, status: 'success' });
            syncProgress += syncStep;
            addLog(`Successfully synced ${type.name}`, 'info', Math.floor(syncProgress));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            failed++;
            const message = error.message || 'Unknown error';
            details.push({ type: type.name, status: 'failed', message });
            addLog(`Failed to sync ${type.name}: ${message}`, 'warning');
            // Continue with remaining types even if one fails
          }
        }

        if (cancelled) return;

        // Final status
        const allSuccessful = failed === 0;
        
        if (allSuccessful) {
          addLog(`Deployment completed successfully! Synced ${successful} content types.`, 'info', 100);
          currentJob = {
            ...currentJob,
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
          };
        } else {
          addLog(`Deployment completed with errors. Successful: ${successful}, Failed: ${failed}`, 'warning', 100);
          currentJob = {
            ...currentJob,
            status: 'failed',
            progress: 100,
            completedAt: new Date(),
            error: `${failed} content types failed to sync`,
          };
        }

        // Store results in job logs for now (since DeploymentJob doesn't have results field)
        // In a future update, we could extend DeploymentJob to include a results field
        addLog(`Sync completed - Successful: ${successful}, Failed: ${failed}, Total: ${transformedTypes.length}`, 
          allSuccessful ? 'info' : 'warning');

        onUpdate(currentJob);
        this.saveToHistory(currentJob);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (cancelled) return;
        
        const errorMessage = error.message || 'Unknown error occurred during sync';
        addLog(errorMessage, 'error');
        
        currentJob = {
          ...currentJob,
          status: 'failed',
          completedAt: new Date(),
          error: errorMessage,
        };
        
        onUpdate(currentJob);
        this.saveToHistory(currentJob);
      }
    };

    // Start the sync process
    performSync();

    const cancel = () => {
      cancelled = true;
      
      currentJob = {
        ...currentJob,
        status: 'cancelled',
        completedAt: new Date(),
        logs: [
          ...currentJob.logs,
          {
            timestamp: new Date(),
            level: 'warning',
            message: 'Deployment cancelled by user',
          },
        ],
      };
      
      onUpdate(currentJob);
      this.saveToHistory(currentJob);
    };
    
    this.activeDeployments.set(job.id, { cancel });
    
    return { cancel };
  }

  cancelDeployment(jobId: string): boolean {
    const deployment = this.activeDeployments.get(jobId);
    if (deployment) {
      deployment.cancel();
      this.activeDeployments.delete(jobId);
      return true;
    }
    return false;
  }

  private saveToHistory(job: DeploymentJob) {
    const historyStr = localStorage.getItem(DEPLOYMENT_HISTORY_KEY);
    const history = historyStr ? JSON.parse(historyStr) : [];
    
    // Convert dates to strings for storage
    const jobToStore = {
      ...job,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      logs: job.logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };
    
    history.unshift(jobToStore);
    
    // Keep only last 50 deployments
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem(DEPLOYMENT_HISTORY_KEY, JSON.stringify(history));
  }

  getDeploymentHistory(): DeploymentJob[] {
    const historyStr = localStorage.getItem(DEPLOYMENT_HISTORY_KEY);
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    
    // Convert date strings back to Date objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return history.map((job: any) => ({
      ...job,
      startedAt: new Date(job.startedAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logs: job.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      })),
    }));
  }

  clearHistory() {
    localStorage.removeItem(DEPLOYMENT_HISTORY_KEY);
  }

  // Retry deployment with exponential backoff
  retryDeployment(
    originalJob: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): { cancel: () => void } {
    const retryCount = (originalJob.retryCount || 0) + 1;
    const maxRetries = originalJob.maxRetries || 3;
    
    if (retryCount > maxRetries) {
      const failedJob: DeploymentJob = {
        ...originalJob,
        status: 'failed',
        completedAt: new Date(),
        error: 'Maximum retry attempts exceeded',
        retryCount,
      };
      onUpdate(failedJob);
      this.saveToHistory(failedJob);
      return { cancel: () => {} };
    }
    
    // Exponential backoff delay
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
    
    const retryJob: DeploymentJob = {
      ...originalJob,
      id: `${originalJob.id}-retry-${retryCount}`,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      completedAt: undefined,
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: `Retry attempt ${retryCount} of ${maxRetries} (waiting ${backoffDelay}ms)`,
        },
      ],
      retryCount,
      error: undefined,
    };
    
    let deployment: { cancel: () => void };
    
    const timeoutId = setTimeout(() => {
      deployment = this.startDeployment(retryJob, provider, onUpdate);
    }, backoffDelay);
    
    return {
      cancel: () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (deployment) deployment.cancel();
      },
    };
  }
}

export const syncEngine = new SyncEngine();