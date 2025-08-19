import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { SyncHistoryManager } from '@/lib/sync/tracking/SyncHistoryManager';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ syncId: string }> }
) {
  try {
    const { syncId } = await params;
    const syncManager = new SyncHistoryManager(prisma);
    const syncRecord = await syncManager.getSyncById(syncId);
    
    if (!syncRecord) {
      return NextResponse.json(
        { error: 'Sync record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(syncRecord);
  } catch (error) {
    console.error('Error fetching sync record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync record' },
      { status: 500 }
    );
  }
}