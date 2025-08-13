import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateContentItemRequest } from '@/types/api';

// GET /api/content-items/[id] - Get a single content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: params.id },
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
    
    // Transform response
    const transformed = {
      ...contentItem,
      data: JSON.parse(contentItem.data),
      metadata: contentItem.metadata ? JSON.parse(contentItem.metadata) : null,
      contentType: {
        ...contentItem.contentType,
        fields: JSON.parse(contentItem.contentType.fields),
        settings: contentItem.contentType.settings ? JSON.parse(contentItem.contentType.settings) : null,
      },
      website: {
        ...contentItem.website,
        metadata: contentItem.website.metadata ? JSON.parse(contentItem.website.metadata) : null,
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
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateContentItemRequest = await request.json();
    
    // Check if item exists
    const existing = await prisma.contentItem.findUnique({
      where: { id: params.id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Content item not found' } },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.data !== undefined) updateData.data = JSON.stringify(body.data);
    if (body.metadata !== undefined) updateData.metadata = JSON.stringify(body.metadata);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.publishedAt !== undefined) {
      updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }
    
    // Update content item
    const contentItem = await prisma.contentItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contentType: true,
        website: true,
      },
    });
    
    // Transform response
    const transformed = {
      ...contentItem,
      data: JSON.parse(contentItem.data),
      metadata: contentItem.metadata ? JSON.parse(contentItem.metadata) : null,
      contentType: {
        ...contentItem.contentType,
        fields: JSON.parse(contentItem.contentType.fields),
        settings: contentItem.contentType.settings ? JSON.parse(contentItem.contentType.settings) : null,
      },
      website: {
        ...contentItem.website,
        metadata: contentItem.website.metadata ? JSON.parse(contentItem.website.metadata) : null,
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
  { params }: { params: { id: string } }
) {
  try {
    // Check if item exists
    const existing = await prisma.contentItem.findUnique({
      where: { id: params.id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Content item not found' } },
        { status: 404 }
      );
    }
    
    // Soft delete by setting status to archived
    const contentItem = await prisma.contentItem.update({
      where: { id: params.id },
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