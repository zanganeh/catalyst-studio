import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentItemsResponse, ContentStatus } from '@/types/api';
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
    const where: Prisma.ContentInstanceWhereInput = {};
    if (status) where.status = status;
    if (contentTypeId) where.contentTypeId = contentTypeId;
    // Filter by websiteId through contentType relationship
    if (websiteId) {
      where.contentType = {
        websiteId: websiteId
      };
    }
    
    // Get total count
    const total = await prisma.contentInstance.count({ where });
    
    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    // Fetch items with relations
    const items = await prisma.contentInstance.findMany({
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
    
    // Transform items - data field is already parsed by Prisma (Json type)
    const transformedItems = items.map(item => ({
      id: item.id,
      contentTypeId: item.contentTypeId,
      websiteId: item.contentType.websiteId, // Get websiteId from contentType
      data: item.data || {}, // Prisma Json fields are automatically parsed
      status: item.status as ContentStatus, // Cast status to ContentStatus type
      version: item.version,
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
    const contentItem = await prisma.contentInstance.create({
      data: {
        contentTypeId: validatedData.contentTypeId,
        data: validatedData.data, // Prisma handles JSON serialization for Json type fields
        status: validatedData.status || 'draft',
      },
      include: {
        contentType: {
          include: {
            website: true
          }
        },
      },
    });
    
    // Transform response - all Json fields are already parsed by Prisma
    const transformed = {
      ...contentItem,
      data: contentItem.data || {},
      contentType: {
        ...contentItem.contentType,
        fields: contentItem.contentType.fields || [],
        settings: contentItem.contentType.schema || null,
      },
      website: contentItem.contentType.website ? {
        ...contentItem.contentType.website,
        metadata: contentItem.contentType.website.metadata || null,
      } : undefined,
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