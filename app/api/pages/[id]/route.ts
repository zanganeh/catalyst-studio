import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { UpdatePageDto, DeleteOptions } from '@/lib/types/page-orchestrator.types';

export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: { id: string } }
) {
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

    // Get page by structure ID
    // This can be enhanced to fetch the page data
    // For now using resolveUrl internally would need adjustment
    return NextResponse.json(
      { error: 'Get page by ID not yet implemented' },
      { status: 501 }
    );
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
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication when auth is set up
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body: UpdatePageDto = await request.json();
    const result = await pageOrchestrator.updatePage(params.id, body);

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
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add authentication when auth is set up
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse delete options from query params
    const url = new URL(request.url);
    const options: DeleteOptions = {
      cascade: url.searchParams.get('cascade') === 'true',
      orphanChildren: url.searchParams.get('orphanChildren') === 'true',
      deleteContent: url.searchParams.get('deleteContent') !== 'false'
    };

    await pageOrchestrator.deletePage(params.id, options);

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