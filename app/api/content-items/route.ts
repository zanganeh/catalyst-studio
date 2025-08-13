import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentItemsResponse, ContentStatus } from '@/types/api';
import { Prisma } from '@/lib/generated/prisma';
import { validateContentItemsQuery, validateCreateContentItem } from '@/lib/api/validation/content-item';

// GET /api/content-items - Get paginated content items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Validate query parameters
    const validation = validateContentItemsQuery(searchParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid query parameters', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const { page, limit, status, contentTypeId, websiteId, sortBy, sortOrder } = validation.data;
    
    // Build where clause with proper typing
    const where: Prisma.ContentItemWhereInput = {};
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
      id: item.id,
      contentTypeId: item.contentTypeId,
      websiteId: item.websiteId,
      slug: item.slug || undefined, // Convert null to undefined for type compatibility
      data: item.data ? JSON.parse(item.data) : {},
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
      status: item.status as ContentStatus, // Cast status to ContentStatus type
      publishedAt: item.publishedAt || undefined, // Convert null to undefined
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
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
    const body = await request.json();
    
    // Validate request body
    const validation = validateCreateContentItem(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        contentTypeId: validatedData.contentTypeId,
        websiteId: validatedData.websiteId,
        slug: validatedData.slug || undefined,
        data: JSON.stringify(validatedData.data),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
        status: validatedData.status || 'draft',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
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