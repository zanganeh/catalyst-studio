import { NextRequest, NextResponse } from 'next/server';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { ErrorCode, StandardResponse } from '@/lib/services/types';
import { prisma } from '@/lib/prisma';

interface ResolveOptions {
  includeContent?: boolean;
  includeStructure?: boolean;
  includeChildren?: boolean;
  includeMeta?: boolean;
}

function validatePath(path: string): { valid: boolean; error?: string } {
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('./') || path.includes('/.')) {
    return { valid: false, error: 'Path traversal detected' };
  }

  // Check for encoded path traversal
  try {
    const decodedPath = decodeURIComponent(path);
    if (decodedPath !== path && (decodedPath.includes('..') || decodedPath.includes('./'))) {
      return { valid: false, error: 'Encoded path traversal detected' };
    }
  } catch {
    return { valid: false, error: 'Invalid path encoding' };
  }

  // Check path length
  if (path.length > 2000) {
    return { valid: false, error: 'Path exceeds maximum length of 2000 characters' };
  }

  // Check for valid characters
  const pathRegex = /^[a-zA-Z0-9\-\/\?\#\&\=\%\+\_\.\,\;\:]*$/;
  if (!pathRegex.test(path)) {
    return { valid: false, error: 'Path contains invalid characters' };
  }

  // Check for null bytes
  if (path.includes('\0')) {
    return { valid: false, error: 'Path contains null bytes' };
  }

  return { valid: true };
}

function parseIncludeParams(searchParams: URLSearchParams): ResolveOptions {
  const include = searchParams.get('include');
  
  if (!include) {
    // Default: include content and structure
    return {
      includeContent: true,
      includeStructure: true,
      includeChildren: false,
      includeMeta: false
    };
  }

  const parts = include.split(',').map(p => p.trim().toLowerCase());
  
  return {
    includeContent: parts.includes('content'),
    includeStructure: parts.includes('structure'),
    includeChildren: parts.includes('children'),
    includeMeta: parts.includes('meta') || parts.includes('metadata')
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // TODO: Add authentication when auth is set up
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ 
    //     success: false,
    //     error: {
    //       code: ErrorCode.UNAUTHORIZED,
    //       message: 'Authentication required'
    //     }
    //   } as StandardResponse<null>, { status: 401 });
    // }

    // Get website ID from header or query param
    const url = new URL(request.url);
    const websiteId = request.headers.get('x-website-id') || 
                     url.searchParams.get('websiteId') || 
                     process.env.DEFAULT_WEBSITE_ID;
                     
    if (!websiteId) {
      return NextResponse.json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Website ID is required',
          details: { 
            hint: 'Provide websiteId in x-website-id header or as query parameter' 
          }
        }
      } as StandardResponse<null>, { status: 400 });
    }

    // Get and validate path
    const path = url.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Path parameter is required',
          details: { example: '/api/pages/resolve?path=/about' }
        }
      } as StandardResponse<null>, { status: 400 });
    }

    // Validate path for security
    const pathValidation = validatePath(path);
    if (!pathValidation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: pathValidation.error || 'Invalid path',
          details: { path }
        }
      } as StandardResponse<null>, { status: 400 });
    }

    // Parse include parameters
    const options = parseIncludeParams(url.searchParams);
    
    // Resolve the URL using pageOrchestrator
    const result = await pageOrchestrator.resolveUrl(path, websiteId);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Page not found',
          details: { 
            path,
            websiteId,
            suggestion: 'Check if the page exists and is published'
          }
        }
      } as StandardResponse<null>, { status: 404 });
    }

    // Build response based on include options
    let responseData: any = {};

    // Always include basic page info
    responseData.pageId = result.siteStructure.id;
    responseData.path = result.fullPath;
    responseData.slug = result.siteStructure.slug;

    // Include content if requested
    if (options.includeContent && result.contentItem) {
      const contentItem = await prisma.contentItem.findUnique({
        where: { id: result.contentItem.id }
      });
      
      if (contentItem) {
        responseData.content = {
          id: contentItem.id,
          title: contentItem.title,
          slug: contentItem.slug,
          content: contentItem.content,
          publishedAt: contentItem.publishedAt,
          status: contentItem.status
        };
      }
    }

    // Include structure if requested
    if (options.includeStructure) {
      responseData.structure = {
        id: result.siteStructure.id,
        parentId: result.siteStructure.parentId,
        fullPath: result.fullPath,
        pathDepth: result.siteStructure.pathDepth,
        position: result.siteStructure.position,
        weight: result.siteStructure.weight
      };
    }

    // Include children if requested
    if (options.includeChildren) {
      const children = await prisma.siteStructure.findMany({
        where: {
          parentId: result.siteStructure.id,
          websiteId: websiteId
        },
        select: {
          id: true,
          slug: true,
          fullPath: true,
          position: true,
          contentItemId: true
        },
        orderBy: { position: 'asc' }
      });

      responseData.children = children;
    }

    // Include metadata if requested
    if (options.includeMeta) {
      responseData.meta = {
        createdAt: result.siteStructure.createdAt,
        updatedAt: result.siteStructure.updatedAt,
        websiteId: result.siteStructure.websiteId,
        contentItemId: result.contentItem.id
      };
    }

    // Add performance metrics
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        duration: `${duration}ms`,
        options
      }
    } as StandardResponse<any>);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Error resolving URL:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to resolve URL',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${duration}ms`
        }
      }
    } as StandardResponse<null>, { status: 500 });
  }
}