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
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // JSON fields are already parsed by Prisma
    const formattedWebsites = websites.map(website => ({
      ...website,
      metadata: website.metadata || null,
      settings: website.settings || null
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
    
    // Prisma handles JSON fields automatically
    const dataToStore: any = {
      ...validated,
      metadata: validated.metadata,
      settings: validated.settings
    };
    
    const website = await prisma.website.create({
      data: dataToStore
    });
    
    // JSON fields are already parsed by Prisma
    const formattedWebsite = {
      ...website,
      metadata: website.metadata || null,
      settings: website.settings || null
    };
    
    return Response.json({ data: formattedWebsite }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors));
    }
    return handleApiError(error);
  }
}