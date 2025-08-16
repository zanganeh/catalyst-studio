import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { DatabaseExtractor } from '@/lib/sync/extractors/database-extractor';
import { OptimizelyTransformer } from '@/lib/sync/transformers/optimizely-transformer';
import { OptimizelyApiClient } from '@/lib/sync/adapters/optimizely-api-client';
import { SyncOrchestrator } from '@/lib/sync/engine/sync-orchestrator';
import { DatabaseStorage } from '@/lib/sync/storage/database-storage';
import { startDeploymentSchema } from '@/lib/api/validation/deployment';
import { safeJsonParse } from '@/lib/utils/safe-json';
import { withTransaction } from '@/lib/sync/utils/transaction-manager';
import { validateCSRFToken } from '@/lib/security/csrf';

interface CMSProviderInfo {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
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
          providerId: provider.id,
          providerName: provider.name,
          selectedTypes: JSON.stringify(selectedTypes || []),
          status: 'pending',
          progress: 0,
          logs: JSON.stringify([]),
          startedAt: new Date(),
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
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      deploymentId,
      deployment: {
        id: deployment.id,
        status: deployment.status,
        progress: deployment.progress,
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
    
    const logs: any[] = deployment?.logs ? safeJsonParse(deployment.logs, []) || [] : [];
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    
    // Use transaction for atomic update
    await withTransaction(async (tx) => {
      await tx.deployment.update({
        where: { id: deploymentId },
        data: { 
          progress,
          logs: JSON.stringify(logs),
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
        selectedTypes: true,
      },
    });
    
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // Update status to running
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'running',
        progress: 5,
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
          completedAt: new Date(),
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
        completedAt: new Date(),
        error: errorMessage,
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

    return NextResponse.json({ 
      success: true, 
      job: {
        id: deployment.id,
        websiteId: deployment.websiteId,
        providerId: deployment.providerId,
        status: deployment.status,
        progress: deployment.progress,
        logs: safeJsonParse(deployment.logs, []),
        startedAt: deployment.startedAt,
        completedAt: deployment.completedAt,
        error: deployment.error,
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
  // Validate CSRF token
  const isValidCSRF = await validateCSRFToken(request);
  if (!isValidCSRF) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
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
    
    const cancelLogs: any[] = currentDeployment?.logs ? safeJsonParse(currentDeployment.logs, []) || [] : [];
    cancelLogs.push({
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: 'Deployment cancelled by user',
    });
    
    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: { 
        status: 'cancelled',
        completedAt: new Date(),
        logs: JSON.stringify(cancelLogs),
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