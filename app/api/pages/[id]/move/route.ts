import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { MovePageDto } from '@/lib/types/page-orchestrator.types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add authentication when auth is set up
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const resolvedParams = await params;
    const body: MovePageDto = await request.json();
    const result = await pageOrchestrator.movePage(resolvedParams.id, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error moving page:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Circular')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json(
      { error: errorMessage || 'Failed to move page' },
      { status: 500 }
    );
  }
}