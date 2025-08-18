import { NextRequest, NextResponse } from 'next/server';

export interface SyncAnalytics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageDuration: number;
  conflictsPerSync: number;
  validationErrorsPerSync: number;
  mostSyncedContentTypes: Array<{
    contentTypeId: string;
    name: string;
    count: number;
  }>;
  syncVolumeOverTime: Array<{
    date: string;
    count: number;
    successful: number;
    failed: number;
  }>;
  recentSyncs: Array<{
    id: string;
    timestamp: string;
    status: 'success' | 'failed';
    duration: number;
    conflicts: number;
    validationErrors: number;
  }>;
}

const mockAnalytics: SyncAnalytics = {
  totalSyncs: 150,
  successfulSyncs: 142,
  failedSyncs: 8,
  successRate: 94.7,
  averageDuration: 3200,
  conflictsPerSync: 0.3,
  validationErrorsPerSync: 0.5,
  mostSyncedContentTypes: [
    { contentTypeId: 'ct-pages', name: 'Pages', count: 45 },
    { contentTypeId: 'ct-articles', name: 'Articles', count: 38 },
    { contentTypeId: 'ct-products', name: 'Products', count: 32 }
  ],
  syncVolumeOverTime: [
    { date: '2025-01-14', count: 12, successful: 11, failed: 1 },
    { date: '2025-01-15', count: 18, successful: 17, failed: 1 },
    { date: '2025-01-16', count: 15, successful: 14, failed: 1 },
    { date: '2025-01-17', count: 20, successful: 19, failed: 1 },
    { date: '2025-01-18', count: 10, successful: 10, failed: 0 }
  ],
  recentSyncs: [
    {
      id: 'sync-001',
      timestamp: '2025-01-18T10:30:00Z',
      status: 'success',
      duration: 2800,
      conflicts: 0,
      validationErrors: 0
    },
    {
      id: 'sync-002',
      timestamp: '2025-01-18T09:15:00Z',
      status: 'success',
      duration: 3500,
      conflicts: 2,
      validationErrors: 1
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const contentTypeId = searchParams.get('contentTypeId');
    
    let analytics = { ...mockAnalytics };
    
    if (contentTypeId) {
      const contentTypeData = analytics.mostSyncedContentTypes.find(
        ct => ct.contentTypeId === contentTypeId
      );
      
      if (!contentTypeData) {
        return NextResponse.json(
          { error: 'Content type not found in analytics' },
          { status: 404 }
        );
      }
    }
    
    if (period === '24h') {
      analytics.syncVolumeOverTime = analytics.syncVolumeOverTime.slice(-1);
    } else if (period === '30d') {
      analytics.syncVolumeOverTime = [
        ...analytics.syncVolumeOverTime,
        ...Array(25).fill(null).map((_, i) => ({
          date: `2025-01-${(i + 1).toString().padStart(2, '0')}`,
          count: Math.floor(Math.random() * 25) + 5,
          successful: Math.floor(Math.random() * 20) + 5,
          failed: Math.floor(Math.random() * 3)
        }))
      ];
    }
    
    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve sync analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.syncId || !body.status) {
      return NextResponse.json(
        { error: 'Invalid analytics data' },
        { status: 400 }
      );
    }

    const newSync = {
      id: body.syncId,
      timestamp: new Date().toISOString(),
      status: body.status as 'success' | 'failed',
      duration: body.duration || 0,
      conflicts: body.conflicts || 0,
      validationErrors: body.validationErrors || 0
    };

    mockAnalytics.recentSyncs.unshift(newSync);
    mockAnalytics.recentSyncs = mockAnalytics.recentSyncs.slice(0, 10);
    
    mockAnalytics.totalSyncs++;
    if (body.status === 'success') {
      mockAnalytics.successfulSyncs++;
    } else {
      mockAnalytics.failedSyncs++;
    }
    
    mockAnalytics.successRate = (mockAnalytics.successfulSyncs / mockAnalytics.totalSyncs) * 100;
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = mockAnalytics.syncVolumeOverTime.find(d => d.date === today);
    if (todayData) {
      todayData.count++;
      if (body.status === 'success') {
        todayData.successful++;
      } else {
        todayData.failed++;
      }
    }
    
    return NextResponse.json({ message: 'Analytics recorded', sync: newSync }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}