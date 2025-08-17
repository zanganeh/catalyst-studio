import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { VersionHistoryManager, VersionHistoryOptions } from '@/lib/sync/versioning/VersionHistoryManager';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ typeKey: string }> }
) {
  try {
    const { typeKey } = await params;
    const url = new URL(request.url);
    const author = url.searchParams.get('author');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const source = url.searchParams.get('source') as 'UI' | 'AI' | 'SYNC' | null;
    const limit = url.searchParams.get('limit');

    const versionManager = new VersionHistoryManager(prisma);
    
    const options: VersionHistoryOptions = {};
    
    if (author) {
      options.author = author;
    }
    
    if (startDate && endDate) {
      options.dateRange = {
        start: startDate,
        end: endDate
      };
    }
    
    if (source) {
      options.source = source;
    }
    
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const history = await versionManager.getVersionHistory(typeKey, options);

    return NextResponse.json({
      success: true,
      typeKey,
      versions: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch version history'
      },
      { status: 500 }
    );
  }
}