import { tool } from 'ai';
import { z } from 'zod';
import { getContentType, updateContentType as updateContentTypeService } from '@/lib/services/content-type-service';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { 
  confidenceScorer,
  type ContentTypeDefinition 
} from '@/lib/services/universal-types/validation';

const fieldSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'richtext', 'number', 'boolean', 'date', 'image', 'richText', 'reference', 'select', 'gallery', 'tags', 'json', 'url']),
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: z.record(z.any()).optional(),
  helpText: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    description: z.string().optional()
  })).optional(),
  order: z.number().optional()
});

export const updateContentType = tool({
  description: 'Update an existing content type with safe field modifications',
  parameters: z.object({
    id: z.string().describe('The content type ID to update'),
    name: z.string().optional().describe('New name for the content type'),
    category: z.enum(['blog', 'e-commerce', 'portfolio', 'general']).optional()
      .describe('Update category for field validation'),
    fields: z.array(fieldSchema).optional()
      .describe('Updated fields array (replaces existing fields)'),
    addFields: z.array(fieldSchema).optional()
      .describe('Fields to add to existing fields'),
    removeFields: z.array(z.string()).optional()
      .describe('Field names to remove'),
    settings: z.record(z.any()).optional()
      .describe('Updated settings object')
  }),
  execute: async ({ id, name, category, fields, addFields, removeFields, settings }) => {
    const startTime = Date.now();
    
    try {
      // Get existing content type
      const existing = await getContentType(id);
      
      if (!existing) {
        return {
          success: false,
          error: `Content type with ID '${id}' not found`,
          executionTime: `${Date.now() - startTime}ms`
        };
      }
      
      // Get current fields from the existing content type
      let currentFields = Array.isArray(existing.fields) 
        ? existing.fields 
        : (existing.fields?.fields || []);
      
      // Prepare updated fields
      let updatedFields = [...currentFields];
      
      // If replacing all fields
      if (fields !== undefined) {
        // Warn about potential data loss when replacing all fields
        console.warn(`Removing fields from content type with existing content items may cause data loss. Fields being removed: ${currentFields.map((f: any) => f.name).join(', ')}`);
        updatedFields = fields;
      } else {
        // Add new fields
        if (addFields) {
          addFields.forEach(newField => {
            // Check if field already exists
            const existingIndex = updatedFields.findIndex((f: any) => f.name === newField.name);
            if (existingIndex >= 0) {
              // Update existing field
              updatedFields[existingIndex] = { ...updatedFields[existingIndex], ...newField };
            } else {
              // Add new field
              updatedFields.push(newField);
            }
          });
        }
        
        // Remove fields
        if (removeFields) {
          // Check if there might be existing content (warn regardless for safety)
          if (removeFields.length > 0) {
            console.warn(`Removing fields from content type with existing content items may cause data loss. Fields being removed: ${removeFields.join(', ')}`);
          }
          updatedFields = updatedFields.filter((f: any) => !removeFields.includes(f.name));
        }
      }
      
      // Apply category-specific validation if category is provided
      if (category) {
        // Add category-specific fields if missing
        if (category === 'blog') {
          const requiredBlogFields = [
            { name: 'metaTitle', type: 'text', required: false, label: 'SEO Title' },
            { name: 'metaDescription', type: 'textarea', required: false, label: 'SEO Description' },
            { name: 'slug', type: 'text', required: true, label: 'URL Slug' }
          ];
          
          requiredBlogFields.forEach(reqField => {
            if (!updatedFields.find((f: any) => f.name === reqField.name)) {
              updatedFields.push(reqField);
            }
          });
        } else if (category === 'e-commerce') {
          const requiredProductFields = ['name', 'price', 'sku'];
          requiredProductFields.forEach(fieldName => {
            if (!updatedFields.find((f: any) => f.name === fieldName)) {
              console.warn(`Missing required field for e-commerce: ${fieldName}`);
            }
          });
        }
        
        // Validate fields against business rules
        const validationResult = await businessRules.validateForCategory(
          { fields: updatedFields },
          category
        );
        
        if (!validationResult.valid && validationResult.errors) {
          console.warn('Business rule validation warnings:', validationResult.errors);
        }
      }
      
      // Calculate confidence score for AI-modified type
      const typeDefinition: ContentTypeDefinition = {
        name: name || existing.name,
        category: category === 'blog' || category === 'portfolio' ? 'page' : 'component',
        fields: updatedFields.map((f: any) => ({
          name: f.name,
          type: f.type,
          required: f.required || false,
          validation: f.validation
        }))
      };
      
      const confidenceScore = confidenceScorer.calculateScore(typeDefinition);
      console.log(`AI-modified type confidence: ${confidenceScore.total}% (${confidenceScore.threshold})`);
      
      // Log if manual review is recommended
      if (confidenceScore.threshold === 'review' || confidenceScore.threshold === 'manual') {
        console.warn(`Manual review recommended for updated type: ${confidenceScore.recommendation}`);
      }
      
      // Prepare fields with proper IDs and order
      const preparedFields = updatedFields.map((field: any, index) => ({
        ...field,
        id: field.id || `field_${field.name}_${Date.now()}_${index}`,
        order: field.order || index + 1
      }));
      
      // Prepare update data
      const updateData: any = {
        ...(name && { name }),
        fields: preparedFields,
        relationships: existing.fields?.relationships || []
      };
      
      // Merge settings
      if (settings || category) {
        const currentSettings = typeof existing.settings === 'object' 
          ? existing.settings 
          : {};
        
        updateData.pluralName = settings?.pluralName || currentSettings.pluralName;
        updateData.icon = settings?.icon || currentSettings.icon;
        updateData.description = settings?.description || currentSettings.description;
        
        // Store category in settings
        if (category) {
          updateData.settings = {
            ...currentSettings,
            ...settings,
            category
          };
        } else if (settings) {
          updateData.settings = {
            ...currentSettings,
            ...settings
          };
        }
      }
      
      // Update content type using the service (with AI source)
      const result = await updateContentTypeService(id, updateData, 'AI');
      
      const executionTime = Date.now() - startTime;
      if (executionTime > 2000) {
        console.warn(`update-content-type execution exceeded 2s: ${executionTime}ms`);
      }
      
      return {
        success: true,
        contentType: {
          id: result.id,
          websiteId: result.websiteId,
          name: result.name,
          fields: result.fields,
          settings: result.settings,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        },
        fieldsModified: {
          added: addFields?.length || 0,
          removed: removeFields?.length || 0,
          total: preparedFields.length
        },
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error updating content type:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update content type',
        executionTime: `${executionTime}ms`
      };
    }
  }
});