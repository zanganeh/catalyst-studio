import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager, SyncHistoryFilters, SyncStatus } from '@/lib/sync/tracking/SyncHistoryManager';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ typeKey: string }> }
) {
  try {
    const { typeKey } = await params;
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const syncManager = new SyncHistoryManager(prisma);
    
    const filters: SyncHistoryFilters = {
      typeKey: typeKey
    };
    
    if (platform) filters.targetPlatform = platform;
    if (status) filters.syncStatus = status as SyncStatus;
    
    const history = await syncManager.getSyncHistory(filters);
    
    // Apply pagination
    const paginatedHistory = history.slice(offset, offset + limit);
    
    // Get last successful sync for this type
    const lastSuccess = platform 
      ? await syncManager.getLastSuccessfulSync(typeKey, platform)
      : null;
    
    return NextResponse.json({
      typeKey: typeKey,
      data: paginatedHistory,
      total: history.length,
      limit,
      offset,
      hasMore: offset + limit < history.length,
      lastSuccessfulSync: lastSuccess
    });
  } catch (error) {
    console.error('Error fetching type-specific sync history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history for type' },
      { status: 500 }
    );
  }
}