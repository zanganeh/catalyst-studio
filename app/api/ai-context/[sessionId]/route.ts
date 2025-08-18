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
    
    const updateData: Record<string, unknown> = {};
    if (messages !== undefined) updateData.messages = JSON.stringify(messages);
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
    if (summary !== undefined) updateData.summary = summary;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updated = await prisma.aiContext.update({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      },
      data: updateData
    });
    
    const transformedContext = {
      id: updated.id,
      websiteId: updated.websiteId,
      sessionId: updated.sessionId,
      messages: JSON.parse(updated.messages || '[]'),
      metadata: updated.metadata ? JSON.parse(updated.metadata) : undefined,
      summary: updated.summary,
      isActive: updated.isActive,
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