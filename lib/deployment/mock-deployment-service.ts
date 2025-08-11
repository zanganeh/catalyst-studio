import {
  DeploymentJob,
  DeploymentLog,
  CMSProvider,
  DeploymentStatus,
} from './deployment-types';

const DEPLOYMENT_HISTORY_KEY = 'deployment-history';

class MockDeploymentService {
  private activeDeployments = new Map<string, { cancel: () => void }>();

  startDeployment(
    job: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): { cancel: () => void } {
    let cancelled = false;
    let currentJob = { ...job, status: 'running' as DeploymentStatus };
    
    // Initial update
    onUpdate(currentJob);
    
    // Deployment simulation
    const steps = [
      { progress: 0, message: 'Initializing deployment process...', delay: 1000 },
      { progress: 5, message: `Validating ${provider.name} configuration...`, delay: 2000 },
      { progress: 15, message: 'Configuration validated successfully', delay: 1500 },
      { progress: 25, message: `Establishing connection to ${provider.name}...`, delay: 3000 },
      { progress: 35, message: 'Connection established', delay: 1000 },
      { progress: 40, message: 'Preparing content for deployment...', delay: 2000 },
      { progress: 50, message: 'Content validation in progress...', delay: 2500 },
      { progress: 60, message: 'Uploading content assets...', delay: 3000 },
      { progress: 70, message: 'Processing content mappings...', delay: 2000 },
      { progress: 80, message: 'Applying content transformations...', delay: 2500 },
      { progress: 90, message: 'Finalizing deployment...', delay: 2000 },
      { progress: 95, message: 'Running post-deployment validations...', delay: 1500 },
      { progress: 100, message: 'Deployment completed successfully!', delay: 1000 },
    ];
    
    let stepIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const processNextStep = () => {
      if (cancelled || stepIndex >= steps.length) {
        return;
      }
      
      const step = steps[stepIndex];
      
      // Simulate random failures (10% chance on certain steps)
      const shouldFail = Math.random() < 0.1 && 
                        stepIndex > 2 && 
                        stepIndex < steps.length - 2 &&
                        (job.retryCount || 0) < (job.maxRetries || 3);
      
      if (shouldFail) {
        const errorMessages = [
          'Network timeout while connecting to CMS',
          'Authentication failed: Invalid API credentials',
          'Content validation error: Required fields missing',
          'Rate limit exceeded for API calls',
          'Unexpected response from CMS server',
        ];
        
        const error = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        
        currentJob = {
          ...currentJob,
          status: 'failed',
          progress: step.progress,
          completedAt: new Date(),
          error,
          logs: [
            ...currentJob.logs,
            {
              timestamp: new Date(),
              level: 'error',
              message: error,
            },
          ],
        };
        
        onUpdate(currentJob);
        this.saveToHistory(currentJob);
        return;
      }
      
      // Add log entry
      const log: DeploymentLog = {
        timestamp: new Date(),
        level: step.progress === 100 ? 'info' : 
               step.message.includes('error') ? 'error' : 
               step.message.includes('warning') ? 'warning' : 'info',
        message: step.message,
      };
      
      currentJob = {
        ...currentJob,
        progress: step.progress,
        logs: [...currentJob.logs, log],
      };
      
      // Check if completed
      if (step.progress === 100) {
        currentJob = {
          ...currentJob,
          status: 'completed',
          completedAt: new Date(),
        };
        onUpdate(currentJob);
        this.saveToHistory(currentJob);
        return;
      }
      
      onUpdate(currentJob);
      stepIndex++;
      
      // Schedule next step with random variation
      const delay = step.delay + Math.random() * 1000 - 500; // ±500ms variation
      timeoutId = setTimeout(processNextStep, delay);
    };
    
    // Start the deployment process
    timeoutId = setTimeout(processNextStep, 1000);
    
    const cancel = () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
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
    return history.map((job: DeploymentJob & { startedAt: string; completedAt?: string; logs: Array<DeploymentLog & { timestamp: string }> }) => ({
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
    localStorage.removeItem(DEPLOYMENT_HISTORY_KEY);
  }
  
  // Simulate retry logic with exponential backoff
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

export const mockDeploymentService = new MockDeploymentService();