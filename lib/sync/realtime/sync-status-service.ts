import { EventEmitter } from 'events';

export interface SyncStatusUpdate {
  status: 'in_progress' | 'completed' | 'failed' | 'pending' | 'idle';
  progress: number;
  currentStep: string;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    timestamp: string;
  }>;
  validationResults?: {
    passed: boolean;
    errors: number;
    warnings: number;
    details: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  };
}

export class SyncStatusService extends EventEmitter {
  private static instance: SyncStatusService;
  private currentStatus: SyncStatusUpdate;
  private pollingInterval: NodeJS.Timeout | null = null;
  private sseConnections: Set<(data: string) => void> = new Set();

  private constructor() {
    super();
    this.currentStatus = {
      status: 'idle',
      progress: 0,
      currentStep: '',
      totalSteps: 0,
      errors: []
    };
  }

  static getInstance(): SyncStatusService {
    if (!SyncStatusService.instance) {
      SyncStatusService.instance = new SyncStatusService();
    }
    return SyncStatusService.instance;
  }

  updateStatus(update: Partial<SyncStatusUpdate>): void {
    this.currentStatus = {
      ...this.currentStatus,
      ...update,
      startedAt: update.status === 'in_progress' 
        ? new Date().toISOString() 
        : this.currentStatus.startedAt,
      completedAt: update.status === 'completed' || update.status === 'failed'
        ? new Date().toISOString()
        : undefined
    };

    // Emit event for local listeners
    this.emit('statusUpdate', this.currentStatus);

    // Send to SSE connections
    this.broadcastToSSE();

    // Update via API
    this.updateViaAPI();
  }

  getStatus(): SyncStatusUpdate {
    return { ...this.currentStatus };
  }

  addSSEConnection(sendFunction: (data: string) => void): void {
    this.sseConnections.add(sendFunction);
    // Send current status immediately
    sendFunction(`data: ${JSON.stringify(this.currentStatus)}\n\n`);
  }

  removeSSEConnection(sendFunction: (data: string) => void): void {
    this.sseConnections.delete(sendFunction);
  }

  private broadcastToSSE(): void {
    const data = `data: ${JSON.stringify(this.currentStatus)}\n\n`;
    this.sseConnections.forEach(send => {
      try {
        send(data);
      } catch (error) {
        // Connection might be closed, remove it
        this.sseConnections.delete(send);
      }
    });
  }

  private async updateViaAPI(): Promise<void> {
    try {
      await fetch('/api/sync/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentStatus)
      });
    } catch (error) {
      console.error('Failed to update sync status via API:', error);
    }
  }

  startPolling(interval: number = 1000): void {
    if (this.pollingInterval) {
      return;
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/sync/status');
        if (response.ok) {
          const status = await response.json();
          if (JSON.stringify(status) !== JSON.stringify(this.currentStatus)) {
            this.currentStatus = status;
            this.emit('statusUpdate', this.currentStatus);
            this.broadcastToSSE();
          }
        }
      } catch (error) {
        console.error('Failed to poll sync status:', error);
      }
    }, interval);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  simulateSync(steps: string[], duration: number = 5000): void {
    const stepDuration = duration / steps.length;
    let currentStepIndex = 0;

    this.updateStatus({
      status: 'in_progress',
      currentStep: steps[0],
      totalSteps: steps.length,
      progress: 0
    });

    const interval = setInterval(() => {
      currentStepIndex++;
      
      if (currentStepIndex >= steps.length) {
        this.updateStatus({
          status: 'completed',
          progress: 100,
          currentStep: 'Completed'
        });
        clearInterval(interval);
        return;
      }

      const progress = Math.round((currentStepIndex / steps.length) * 100);
      this.updateStatus({
        currentStep: steps[currentStepIndex],
        progress,
        estimatedCompletion: new Date(Date.now() + (steps.length - currentStepIndex) * stepDuration).toISOString()
      });
    }, stepDuration);
  }

  addError(error: { code: string; message: string; severity: 'error' | 'warning' | 'info' }): void {
    const errors = [...this.currentStatus.errors, {
      ...error,
      timestamp: new Date().toISOString()
    }];
    
    this.updateStatus({ errors });

    if (error.severity === 'error') {
      this.updateStatus({ status: 'failed' });
    }
  }

  setValidationResults(results: SyncStatusUpdate['validationResults']): void {
    this.updateStatus({ validationResults: results });
  }

  reset(): void {
    this.updateStatus({
      status: 'idle',
      progress: 0,
      currentStep: '',
      totalSteps: 0,
      errors: [],
      validationResults: undefined,
      startedAt: undefined,
      completedAt: undefined,
      estimatedCompletion: undefined
    });
  }
}

export default SyncStatusService.getInstance();