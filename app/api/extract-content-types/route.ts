import { NextResponse } from 'next/server';
import { DatabaseExtractor } from '@/lib/sync/extractors/database-extractor';
import * as path from 'path';

export async function GET(request: Request) {
  try {
    // Get websiteId from query parameters
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    
    console.log('API: Extracting content types for websiteId:', websiteId);
    
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'prisma', 'dev.db');
    console.log('API: Using database path:', dbPath);
    const extractor = new DatabaseExtractor(dbPath);
    
    try {
      await extractor.connect();
      const extractedTypes = await extractor.extractContentTypes(websiteId);
      await extractor.close();
      
      console.log('API: Extracted types:', extractedTypes.length, extractedTypes.map(t => t.name));
      
      // Transform to our component format
      const types = extractedTypes.map((type) => ({
        id: type.id || type.name.toLowerCase().replace(/\s+/g, '_'),
        name: type.name,
        fields: type.fields?.fields || []
      }));
      
      console.log('API: Transformed types:', types);
      
      return NextResponse.json({ success: true, data: types });
    } catch (error) {
      console.error('Extraction failed, using mock data:', error);
      // If extraction fails, use mock data for demo purposes
      const mockTypes = [
        {
          id: 'article',
          name: 'Article',
          fields: [
            { name: 'title', type: 'string' },
            { name: 'content', type: 'richtext' },
            { name: 'author', type: 'reference' },
            { name: 'publishDate', type: 'datetime' }
          ]
        },
        {
          id: 'blog_post',
          name: 'Blog Post',
          fields: [
            { name: 'title', type: 'string' },
            { name: 'summary', type: 'text' },
            { name: 'body', type: 'richtext' },
            { name: 'tags', type: 'array' }
          ]
        },
        {
          id: 'category',
          name: 'Category',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'description', type: 'text' },
            { name: 'parent', type: 'reference' }
          ]
        }
      ];
      
      return NextResponse.json({ success: true, data: mockTypes, mock: true });
    }
  } catch (error) {
    console.error('Failed to extract content types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract content types' },
      { status: 500 }
    );
  }
}