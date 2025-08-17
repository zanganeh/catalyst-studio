import { NextRequest, NextResponse } from 'next/server';
import { DeploymentService } from '@/lib/services/deployment-service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/sync/changes
 * Returns change detection summary comparing local and remote content types
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') || 'optimizely';
    const contentTypes = searchParams.get('contentTypes');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
    // Parse content type keys if provided
    const contentTypeKeys = contentTypes ? contentTypes.split(',') : undefined;
    
    // Initialize deployment service
    const deploymentService = new DeploymentService(prisma, provider);
    
    // Get change summary
    const changeSummary = await deploymentService.getChangeSummary(contentTypeKeys);
    
    // Format response based on requested detail level
    const response = {
      provider,
      timestamp: new Date().toISOString(),
      summary: changeSummary.summary || {
        total: changeSummary.summary?.total || 0,
        created: changeSummary.summary?.created || 0,
        updated: changeSummary.summary?.updated || 0,
        deleted: changeSummary.summary?.deleted || 0,
        unchanged: changeSummary.summary?.unchanged || 0
      }
    };
    
    if (includeDetails) {
      response.details = changeSummary.details || changeSummary.details;
    }
    
    // Calculate estimated sync time (rough estimate: 2 seconds per change)
    response.estimatedSyncTime = (response.summary.total || 0) * 2;
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in /api/v1/sync/changes:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to detect changes',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sync/changes/detect
 * Trigger change detection for specific content types
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider = 'optimizely', contentTypeKeys = [], forceRefresh = false } = body;
    
    // Validate input
    if (!Array.isArray(contentTypeKeys)) {
      return NextResponse.json(
        { error: 'contentTypeKeys must be an array' },
        { status: 400 }
      );
    }
    
    // Initialize deployment service
    const deploymentService = new DeploymentService(prisma, provider);
    
    // Detect changes
    let changes;
    if (contentTypeKeys.length > 0) {
      // Batch detection for specific types
      changes = await deploymentService.getChangeSummary(contentTypeKeys);
    } else {
      // Full change detection
      changes = await deploymentService.detectChanges();
    }
    
    // Store in database if requested
    if (body.persistResults) {
      // This will be implemented in the database persistence task
      console.log('Persistence requested but not yet implemented');
    }
    
    return NextResponse.json({
      success: true,
      provider,
      timestamp: new Date().toISOString(),
      changes
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in POST /api/v1/sync/changes/detect:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to execute change detection',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}