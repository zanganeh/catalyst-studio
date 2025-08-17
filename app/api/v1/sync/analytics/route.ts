import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { SyncAnalytics } from '@/lib/sync/tracking/SyncAnalytics';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform') || 'optimizely';
    const typeKey = url.searchParams.get('typeKey');
    const reportType = url.searchParams.get('type') || 'health';
    
    const analytics = new SyncAnalytics(prisma);
    
    switch (reportType) {
      case 'health':
        const healthReport = await analytics.generateHealthReport(platform);
        return NextResponse.json(healthReport);
        
      case 'metrics':
        const metrics = await analytics.getSyncMetrics(typeKey || undefined, platform);
        return NextResponse.json({ data: metrics });
        
      case 'failures':
        const failurePatterns = await analytics.detectFailurePatterns();
        return NextResponse.json({ patterns: failurePatterns });
        
      case 'success-rate':
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        const timeRange = startDate && endDate ? {
          start: new Date(startDate),
          end: new Date(endDate)
        } : undefined;
        
        const successRate = await analytics.calculateSuccessRate(platform, timeRange);
        const avgSyncTime = await analytics.getAverageSyncTime(platform);
        
        return NextResponse.json({
          platform,
          successRate,
          averageSyncTime: avgSyncTime,
          timeRange
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}