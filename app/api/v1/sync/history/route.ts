import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager, SyncStatus, SyncHistoryFilters } from '@/lib/sync/tracking/SyncHistoryManager';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const typeKey = url.searchParams.get('typeKey');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const deploymentId = url.searchParams.get('deploymentId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const syncManager = new SyncHistoryManager(prisma);
    
    const filters: SyncHistoryFilters = {};
    
    if (typeKey) filters.typeKey = typeKey;
    if (platform) filters.targetPlatform = platform;
    if (status) filters.syncStatus = status as SyncStatus;
    if (deploymentId) filters.deploymentId = deploymentId;
    
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }
    
    const history = await syncManager.getSyncHistory(filters);
    
    // Apply pagination
    const paginatedHistory = history.slice(offset, offset + limit);
    
    return NextResponse.json({
      data: paginatedHistory,
      total: history.length,
      limit,
      offset,
      hasMore: offset + limit < history.length
    });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}