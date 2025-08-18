import { NextRequest, NextResponse } from 'next/server';
import { AIContextService } from '@/lib/services/ai-context-service';
import { UpdateAIContextSchema } from '@/lib/api/validation/ai-context';
import { handleApiError } from '@/lib/api/errors';

// GET /api/ai-context/[sessionId] - Retrieve specific session context
export async function GET(
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
    
    const context = await AIContextService.getAIContext(websiteId, sessionId);
    
    if (!context) {
      return NextResponse.json(
        { error: { message: 'AI context not found' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: context });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/ai-context/[sessionId] - Update context (append messages)
export async function PUT(
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
    const validation = UpdateAIContextSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const { messages, metadata, summary, isActive } = validation.data;
    
    // Get existing context
    const context = await AIContextService.getAIContext(websiteId, sessionId);
    
    if (!context) {
      return NextResponse.json(
        { error: { message: 'AI context not found' } },
        { status: 404 }
      );
    }
    
    // For now, we'll update via direct prisma call since service doesn't have full update
    const { prisma } = await import('@/lib/prisma');
    
    const currentContext = context.context || {};
    const updateContext: Record<string, unknown> = { ...currentContext };
    if (messages !== undefined) updateContext.messages = messages;
    if (summary !== undefined) updateContext.summary = summary;
    if (isActive !== undefined) updateContext.isActive = isActive;
    
    const updateData: Record<string, unknown> = {
      context: updateContext
    };
    if (metadata !== undefined) updateData.metadata = metadata;
    
    const updated = await prisma.aIContext.update({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      },
      data: updateData
    });
    
    const contextData = updated.context as any || {};
    const transformedContext = {
      id: updated.id,
      websiteId: updated.websiteId,
      sessionId: updated.sessionId,
      messages: contextData.messages || [],
      metadata: updated.metadata || undefined,
      summary: contextData.summary || undefined,
      isActive: contextData.isActive !== false,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
    
    return NextResponse.json({ data: transformedContext });
    
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/ai-context/[sessionId] - Soft delete context session
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
    
    await AIContextService.deleteContext(websiteId, sessionId);
    
    return NextResponse.json({ data: { success: true } });
    
  } catch (error) {
    return handleApiError(error);
  }
}