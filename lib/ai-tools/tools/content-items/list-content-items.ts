import { tool } from 'ai';
import { z } from 'zod';
import { getClient } from '@/lib/db/client';

export const listContentItems = tool({
  description: 'List content items with filtering options',
  parameters: z.object({
    websiteId: z.string().optional().describe('Filter by website ID'),
    contentTypeId: z.string().optional().describe('Filter by content type ID'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Filter by status'),
    limit: z.number().min(1).max(20).default(20).describe('Maximum number of items to return (max 20)'),
    page: z.number().min(1).default(1).describe('Page number for pagination'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'slug']).default('updatedAt').describe('Field to sort by'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order')
  }),
  execute: async ({ websiteId, contentTypeId, status, limit, page, sortBy, sortOrder }) => {
    const startTime = Date.now();
    
    try {
      const prisma = getClient();
      
      // Build where clause
      const where: Record<string, unknown> = {};
      if (websiteId) where.websiteId = websiteId;
      if (contentTypeId) where.contentTypeId = contentTypeId;
      if (status) where.status = status;
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get total count
      const total = await prisma.contentItem.count({ where });
      
      // Fetch items with relations
      const items = await prisma.contentItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contentType: true,
          website: true,
        },
      });
      
      // Transform items to include parsed field values
      const transformedItems = items.map(item => {
        // Prisma already parses JSON fields, no need for JSON.parse
        const contentTypeFields = item.contentType.fields || {};
        const contentTypeSchema = item.contentType.schema || {};
        
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          websiteId: item.websiteId,
          contentTypeId: item.contentTypeId,
          status: item.status,
          content: item.content || {},
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          contentType: {
            id: item.contentType.id,
            name: item.contentType.name,
            fields: contentTypeFields,
            schema: contentTypeSchema
          },
          website: {
            id: item.website.id,
            name: item.website.name,
            category: item.website.category
          }
        };
      });
      
      const executionTime = Date.now() - startTime;
      if (executionTime > 2000) {
        console.warn(`list-content-items execution exceeded 2s: ${executionTime}ms`);
      }
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        success: true,
        items: transformedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error listing content items:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list content items',
        executionTime: `${executionTime}ms`
      };
    }
  }
});