// Basic type definitions for sync operations
export interface DeploymentJob {
  id: string;
  status: 'pending' | 'running' | 'syncing' | 'complete' | 'failed';
  progress: number;
  totalSteps: number;
  currentStep: string;
  results?: SyncResult;
  error?: string;
  selectedTypes?: string[];
  targetEnvironment?: string;
}

export interface SyncResult {
  successful: number;
  failed: number;
  total: number;
  details?: Array<{
    type: string;
    status: 'success' | 'failed';
    message?: string;
  }>;
}

export interface ContentType {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[]; // Use any for MVP, can be typed later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

export interface CMSProvider {
  name: string;
  apiUrl?: string;
  credentials?: {
    clientId?: string;
    clientSecret?: string;
  };
}

export interface DeploymentService {
  startDeployment(
    job: DeploymentJob,
    provider: CMSProvider,
    onUpdate: (job: DeploymentJob) => void
  ): { cancel: () => void };
}

export interface SyncEngineConfig {
  dbPath?: string;
  storageDir?: string;
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SyncStatus {
  phase: 'extracting' | 'transforming' | 'syncing' | 'complete';
  currentType?: string;
  progress: number;
  message: string;
}