import { tool } from 'ai';
import { z } from 'zod';
import { getClient } from '@/lib/db/client';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { getContentType } from '@/lib/services/content-type-service';

export const createContentItem = tool({
  description: 'Create a new content item with validation against content type fields',
  parameters: z.object({
    websiteId: z.string().describe('The website ID for the content item'),
    contentTypeId: z.string().describe('The content type ID that defines the structure'),
    slug: z.string().optional().describe('URL slug for the content item'),
    data: z.record(z.any()).describe('The content data matching the content type fields'),
    metadata: z.record(z.any()).optional().describe('Additional metadata for the content item'),
    status: z.enum(['draft', 'published', 'archived']).default('draft').describe('Publication status'),
    publishedAt: z.string().datetime().optional().describe('Publication date in ISO format')
  }),
  execute: async ({ websiteId, contentTypeId, slug, data, metadata, status, publishedAt }) => {
    const startTime = Date.now();
    
    try {
      const prisma = getClient();
      
      // Try to find content type by ID or key
      let contentType = await getContentType(contentTypeId);
      
      // If not found by ID, try to find by key
      if (!contentType) {
        const contentTypeByKey = await prisma.contentType.findFirst({
          where: {
            websiteId: websiteId,
            key: contentTypeId
          }
        });
        
        if (contentTypeByKey) {
          contentType = await getContentType(contentTypeByKey.id);
        }
      }
      
      if (!contentType) {
        throw new Error(`Content type with ID or key '${contentTypeId}' not found for website '${websiteId}'`);
      }
      
      // Validate against content type field definitions
      const contentTypeFieldDefs = contentType.fields?.fields || [];
      const validationErrors: Array<{ field: string; message: string }> = [];
      
      // Check required fields
      for (const fieldDef of contentTypeFieldDefs) {
        if (fieldDef.required && !(fieldDef.name in data)) {
          validationErrors.push({
            field: fieldDef.name,
            message: `Required field '${fieldDef.label || fieldDef.name}' is missing`
          });
        }
        
        // Validate field type if present
        if (fieldDef.name in data) {
          const value = data[fieldDef.name];
          const fieldType = fieldDef.type;
          
          // Basic type validation
          switch (fieldType) {
            case 'text':
            case 'textarea':
            case 'richtext':
              if (typeof value !== 'string') {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' must be a string`
                });
              }
              break;
            case 'number':
              if (typeof value !== 'number') {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' must be a number`
                });
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' must be a boolean`
                });
              }
              break;
            case 'date':
            case 'datetime':
              if (typeof value !== 'string' || isNaN(Date.parse(value))) {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' must be a valid date string`
                });
              }
              break;
            case 'select':
            case 'radio':
              if (fieldDef.options) {
                const validValues = fieldDef.options.map(opt => opt.value);
                if (!validValues.includes(value)) {
                  validationErrors.push({
                    field: fieldDef.name,
                    message: `Field '${fieldDef.name}' must be one of: ${validValues.join(', ')}`
                  });
                }
              }
              break;
            case 'multiselect':
            case 'checkbox':
              if (!Array.isArray(value)) {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' must be an array`
                });
              } else if (fieldDef.options) {
                const validValues = fieldDef.options.map(opt => opt.value);
                const invalidValues = value.filter(v => !validValues.includes(v));
                if (invalidValues.length > 0) {
                  validationErrors.push({
                    field: fieldDef.name,
                    message: `Field '${fieldDef.name}' contains invalid values: ${invalidValues.join(', ')}`
                  });
                }
              }
              break;
            case 'json':
              // JSON fields accept any valid JSON structure
              if (value === null || value === undefined) {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' cannot be null or undefined`
                });
              }
              break;
          }
          
          // Apply field-specific validation rules
          if (fieldDef.validation) {
            const validation = fieldDef.validation;
            
            if (validation.minLength && typeof value === 'string' && value.length < Number(validation.minLength)) {
              validationErrors.push({
                field: fieldDef.name,
                message: `Field '${fieldDef.name}' must be at least ${validation.minLength} characters`
              });
            }
            
            if (validation.maxLength && typeof value === 'string' && value.length > Number(validation.maxLength)) {
              validationErrors.push({
                field: fieldDef.name,
                message: `Field '${fieldDef.name}' must not exceed ${validation.maxLength} characters`
              });
            }
            
            if (validation.min && typeof value === 'number' && value < Number(validation.min)) {
              validationErrors.push({
                field: fieldDef.name,
                message: `Field '${fieldDef.name}' must be at least ${validation.min}`
              });
            }
            
            if (validation.max && typeof value === 'number' && value > Number(validation.max)) {
              validationErrors.push({
                field: fieldDef.name,
                message: `Field '${fieldDef.name}' must not exceed ${validation.max}`
              });
            }
            
            if (validation.pattern && typeof value === 'string') {
              const regex = new RegExp(String(validation.pattern));
              if (!regex.test(value)) {
                validationErrors.push({
                  field: fieldDef.name,
                  message: `Field '${fieldDef.name}' does not match the required pattern`
                });
              }
            }
          }
        }
      }
      
      // Get website to check category
      const website = await prisma.website.findUnique({
        where: { id: websiteId }
      });
      
      if (!website) {
        throw new Error(`Website with ID '${websiteId}' not found`);
      }
      
      // Apply business rules validation if category is known
      if (website.category) {
        const businessValidation = await businessRules.validateForCategory(data, website.category);
        if (!businessValidation.valid && businessValidation.errors) {
          validationErrors.push(...businessValidation.errors);
        }
      }
      
      // If there are validation errors, return them
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors,
          executionTime: `${Date.now() - startTime}ms`
        };
      }
      
      // Apply default values for missing optional fields
      const finalData = { ...data };
      for (const fieldDef of contentTypeFieldDefs) {
        if (!fieldDef.required && !(fieldDef.name in finalData) && fieldDef.defaultValue !== undefined) {
          finalData[fieldDef.name] = fieldDef.defaultValue;
        }
      }
      
      // Generate title from data or use a default
      const title = finalData.title || finalData.name || 'Untitled Content';
      
      // Generate slug if not provided
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      // Create content item in a transaction
      const contentItem = await prisma.$transaction(async (tx) => {
        const created = await tx.contentItem.create({
          data: {
            title,
            slug: finalSlug,
            websiteId,
            contentTypeId,
            content: finalData,
            status,
          },
          include: {
            contentType: {
              include: {
                website: true
              }
            },
          }
        });
        
        return created;
      });
      
      const executionTime = Date.now() - startTime;
      if (executionTime > 2000) {
        console.warn(`create-content-item execution exceeded 2s: ${executionTime}ms`);
      }
      
      // Transform response
      const contentTypeFields = contentItem.contentType.fields ? 
        (typeof contentItem.contentType.fields === 'string' ? JSON.parse(contentItem.contentType.fields) : contentItem.contentType.fields) : {};
      const contentTypeSchema = contentItem.contentType.schema ? 
        (typeof contentItem.contentType.schema === 'string' ? JSON.parse(contentItem.contentType.schema) : contentItem.contentType.schema) : {};
      
      return {
        success: true,
        item: {
          id: contentItem.id,
          title: contentItem.title,
          slug: contentItem.slug,
          websiteId: contentItem.websiteId,
          contentTypeId: contentItem.contentTypeId,
          status: contentItem.status,
          content: typeof contentItem.content === 'string' ? JSON.parse(contentItem.content) : contentItem.content,
          createdAt: contentItem.createdAt,
          updatedAt: contentItem.updatedAt,
          contentType: {
            id: contentItem.contentType.id,
            name: contentItem.contentType.name,
            fields: contentTypeFields,
            schema: contentTypeSchema
          },
          website: {
            id: contentItem.contentType.website.id,
            name: contentItem.contentType.website.name,
            category: contentItem.contentType.website.category
          }
        },
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error creating content item:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create content item',
        executionTime: `${executionTime}ms`
      };
    }
  }
});