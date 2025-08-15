import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface ActiveDeployment {
  id: string;
  websiteId: string;
  selectedTypes?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// Store active deployments in memory (for MVP/local development)
const activeDeployments = new Map<string, ActiveDeployment>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteId, provider, selectedTypes } = body;

    // Generate a unique deployment ID
    const deploymentId = uuidv4();
    
    // Create the deployment job
    const job: ActiveDeployment = {
      id: deploymentId,
      websiteId,
      selectedTypes,
      status: 'pending',
      progress: 0,
      logs: [],
      startedAt: new Date().toISOString(),
    };

    // Store the job
    activeDeployments.set(deploymentId, job);

    // Start the deployment in the background
    startDeploymentAsync(deploymentId, provider);

    return NextResponse.json({ 
      success: true, 
      deploymentId,
      job 
    });
  } catch (error) {
    console.error('Failed to start deployment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start deployment' },
      { status: 500 }
    );
  }
}

interface CMSProviderInfo {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

async function startDeploymentAsync(deploymentId: string, provider: CMSProviderInfo) {
  const job = activeDeployments.get(deploymentId);
  if (!job) return;

  try {
    // Update job status
    job.status = 'running';
    job.progress = 5;
    
    // Simulate deployment process
    // In a real implementation, this would use the sync engine to:
    // 1. Extract content types from database
    // 2. Transform them for the target CMS
    // 3. Push them to the CMS API
    const steps = [
      { progress: 10, message: 'Initializing sync engine...' },
      { progress: 20, message: 'Extracting content types from database...' },
      { progress: 40, message: 'Transforming content types for Optimizely...' },
      { progress: 60, message: 'Connecting to Optimizely CMS...' },
      { progress: 80, message: 'Syncing content types...' },
      { progress: 100, message: 'Deployment completed successfully!' },
    ];

    for (const step of steps) {
      if ((job as ActiveDeployment).status === 'cancelled') break;
      
      job.progress = step.progress;
      job.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: step.message,
      });
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if ((job as ActiveDeployment).status !== 'cancelled') {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
    }
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Deployment failed';
    job.completedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: job.error,
    });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deploymentId = searchParams.get('id');
  
  if (!deploymentId) {
    return NextResponse.json(
      { success: false, error: 'Deployment ID required' },
      { status: 400 }
    );
  }

  const job = activeDeployments.get(deploymentId);
  
  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Deployment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, job });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deploymentId = searchParams.get('id');
  
  if (!deploymentId) {
    return NextResponse.json(
      { success: false, error: 'Deployment ID required' },
      { status: 400 }
    );
  }

  const job = activeDeployments.get(deploymentId);
  
  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Deployment not found' },
      { status: 404 }
    );
  }

  // Cancel the deployment
  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();
  job.logs.push({
    timestamp: new Date().toISOString(),
    level: 'warning',
    message: 'Deployment cancelled by user',
  });

  // Clean up after a delay
  setTimeout(() => {
    activeDeployments.delete(deploymentId);
  }, 60000); // Keep for 1 minute for final status checks

  return NextResponse.json({ success: true });
}