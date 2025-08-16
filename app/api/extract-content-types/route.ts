import { NextResponse } from 'next/server';
import { DatabaseExtractor } from '@/lib/sync/extractors/database-extractor';

export async function GET(request: Request) {
  try {
    // Get websiteId from query parameters
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    
    // Prisma handles database connection automatically
    const extractor = new DatabaseExtractor();
    
    const extractedTypes = websiteId 
      ? await extractor.extractContentTypesForWebsite(websiteId)
      : await extractor.extractContentTypes();
    
    // Transform to our component format
    const types = extractedTypes.map((type) => ({
      id: type.id || type.name.toLowerCase().replace(/\s+/g, '_'),
      name: type.name,
      fields: type.fields?.fields || []
    }));
    
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    // Log error for monitoring in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to extract content types:', error);
    }
    
    // Return proper error message to client
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to extract content types from database';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: 'Unable to retrieve content types. Please ensure the database is connected and contains valid data.'
      },
      { status: 500 }
    );
  }
}