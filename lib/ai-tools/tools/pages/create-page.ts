/**
 * AI Tool for Content Creation (Pages and Components)
 * 
 * Uses UnifiedPageService to ensure proper creation:
 * - Pages: Atomic creation of both ContentItem and SiteStructure
 * - Components: Creates only ContentItem (no routing needed)
 * 
 * Replaces the old create-content-item tool.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { unifiedPageService } from '@/lib/services/unified-page-service';
import { ErrorCode, PageResult } from '@/lib/types/unified-response.types';

/**
 * Helper function to format the response from UnifiedPageService
 */
function formatPageResponse(
  data: PageResult,
  startTime: number,
  retryUsed = false,
  alternativeSlug?: string
) {
  const result: any = {
    success: true,
    page: {
      id: data.contentItem.id,
      title: data.contentItem.title,
      slug: data.contentItem.slug,
      url: data.url,
      websiteId: data.contentItem.websiteId,
      contentTypeId: data.contentItem.contentTypeId,
      parentId: data.siteStructure?.parentId || null,
      status: data.contentItem.status,
      createdAt: data.contentItem.createdAt,
      updatedAt: data.contentItem.updatedAt
    },
    executionTime: `${Date.now() - startTime}ms`
  };
  
  if (retryUsed && alternativeSlug) {
    result.retryUsed = true;
    result.alternativeSlug = alternativeSlug;
  }
  
  // Only add siteStructure if it exists (pages have it, components don't)
  if (data.siteStructure) {
    result.siteStructure = {
      id: data.siteStructure.id,
      fullPath: data.siteStructure.fullPath,
      pathDepth: data.siteStructure.pathDepth,
      position: data.siteStructure.position
    };
  }
  
  return result;
}

/**
 * Create content (page or component) with proper structure
 * - Pages: Creates both ContentItem and SiteStructure atomically
 * - Components: Creates only ContentItem (no routing needed)
 */
export const createPage = tool({
  description: 'Create a new page or component. Pages get both ContentItem and SiteStructure. Components only get ContentItem.',
  parameters: z.object({
    websiteId: z.string().describe('The website ID for the page'),
    contentTypeId: z.string().describe('The content type ID that defines the structure'),
    title: z.string().describe('The page title'),
    content: z.record(z.any()).describe('The content data matching the content type fields'),
    parentId: z.string().optional().describe('The parent page ID for hierarchy (null for root pages)'),
    slug: z.string().optional().describe('URL slug (auto-generated from title if not provided)'),
    metadata: z.record(z.any()).optional().describe('Additional metadata for the page'),
    status: z.enum(['draft', 'published']).default('draft').describe('Publication status')
  }),
  execute: async (params) => {
    const startTime = Date.now();
    
    try {
      // Use UnifiedPageService for atomic creation
      const response = await unifiedPageService.createPage(
        {
          websiteId: params.websiteId,
          contentTypeId: params.contentTypeId,
          title: params.title,
          content: params.content,
          parentId: params.parentId || undefined,
          slug: params.slug || undefined,
          metadata: params.metadata,
          status: params.status
        },
        'ai' // Source is AI
      );

      // Handle slug conflicts with automatic retry
      if (!response.success && response.errors.length > 0) {
        const slugError = response.errors.find(e => e.code === ErrorCode.SLUG_CONFLICT);
        
        if (slugError && slugError.recovery?.alternativeValues?.length) {
          // Try with first alternative slug
          const alternativeSlug = slugError.recovery.alternativeValues[0];
          console.log(`Slug conflict detected. Retrying with alternative: ${alternativeSlug}`);
          
          const retryResponse = await unifiedPageService.createPage(
            {
              websiteId: params.websiteId,
              contentTypeId: params.contentTypeId,
              title: params.title,
              content: params.content,
              parentId: params.parentId || undefined,
              slug: alternativeSlug,
              metadata: params.metadata,
              status: params.status
            },
            'ai'
          );

          if (retryResponse.success && retryResponse.data) {
            return formatPageResponse(retryResponse.data, startTime, true, alternativeSlug);
          }
        }

        // Return error response with recovery suggestions
        return {
          success: false,
          error: response.errors[0].message,
          errors: response.errors,
          warnings: response.warnings,
          executionTime: `${Date.now() - startTime}ms`,
          recovery: response.errors[0].recovery
        };
      }

      // Success response
      if (response.success && response.data) {
        return formatPageResponse(response.data, startTime);
      }

      // Unexpected response format
      return {
        success: false,
        error: 'Unexpected response format from UnifiedPageService',
        executionTime: `${Date.now() - startTime}ms`
      };
    } catch (error) {
      console.error('Error creating page:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create page',
        executionTime: `${Date.now() - startTime}ms`
      };
    }
  }
});