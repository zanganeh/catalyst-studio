import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { UpdatePageDto, DeleteOptions } from '@/lib/types/page-orchestrator.types';

export async function GET(
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
    const result = await pageOrchestrator.getPage(resolvedParams.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get page' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body: UpdatePageDto = await request.json();
    const result = await pageOrchestrator.updatePage(resolvedParams.id, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating page:', error);

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Duplicate') || errorMessage.includes('already exists')) {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    if (errorMessage.includes('Invalid slug')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json(
      { error: errorMessage || 'Failed to update page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    // Parse delete options from query params
    const url = new URL(request.url);
    const options: DeleteOptions = {
      cascade: url.searchParams.get('cascade') === 'true',
      orphanChildren: url.searchParams.get('orphanChildren') === 'true',
      deleteContent: url.searchParams.get('deleteContent') !== 'false'
    };

    await pageOrchestrator.deletePage(resolvedParams.id, options);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting page:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    if (errorMessage.includes('has children')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: errorMessage || 'Failed to delete page' },
      { status: 500 }
    );
  }
}