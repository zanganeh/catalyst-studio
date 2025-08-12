import { NextRequest } from 'next/server';
import { getClient } from '@/lib/db/client';
import { CreateWebsiteSchema } from '@/lib/api/validation/website';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { z } from 'zod';

/**
 * GET /api/websites
 * Retrieve all websites
 */
export async function GET() {
  try {
    const prisma = getClient();
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON metadata for response
    const formattedWebsites = websites.map(website => ({
      ...website,
      metadata: website.metadata ? JSON.parse(website.metadata) : null
    }));
    
    return Response.json({ data: formattedWebsites });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/websites
 * Create a new website
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWebsiteSchema.parse(body);
    
    const prisma = getClient();
    
    // Convert metadata to JSON string for storage
    const dataToStore = {
      ...validated,
      metadata: validated.metadata ? JSON.stringify(validated.metadata) : null
    };
    
    const website = await prisma.website.create({
      data: dataToStore
    });
    
    // Parse JSON metadata for response
    const formattedWebsite = {
      ...website,
      metadata: website.metadata ? JSON.parse(website.metadata) : null
    };
    
    return Response.json({ data: formattedWebsite }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors));
    }
    return handleApiError(error);
  }
}