import { NextRequest, NextResponse } from 'next/server';
import { AIContextService } from '@/lib/services/ai-context-service';
import { CreateAIContextSchema, GetAIContextsSchema } from '@/lib/api/validation/ai-context';
import { handleApiError } from '@/lib/api/errors';

// GET /api/ai-context - List contexts by websiteId
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Validate query parameters
    const validation = GetAIContextsSchema.safeParse({
      websiteId: searchParams.get('websiteId'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid query parameters', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const { websiteId, limit, offset, isActive } = validation.data;
    
    const result = await AIContextService.getAIContexts(websiteId, {
      limit,
      offset,
      isActive
    });
    
    return NextResponse.json({ data: result });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/ai-context - Create new context session
export async function POST(request: NextRequest) {
  try {
    // Add body parsing error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: { message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validation = CreateAIContextSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const { websiteId, sessionId, initialMessage } = validation.data;
    
    const context = await AIContextService.createAIContext(
      websiteId,
      initialMessage,
      sessionId
    );
    
    return NextResponse.json({ data: context }, { status: 201 });
    
  } catch (error) {
    return handleApiError(error);
  }
}