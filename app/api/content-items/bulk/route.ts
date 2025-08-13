import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateContentItemRequest } from '@/types/api';

// POST /api/content-items/bulk - Bulk create/update content items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: CreateContentItemRequest[] };
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: { message: 'Items array is required and must not be empty' } },
        { status: 400 }
      );
    }
    
    // Validate all items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.contentTypeId || !item.websiteId || !item.data) {
        return NextResponse.json(
          { error: { message: `Item at index ${i} missing required fields` } },
          { status: 400 }
        );
      }
    }
    
    // Perform bulk create using transaction
    const createdItems = await prisma.$transaction(
      items.map(item => 
        prisma.contentItem.create({
          data: {
            contentTypeId: item.contentTypeId,
            websiteId: item.websiteId,
            slug: item.slug || undefined,
            data: JSON.stringify(item.data),
            metadata: item.metadata ? JSON.stringify(item.metadata) : undefined,
            status: item.status || 'draft',
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
          },
        })
      )
    );
    
    // Transform response
    const transformedItems = createdItems.map(item => ({
      ...item,
      data: JSON.parse(item.data),
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
    }));
    
    return NextResponse.json({ 
      data: transformedItems,
      message: `Successfully created ${createdItems.length} content items` 
    }, { status: 201 });
  } catch (error) {
    console.error('Error bulk creating content items:', error);
    return NextResponse.json(
      { error: { message: 'Failed to bulk create content items' } },
      { status: 500 }
    );
  }
}

// DELETE /api/content-items/bulk - Bulk archive content items
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: { message: 'IDs array is required and must not be empty' } },
        { status: 400 }
      );
    }
    
    // Perform bulk soft delete (archive)
    const result = await prisma.contentItem.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'archived',
      },
    });
    
    return NextResponse.json({ 
      data: { 
        count: result.count,
        message: `Successfully archived ${result.count} content items` 
      } 
    });
  } catch (error) {
    console.error('Error bulk archiving content items:', error);
    return NextResponse.json(
      { error: { message: 'Failed to bulk archive content items' } },
      { status: 500 }
    );
  }
}