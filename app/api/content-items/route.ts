import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentItemsQuery, ContentItemsResponse, CreateContentItemRequest } from '@/types/api';

// GET /api/content-items - Get paginated content items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || undefined;
    const contentTypeId = searchParams.get('contentTypeId') || undefined;
    const websiteId = searchParams.get('websiteId') || undefined;
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (contentTypeId) where.contentTypeId = contentTypeId;
    if (websiteId) where.websiteId = websiteId;
    
    // Get total count
    const total = await prisma.contentItem.count({ where });
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    // Fetch items with relations
    const items = await prisma.contentItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        contentType: true,
        website: true,
      },
    });
    
    // Transform data field from string to JSON
    const transformedItems = items.map(item => ({
      ...item,
      data: item.data ? JSON.parse(item.data) : {},
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
      contentType: item.contentType ? {
        ...item.contentType,
        fields: item.contentType.fields ? JSON.parse(item.contentType.fields) : [],
        settings: item.contentType.settings ? JSON.parse(item.contentType.settings) : null,
      } : undefined,
      website: item.website ? {
        ...item.website,
        metadata: item.website.metadata ? JSON.parse(item.website.metadata) : null,
      } : undefined,
    }));
    
    const response: ContentItemsResponse = {
      data: transformedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch content items' } },
      { status: 500 }
    );
  }
}

// POST /api/content-items - Create a new content item
export async function POST(request: NextRequest) {
  try {
    const body: CreateContentItemRequest = await request.json();
    
    // Validate required fields
    if (!body.contentTypeId || !body.websiteId || !body.data) {
      return NextResponse.json(
        { error: { message: 'Missing required fields: contentTypeId, websiteId, and data are required' } },
        { status: 400 }
      );
    }
    
    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        contentTypeId: body.contentTypeId,
        websiteId: body.websiteId,
        slug: body.slug || undefined,
        data: JSON.stringify(body.data),
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
        status: body.status || 'draft',
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      },
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
    
    return NextResponse.json({ data: transformed }, { status: 201 });
  } catch (error) {
    console.error('Error creating content item:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create content item' } },
      { status: 500 }
    );
  }
}