import {
  DeploymentJob,
  CMSProvider,
} from '@/lib/deployment/deployment-types';

class ClientSyncService {
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private csrfToken: string | null = null;

  private async getCSRFToken(): Promise<string> {
    // CSRF removed for MVP - return empty string
    return '';
  }

  async startDeployment(
    job: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): Promise<{ cancel: () => void }> {
    try {
      // Start the deployment via API (CSRF removed for MVP)
      const response = await fetch('/api/sync/start-deployment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId: job.websiteId,
          provider,
          selectedTypes: job.selectedTypes,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start deployment');
      }

      const deploymentId = result.deploymentId;
      
      // Start polling for updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/sync/start-deployment?id=${deploymentId}`);
          const statusResult = await statusResponse.json();
          
          if (statusResult.success && statusResult.job) {
            // Convert API response to DeploymentJob format
            const updatedJob: DeploymentJob = {
              ...job,
              ...statusResult.job,
              startedAt: new Date(statusResult.job.startedAt),
              completedAt: statusResult.job.completedAt ? new Date(statusResult.job.completedAt) : undefined,
              logs: statusResult.job.logs.map((log: { timestamp: string; level: string; message: string }) => ({
                ...log,
                timestamp: new Date(log.timestamp),
              })),
            };
            
            onUpdate(updatedJob);
            
            // Stop polling if deployment is complete
            if (['completed', 'failed', 'cancelled'].includes(updatedJob.status)) {
              clearInterval(pollInterval);
              this.pollingIntervals.delete(deploymentId);
            }
          }
        } catch (error) {
          console.error('Failed to poll deployment status:', error);
        }
      }, 1000); // Poll every second

      this.pollingIntervals.set(deploymentId, pollInterval);

      // Return cancel function
      return {
        cancel: async () => {
          // Stop polling
          const interval = this.pollingIntervals.get(deploymentId);
          if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(deploymentId);
          }
          
          // Cancel deployment via API (CSRF removed for MVP)
          await fetch(`/api/sync/start-deployment?id=${deploymentId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        },
      };
    } catch (error) {
      const errorJob: DeploymentJob = {
        ...job,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start deployment',
        completedAt: new Date(),
      };
      onUpdate(errorJob);
      return { cancel: () => {} };
    }
  }

  getDeploymentHistory(): DeploymentJob[] {
    const historyStr = localStorage.getItem('deployment-history');
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    
    // Convert date strings back to Date objects
    interface StoredJob {
      startedAt: string;
      completedAt?: string;
      logs: Array<{ timestamp: string; level: string; message: string }>;
      [key: string]: unknown;
    }
    
    return history.map((job: StoredJob) => ({
      ...job,
      startedAt: new Date(job.startedAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      logs: job.logs.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      })),
    }));
  }

  clearHistory() {
    localStorage.removeItem('deployment-history');
  }

  saveDeploymentToHistory(job: DeploymentJob) {
    const history = this.getDeploymentHistory();
    
    // Add the new job to the beginning of the history
    history.unshift(job);
    
    // Keep only the last 50 deployments
    const trimmedHistory = history.slice(0, 50);
    
    // Convert to JSON-serializable format
    const serializable = trimmedHistory.map(j => ({
      ...j,
      startedAt: j.startedAt.toISOString(),
      completedAt: j.completedAt?.toISOString(),
      logs: j.logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    }));
    
    localStorage.setItem('deployment-history', JSON.stringify(serializable));
  }
}

export const clientSyncService = new ClientSyncService();