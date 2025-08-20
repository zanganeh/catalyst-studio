import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { validateUpdateContentItem } from '@/lib/api/validation/content-item';

// GET /api/content-items/[id] - Get a single content item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentItem = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        contentType: true,
        website: true,
      },
    });
    
    if (!contentItem) {
      return NextResponse.json(
        { error: { message: 'Content item not found' } },
        { status: 404 }
      );
    }
    
    // Transform response - Json fields are already parsed by Prisma
    const transformed = {
      ...contentItem,
      content: contentItem.content,
      metadata: contentItem.metadata,
      contentType: {
        ...contentItem.contentType,
        fields: contentItem.contentType.fields,
      },
      website: {
        ...contentItem.website,
        metadata: contentItem.website.metadata,
        settings: contentItem.website.settings,
      },
    };
    
    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error('Error fetching content item:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch content item' } },
      { status: 500 }
    );
  }
}

// PUT /api/content-items/[id] - Update a content item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate request body
    const validation = validateUpdateContentItem(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // Check if item exists
    const existing = await prisma.contentItem.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Content item not found' } },
        { status: 404 }
      );
    }
    
    // Prepare update data with proper typing
    const updateData: Prisma.ContentItemUpdateInput = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.publishedAt !== undefined) {
      updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : null;
    }
    
    // Update content item
    const contentItem = await prisma.contentItem.update({
      where: { id },
      data: updateData,
      include: {
        contentType: true,
        website: true,
      },
    });
    
    // Transform response - Json fields are already parsed by Prisma
    const transformed = {
      ...contentItem,
      content: contentItem.content,
      metadata: contentItem.metadata,
      contentType: {
        ...contentItem.contentType,
        fields: contentItem.contentType.fields,
      },
      website: {
        ...contentItem.website,
        metadata: contentItem.website.metadata,
        settings: contentItem.website.settings,
      },
    };
    
    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error('Error updating content item:', error);
    return NextResponse.json(
      { error: { message: 'Failed to update content item' } },
      { status: 500 }
    );
  }
}

// DELETE /api/content-items/[id] - Soft delete a content item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if item exists
    const existing = await prisma.contentItem.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Content item not found' } },
        { status: 404 }
      );
    }
    
    // Soft delete by setting status to archived
    const contentItem = await prisma.contentItem.update({
      where: { id },
      data: { status: 'archived' },
    });
    
    return NextResponse.json({ 
      data: { 
        id: contentItem.id, 
        status: contentItem.status,
        message: 'Content item archived successfully' 
      } 
    });
  } catch (error) {
    console.error('Error deleting content item:', error);
    return NextResponse.json(
      { error: { message: 'Failed to delete content item' } },
      { status: 500 }
    );
  }
}