import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentItem, ContentItemsResponse, ContentStatus } from '@/types/api';
import { Prisma } from '@/lib/generated/prisma';
import { validateContentItemsQuery, validateCreateContentItem } from '@/lib/api/validation/content-item';
import { safeJsonParse } from '@/lib/utils/safe-json';
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
    // Filter by websiteId
    if (websiteId) {
      where.websiteId = websiteId;
    }
    
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
        contentType: {
          include: {
            website: true
          }
        },
      },
    });
    
    // Transform items - Json fields are already parsed by Prisma
    const transformedItems: ContentItem[] = items.map(item => ({
      id: item.id,
      contentTypeId: item.contentTypeId,
      websiteId: item.websiteId,
      title: item.title,
      slug: item.slug,
      content: (item.content as Record<string, any>) || {}, // Cast to proper type
      metadata: item.metadata as Record<string, any> | undefined,
      status: item.status as ContentStatus, // Cast status to ContentStatus type
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      contentType: item.contentType,
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
    // Handle empty body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: { message: 'Content-Type must be application/json' } },
        { status: 400 }
      );
    }

    let body;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json(
          { error: { message: 'Request body is required' } },
          { status: 400 }
        );
      }
      body = safeJsonParse(text, {});
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: { message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validation = validateCreateContentItem(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { message: 'Invalid request body', details: validation.error.errors } },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // Create content item - Prisma will handle JSON serialization for Json fields
    const contentItem = await prisma.contentItem.create({
      data: {
        contentTypeId: validatedData.contentTypeId,
        websiteId: validatedData.websiteId,
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content, // Prisma handles JSON serialization for Json type fields
        metadata: validatedData.metadata,
        status: validatedData.status || 'draft',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
      },
      include: {
        contentType: true,
        website: true,
      },
    });
    
    // Transform response - all Json fields are already parsed by Prisma
    const transformed = {
      ...contentItem,
      content: contentItem.content || {},
      metadata: contentItem.metadata,
      contentType: contentItem.contentType,
      website: contentItem.website,
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