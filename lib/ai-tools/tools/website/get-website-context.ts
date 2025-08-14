import { tool } from 'ai';
import { z } from 'zod';
import { WebsiteService } from '@/lib/services/website-service';

export const getWebsiteContext = tool({
  description: 'Retrieves current website metadata and business requirements',
  parameters: z.object({
    websiteId: z.string().describe('The ID of the website to retrieve context for'),
  }),
  execute: async ({ websiteId }) => {
    const startTime = Date.now();
    
    try {
      // Use lazy initialization pattern from Story 5.1
      const websiteService = new WebsiteService();
      
      // Retrieve website metadata
      const website = await websiteService.getWebsite(websiteId);
      
      if (!website) {
        return {
          success: false,
          error: `Website with ID ${websiteId} not found`,
        };
      }

      // Extract business requirements from metadata
      const metadata = website.metadata ? JSON.parse(String(website.metadata)) : {};
      const businessRequirements = {
        category: website.category || 'general',
        contentTypes: metadata.contentTypes || [],
        requiredFields: metadata.requiredFields || {},
        validationRules: metadata.validationRules || {},
        seoRequirements: metadata.seoRequirements || {},
        customRules: metadata.customRules || [],
      };

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Log performance for monitoring
      if (executionTime > 2000) {
        console.warn(`get-website-context took ${executionTime}ms (exceeded 2s limit)`);
      } else {
        console.log(`get-website-context completed in ${executionTime}ms`);
      }

      return {
        success: true,
        data: {
          website: {
            id: website.id,
            name: website.name,
            category: website.category,
            description: website.description,
            isActive: website.isActive,
            createdAt: website.createdAt,
            updatedAt: website.updatedAt,
          },
          businessRequirements,
          websiteMetadata: {
            ...metadata,
          },
          executionTime: `${executionTime}ms`,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error in get-website-context:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: `${executionTime}ms`,
      };
    }
  },
});