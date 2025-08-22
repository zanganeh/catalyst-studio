import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { CreatePageDto } from '@/lib/types/page-orchestrator.types';

export async function POST(request: NextRequest) {
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

    const body: CreatePageDto = await request.json();

    // Validate required fields
    if (!body.title || !body.contentTypeId) {
      return NextResponse.json(
        { error: 'Title and contentTypeId are required' },
        { status: 400 }
      );
    }

    const result = await pageOrchestrator.createPage(body, websiteId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);

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
      { error: errorMessage || 'Failed to create page' },
      { status: 500 }
    );
  }
}

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

    // This endpoint can be extended to list pages with pagination
    // For now, return method not implemented
    return NextResponse.json(
      { error: 'List pages not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error listing pages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list pages' },
      { status: 500 }
    );
  }
}