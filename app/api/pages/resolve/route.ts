import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when auth is set up
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const websiteId = request.headers.get('x-website-id');
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required in x-website-id header' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    const result = await pageOrchestrator.resolveUrl(path, websiteId);

    if (!result) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resolving URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve URL' },
      { status: 500 }
    );
  }
}