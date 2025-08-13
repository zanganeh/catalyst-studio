import { NextRequest, NextResponse } from 'next/server';
import { AIContextService } from '@/lib/services/ai-context-service';
import { AppendMessageSchema } from '@/lib/api/validation/ai-context';
import { handleApiError } from '@/lib/api/errors';

// POST /api/ai-context/[sessionId]/messages - Append new message to context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const websiteId = request.nextUrl.searchParams.get('websiteId');
    
    if (!websiteId) {
      return NextResponse.json(
        { error: { message: 'websiteId is required' } },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = AppendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const { message, pruneIfNeeded } = validation.data;
    
    const context = await AIContextService.appendMessage(
      websiteId,
      sessionId,
      message,
      pruneIfNeeded
    );
    
    return NextResponse.json({ data: context });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/ai-context/[sessionId]/messages - Clear messages (keep session)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const websiteId = request.nextUrl.searchParams.get('websiteId');
    
    if (!websiteId) {
      return NextResponse.json(
        { error: { message: 'websiteId is required' } },
        { status: 400 }
      );
    }
    
    const context = await AIContextService.clearContext(websiteId, sessionId);
    
    return NextResponse.json({ data: context });
    
  } catch (error) {
    return handleApiError(error);
  }
}