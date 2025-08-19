import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ syncId: string }> }
) {
  try {
    const { syncId } = await params;
    const syncRecord = await prisma.syncHistory.findUnique({
      where: { id: syncId },
      select: {
        id: true,
        status: true,
        syncType: true,
        sourceSystem: true,
        targetSystem: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true
      }
    });
    
    if (!syncRecord) {
      return NextResponse.json(
        { error: 'Sync record not found' },
        { status: 404 }
      );
    }
    
    // Calculate progress percentage for in-progress syncs
    let progress = 0;
    if (syncRecord.status === 'IN_PROGRESS') {
      // Simple time-based progress estimation
      const elapsed = Date.now() - syncRecord.startedAt.getTime();
      const estimatedDuration = 30000; // 30 seconds estimated
      progress = Math.min(95, Math.round((elapsed / estimatedDuration) * 100));
    } else if (syncRecord.status === 'SUCCESS') {
      progress = 100;
    } else if (syncRecord.status === 'FAILED') {
      progress = 0;
    }
    
    return NextResponse.json({
      ...syncRecord,
      progress
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}