import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { DatabaseExtractor } from '@/lib/sync/extractors/database-extractor';
import { OptimizelyTransformer } from '@/lib/sync/transformers/optimizely-transformer';
import { OptimizelyApiClient } from '@/lib/sync/adapters/optimizely-api-client';
import { SyncOrchestrator } from '@/lib/sync/engine/sync-orchestrator';
import { DatabaseStorage } from '@/lib/sync/storage/database-storage';
import { startDeploymentSchema } from '@/lib/api/validation/deployment';
import { withTransaction } from '@/lib/sync/utils/transaction-manager';

interface CMSProviderInfo {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = startDeploymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }
    
    const { websiteId, provider, selectedTypes } = validationResult.data;

    // Generate a unique deployment ID
    const deploymentId = uuidv4();
    
    // Create deployment job in database within a transaction
    const deployment = await withTransaction(async (tx) => {
      // Check if website exists
      const website = await tx.website.findUnique({
        where: { id: websiteId },
      });
      
      if (!website) {
        throw new Error('Website not found');
      }
      
      // Check for existing active deployments
      const activeDeployment = await tx.deployment.findFirst({
        where: {
          websiteId,
          status: {
            in: ['pending', 'queued', 'processing', 'running'],
          },
        },
      });
      
      if (activeDeployment) {
        throw new Error('Another deployment is already in progress for this website');
      }
      
      // Create the deployment
      return await tx.deployment.create({
        data: {
          id: deploymentId,
          websiteId,
          provider: provider.id,  // Changed from providerId to provider
          status: 'pending',
          deploymentData: {
            providerName: provider.name,
            selectedTypes: selectedTypes || [],
            progress: 0
          },
        },
      });
    });

    // Process deployment immediately for now (in production use job queue)
    // Using setImmediate to avoid blocking the response
    setImmediate(async () => {
      try {
        await processDeployment(deploymentId, provider);
      } catch (error) {
        console.error(`Deployment ${deploymentId} failed:`, error);
        await prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          }
        });
      }
    });

    const deploymentData = deployment.deploymentData as any || {};
    
    return NextResponse.json({ 
      success: true, 
      deploymentId,
      deployment: {
        id: deployment.id,
        status: deployment.status,
        progress: deploymentData.progress || 0,
      }
    });
  } catch (error) {
    // Log error for monitoring in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to start deployment:', error);
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to start deployment';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function processDeployment(deploymentId: string, provider: CMSProviderInfo) {
  let isCancelled = false;
  
  // Helper function to check cancellation status
  const checkCancelled = async () => {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { status: true },
    });
    isCancelled = deployment?.status === 'cancelled';
    return isCancelled;
  };

  // Helper function to update deployment progress
  const updateProgress = async (progress: number, message: string, level: 'info' | 'error' | 'warning' = 'info') => {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    
    const deploymentDataObj = deployment?.deploymentData as any || {};
    const logs: any[] = deploymentDataObj.logs || [];
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    
    deploymentDataObj.logs = logs;
    deploymentDataObj.progress = progress;
    
    // Use transaction for atomic update
    await withTransaction(async (tx) => {
      await tx.deployment.update({
        where: { id: deploymentId },
        data: { 
          deploymentData: deploymentDataObj,
        },
      });
    });
  };

  try {
    // Get deployment details with website ID
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { 
        websiteId: true,
        deploymentData: true,
      },
    });
    
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // Update status to running
    const currentDeploymentData = deployment.deploymentData as any || {};
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'running',
        deploymentData: {
          ...currentDeploymentData,
          progress: 5
        },
      },
    });
    
    await updateProgress(5, 'Starting deployment process...');

    // Initialize sync engine components
    await updateProgress(10, 'Initializing sync engine...');
    
    const extractor = new DatabaseExtractor();
    const transformer = new OptimizelyTransformer();
    const storage = new DatabaseStorage(extractor);
    
    // Configure API client based on provider
    let apiClient: OptimizelyApiClient | null = null;
    
    if (provider.id === 'optimizely') {
      const clientId = process.env.OPTIMIZELY_CLIENT_ID;
      const clientSecret = process.env.OPTIMIZELY_CLIENT_SECRET;
      const apiUrl = process.env.OPTIMIZELY_API_URL || 'https://api.cms.optimizely.com/preview3';
      
      if (clientId && clientSecret) {
        apiClient = new OptimizelyApiClient({
          baseUrl: apiUrl,
          clientId,
          clientSecret,
        });
      } else {
        await updateProgress(15, 'Warning: Optimizely credentials not configured. Running in simulation mode.', 'warning');
      }
    }
    
    // Create sync orchestrator
    const orchestrator = new SyncOrchestrator(
      extractor,
      storage,
      transformer,
      apiClient
    );
    
    // Set dry-run mode if no API client
    if (!apiClient) {
      orchestrator.setDryRun(true);
    }

    if (await checkCancelled()) {
      throw new Error('Deployment cancelled by user');
    }

    // Execute sync with progress updates
    await updateProgress(20, 'Extracting content types from database...');
    
    // Start the sync process
    const syncResult = await orchestrator.sync({
      websiteId: deployment.websiteId,
    });
    
    if (await checkCancelled()) {
      throw new Error('Deployment cancelled by user');
    }
    
    // Update progress based on sync results
    if (syncResult.success) {
      const stats = syncResult.statistics;
      
      await updateProgress(40, `Extracted ${stats.extracted} content types`);
      await updateProgress(60, `Transformed ${stats.transformed} content types`);
      
      if (stats.created > 0) {
        await updateProgress(80, `Created ${stats.created} content types in ${provider.name}`);
      }
      if (stats.updated > 0) {
        await updateProgress(85, `Updated ${stats.updated} content types in ${provider.name}`);
      }
      if (stats.skipped > 0) {
        await updateProgress(90, `Skipped ${stats.skipped} unchanged content types`);
      }
      if (stats.errors > 0) {
        await updateProgress(95, `Encountered ${stats.errors} errors during sync`, 'warning');
      }
      
      await updateProgress(100, 'Deployment completed successfully!');
      
      // Mark as completed
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { 
          status: 'completed',
          deployedAt: new Date(),
        },
      });
    } else {
      throw new Error(syncResult.error || 'Sync failed');
    }
  } catch (error) {
    // Update deployment as failed
    const errorMessage = error instanceof Error ? error.message : 'Deployment failed';
    
    await updateProgress(
      0, 
      errorMessage,
      'error'
    );
    
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'failed',
        errorMessage: errorMessage,
      },
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

  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    
    if (!deployment) {
      return NextResponse.json(
        { success: false, error: 'Deployment not found' },
        { status: 404 }
      );
    }

    const deploymentDataObj = deployment.deploymentData as any || {};
    
    return NextResponse.json({ 
      success: true, 
      job: {
        id: deployment.id,
        websiteId: deployment.websiteId,
        provider: deployment.provider,
        status: deployment.status,
        progress: deploymentDataObj.progress || 0,
        logs: deploymentDataObj.logs || [],
        startedAt: deployment.createdAt,
        completedAt: deployment.updatedAt,
        error: deployment.errorMessage,
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get deployment:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve deployment' },
      { status: 500 }
    );
  }
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

  try {
    // Cancel the deployment
    const currentDeployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    
    const deploymentDataObj = currentDeployment?.deploymentData as any || {};
    const cancelLogs: any[] = deploymentDataObj.logs || [];
    cancelLogs.push({
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: 'Deployment cancelled by user',
    });
    
    deploymentDataObj.logs = cancelLogs;
    
    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'cancelled',
        deploymentData: deploymentDataObj,
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { success: false, error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to cancel deployment:', error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel deployment' },
      { status: 500 }
    );
  }
}