import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import the database extractor on the server side only using dynamic import
    const { DatabaseExtractor } = await import('@/lib/sync/extractors/database-extractor.js');
    
    const dbPath = process.env.DATABASE_PATH || './data/catalyst.db';
    const extractor = new DatabaseExtractor(dbPath);
    
    try {
      const extractedTypes = await extractor.extractContentTypes();
      
      // Transform to our component format
      interface ExtractedType {
        id?: string;
        name: string;
        fields?: Array<{ name: string; type: string }>;
      }
      
      const types = extractedTypes.map((type: ExtractedType) => ({
        id: type.id || type.name.toLowerCase().replace(/\s+/g, '_'),
        name: type.name,
        fields: type.fields || []
      }));
      
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