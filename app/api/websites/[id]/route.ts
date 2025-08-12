import { NextRequest } from 'next/server';
import { getClient } from '@/lib/db/client';
import { UpdateWebsiteSchema } from '@/lib/api/validation/website';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { z } from 'zod';

/**
 * GET /api/websites/[id]
 * Retrieve a single website by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getClient();
    const website = await prisma.website.findUnique({
      where: { id: params.id }
    });
    
    if (!website) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    // Parse JSON metadata for response
    const formattedWebsite = {
      ...website,
      metadata: website.metadata ? JSON.parse(website.metadata) : null
    };
    
    return Response.json({ data: formattedWebsite });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/websites/[id]
 * Update a website
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = UpdateWebsiteSchema.parse(body);
    
    const prisma = getClient();
    
    // Check if website exists
    const existing = await prisma.website.findUnique({
      where: { id: params.id }
    });
    
    if (!existing) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    // Convert metadata to JSON string for storage
    const dataToUpdate = {
      ...validated,
      metadata: validated.metadata !== undefined 
        ? (validated.metadata ? JSON.stringify(validated.metadata) : null)
        : undefined
    };
    
    // Update website
    const website = await prisma.website.update({
      where: { id: params.id },
      data: dataToUpdate
    });
    
    // Parse JSON metadata for response
    const formattedWebsite = {
      ...website,
      metadata: website.metadata ? JSON.parse(website.metadata) : null
    };
    
    return Response.json({ data: formattedWebsite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/websites/[id]
 * Delete a website
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getClient();
    
    // Use deleteMany which returns count - more efficient than check + delete
    const result = await prisma.website.delete({
      where: { id: params.id }
    });
    
    if (!result) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    return Response.json({ data: { message: 'Website deleted successfully' } });
  } catch (error) {
    // Prisma throws P2025 when trying to delete non-existent record
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2025') {
        throw new ApiError(404, 'Website not found', 'NOT_FOUND');
      }
    }
    return handleApiError(error);
  }
}