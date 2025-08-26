import { NextRequest, NextResponse } from 'next/server';
import { siteStructureService } from '@/lib/services/site-structure/site-structure-service';
import { transformToReactFlow } from '@/lib/premium/components/sitemap/transforms/to-react-flow';

/**
 * GET /api/premium/sitemap/[websiteId]
 * Fetch the site structure tree and transform it for React Flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    
    // Validate websiteId format
    if (!websiteId || websiteId.length > 100 || websiteId.length < 1) {
      return NextResponse.json(
        { error: 'Invalid website ID format' },
        { status: 400 }
      );
    }
    
    // Fetch the tree from the database using existing service
    const tree = await siteStructureService.getTree(websiteId);
    
    // Transform to React Flow format
    const { nodes, edges } = transformToReactFlow(tree);
    
    // Return with caching headers for performance
    return NextResponse.json(
      { 
        nodes, 
        edges,
        websiteId,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Website not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch sitemap' },
      { status: 500 }
    );
  }
}