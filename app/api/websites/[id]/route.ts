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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getClient();
    const website = await prisma.website.findUnique({
      where: { id }
    });
    
    if (!website) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    // Format website for response (metadata and settings are already JSON)
    const formattedWebsite = {
      ...website,
      metadata: website.metadata || null,
      settings: website.settings || null
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateWebsiteSchema.parse(body);
    
    const prisma = getClient();
    
    // Check if website exists
    const existing = await prisma.website.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    // Prepare data - metadata and settings are already JSON type
    const dataToUpdate = {
      ...validated,
      metadata: validated.metadata !== undefined 
        ? validated.metadata
        : undefined,
      settings: validated.settings !== undefined
        ? validated.settings
        : undefined
    };
    
    // Update website
    const website = await prisma.website.update({
      where: { id },
      data: dataToUpdate
    });
    
    // Format website for response (metadata and settings are already JSON)
    const formattedWebsite = {
      ...website,
      metadata: website.metadata || null,
      settings: website.settings || null
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
 * Soft delete a website by setting isActive to false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getClient();
    
    // Soft delete by setting isActive to false
    const result = await prisma.website.update({
      where: { id },
      data: { isActive: false }
    });
    
    if (!result) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    return Response.json({ data: { message: 'Website deleted successfully' } });
  } catch (error) {
    // Prisma throws P2025 when trying to update non-existent record
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2025') {
        return handleApiError(new ApiError(404, 'Website not found', 'NOT_FOUND'));
      }
    }
    return handleApiError(error);
  }
}