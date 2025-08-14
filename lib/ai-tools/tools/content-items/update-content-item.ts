import { tool } from 'ai';
import { z } from 'zod';
import { getClient } from '@/lib/db/client';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { getContentType } from '@/lib/services/content-type-service';

export const updateContentItem = tool({
  description: 'Update an existing content item with field validation',
  parameters: z.object({
    id: z.string().describe('The ID of the content item to update'),
    slug: z.string().optional().describe('Updated URL slug for the content item'),
    data: z.record(z.any()).optional().describe('Updated content data (will be merged with existing)'),
    metadata: z.record(z.any()).optional().describe('Updated metadata (will be merged with existing)'),
    status: z.enum(['draft', 'published', 'archived']).optional().describe('Updated publication status'),
    publishedAt: z.string().datetime().optional().describe('Updated publication date in ISO format')
  }),
  execute: async ({ id, slug, data, metadata, status, publishedAt }) => {
    const startTime = Date.now();
    
    try {
      const prisma = getClient();
      
      // Fetch existing content item
      const existingItem = await prisma.contentItem.findUnique({
        where: { id },
        include: {
          contentType: true,
          website: true,
        }
      });
      
      if (!existingItem) {
        throw new Error(`Content item with ID '${id}' not found`);
      }
      
      // Fetch content type to validate fields
      const contentType = await getContentType(existingItem.contentTypeId);
      if (!contentType) {
        throw new Error(`Content type with ID '${existingItem.contentTypeId}' not found`);
      }
      
      // Parse existing data
      const existingData = existingItem.data ? JSON.parse(existingItem.data) : {};
      const existingMetadata = existingItem.metadata ? JSON.parse(existingItem.metadata) : {};
      
      // Merge data if provided
      const mergedData = data ? { ...existingData, ...data } : existingData;
      const mergedMetadata = metadata ? { ...existingMetadata, ...metadata } : existingMetadata;
      
      // Validate merged data against content type field definitions
      const contentTypeFieldDefs = contentType.fields?.fields || [];
      const validationErrors: Array<{ field: string; message: string }> = [];
      
      // Check required fields in merged data
      for (const fieldDef of contentTypeFieldDefs) {
        if (fieldDef.required && !(fieldDef.name in mergedData)) {
          validationErrors.push({
            field: fieldDef.name,
            message: `Required field '${fieldDef.label || fieldDef.name}' is missing`
          });
        }
        
        // Validate field type if present in the update
        if (data && fieldDef.name in data) {
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
                const invalidValues = value.filter((v: unknown) => !validValues.includes(v));
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
      
      // Apply business rules validation if category is known and data is being updated
      if (data && existingItem.website.category) {
        const businessValidation = await businessRules.validateForCategory(mergedData, existingItem.website.category);
        if (!businessValidation.valid && businessValidation.errors) {
          // Only add errors for fields that are being updated
          const updatedFieldErrors = businessValidation.errors.filter(err => err.field in data);
          validationErrors.push(...updatedFieldErrors);
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
      
      // Update content item in a transaction
      const updatedItem = await prisma.$transaction(async (tx) => {
        const updateData: Record<string, unknown> = {};
        
        if (slug !== undefined) updateData.slug = slug || null;
        if (data !== undefined) updateData.data = JSON.stringify(mergedData);
        if (metadata !== undefined) updateData.metadata = JSON.stringify(mergedMetadata);
        if (status !== undefined) updateData.status = status;
        if (publishedAt !== undefined) updateData.publishedAt = new Date(publishedAt);
        
        const updated = await tx.contentItem.update({
          where: { id },
          data: updateData,
          include: {
            contentType: true,
            website: true,
          }
        });
        
        return updated;
      });
      
      const executionTime = Date.now() - startTime;
      if (executionTime > 2000) {
        console.warn(`update-content-item execution exceeded 2s: ${executionTime}ms`);
      }
      
      // Transform response
      const contentTypeFields = updatedItem.contentType.fields ? JSON.parse(updatedItem.contentType.fields) : {};
      const contentTypeSettings = updatedItem.contentType.settings ? JSON.parse(updatedItem.contentType.settings) : {};
      
      return {
        success: true,
        item: {
          id: updatedItem.id,
          websiteId: updatedItem.websiteId,
          contentTypeId: updatedItem.contentTypeId,
          slug: updatedItem.slug,
          status: updatedItem.status,
          data: JSON.parse(updatedItem.data),
          metadata: updatedItem.metadata ? JSON.parse(updatedItem.metadata) : {},
          publishedAt: updatedItem.publishedAt,
          createdAt: updatedItem.createdAt,
          updatedAt: updatedItem.updatedAt,
          contentType: {
            id: updatedItem.contentType.id,
            name: updatedItem.contentType.name,
            fields: contentTypeFields,
            settings: contentTypeSettings
          },
          website: {
            id: updatedItem.website.id,
            name: updatedItem.website.name,
            category: updatedItem.website.category
          }
        },
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error updating content item:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update content item',
        executionTime: `${executionTime}ms`
      };
    }
  }
});