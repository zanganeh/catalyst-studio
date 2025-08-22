import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { CreatePageDto } from '@/lib/types/page-orchestrator.types';
import { 
  DuplicateSlugError, 
  InvalidSlugError,
  OrphanedNodeError 
} from '@/lib/services/site-structure/errors';

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
    if (error instanceof DuplicateSlugError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof InvalidSlugError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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

    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const includeContent = url.searchParams.get('includeContent') !== 'false';

    const result = await pageOrchestrator.listPages(websiteId, {
      parentId: parentId === 'null' ? null : parentId,
      limit: Math.min(limit, 100), // Cap at 100 items
      offset,
      includeContent
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing pages:', error);
    
    if (error instanceof OrphanedNodeError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list pages' },
      { status: 500 }
    );
  }
}