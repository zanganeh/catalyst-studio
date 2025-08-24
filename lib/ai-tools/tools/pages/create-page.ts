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
import { ErrorCode } from '@/lib/types/unified-response.types';

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
            // Handle both components (no siteStructure) and pages (with siteStructure)
            const result: any = {
              success: true,
              page: {
                id: retryResponse.data.contentItem.id,
                title: retryResponse.data.contentItem.title,
                slug: retryResponse.data.contentItem.slug,
                url: retryResponse.data.url,
                websiteId: retryResponse.data.contentItem.websiteId,
                contentTypeId: retryResponse.data.contentItem.contentTypeId,
                parentId: retryResponse.data.siteStructure?.parentId || null,
                status: retryResponse.data.contentItem.status,
                createdAt: retryResponse.data.contentItem.createdAt,
                updatedAt: retryResponse.data.contentItem.updatedAt
              },
              executionTime: `${Date.now() - startTime}ms`,
              retryUsed: true,
              alternativeSlug
            };
            
            // Only add siteStructure if it exists (pages have it, components don't)
            if (retryResponse.data.siteStructure) {
              result.siteStructure = {
                id: retryResponse.data.siteStructure.id,
                fullPath: retryResponse.data.siteStructure.fullPath,
                pathDepth: retryResponse.data.siteStructure.pathDepth,
                position: retryResponse.data.siteStructure.position
              };
            }
            
            return result;
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
        // Handle both components (no siteStructure) and pages (with siteStructure)
        const result: any = {
          success: true,
          page: {
            id: response.data.contentItem.id,
            title: response.data.contentItem.title,
            slug: response.data.contentItem.slug,
            url: response.data.url,
            websiteId: response.data.contentItem.websiteId,
            contentTypeId: response.data.contentItem.contentTypeId,
            parentId: response.data.siteStructure?.parentId || null,
            status: response.data.contentItem.status,
            createdAt: response.data.contentItem.createdAt,
            updatedAt: response.data.contentItem.updatedAt
          },
          executionTime: response.metadata?.executionTime || `${Date.now() - startTime}ms`
        };
        
        // Only add siteStructure if it exists (pages have it, components don't)
        if (response.data.siteStructure) {
          result.siteStructure = {
            id: response.data.siteStructure.id,
            fullPath: response.data.siteStructure.fullPath,
            pathDepth: response.data.siteStructure.pathDepth,
            position: response.data.siteStructure.position
          };
        }
        
        return result;
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