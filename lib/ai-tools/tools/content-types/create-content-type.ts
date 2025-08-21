import { tool } from 'ai';
import { z } from 'zod';
import { createContentType as createContentTypeService } from '@/lib/services/content-type-service';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { 
  confidenceScorer,
  type ContentTypeDefinition 
} from '@/lib/services/universal-types/validation';

type FieldType = 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'date' | 'image' | 'richText' | 'reference' | 'select' | 'gallery' | 'tags' | 'json' | 'url';

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

export const createContentType = tool({
  description: 'Create a new content type with automatic field inference based on category',
  parameters: z.object({
    websiteId: z.string().describe('The website ID'),
    name: z.string().describe('The content type name'),
    category: z.enum(['blog', 'e-commerce', 'portfolio', 'general']).optional()
      .describe('Category for automatic field inference'),
    fields: z.array(fieldSchema).optional()
      .describe('Custom fields (category-specific fields will be added automatically)'),
    settings: z.record(z.any()).optional()
      .describe('Additional settings for the content type')
  }),
  execute: async ({ websiteId, name, category, fields = [], settings = {} }) => {
    const startTime = Date.now();
    
    try {
      let inferredFields = [...fields];
      
      // Apply category-specific field inference
      if (category) {
        const requiredFields = businessRules.getRequiredFields(category, name);
        const suggestedFields = businessRules.suggestFields(category, name);
        
        // Add category-specific fields based on category
        if (category === 'blog') {
          // Add SEO fields for blog
          const seoFields = [
            { name: 'title', type: 'text' as FieldType, required: true, label: 'Title', order: 1 },
            { name: 'slug', type: 'text' as FieldType, required: true, label: 'URL Slug', order: 2 },
            { name: 'content', type: 'richtext' as FieldType, required: true, label: 'Content', order: 3 },
            { name: 'excerpt', type: 'textarea' as FieldType, required: false, label: 'Excerpt', order: 4 },
            { name: 'metaTitle', type: 'text' as FieldType, required: false, label: 'SEO Title', order: 5 },
            { name: 'metaDescription', type: 'textarea' as FieldType, required: false, label: 'SEO Description', order: 6 },
            { name: 'author', type: 'text' as FieldType, required: true, label: 'Author', order: 7 },
            { name: 'publishDate', type: 'date' as FieldType, required: true, label: 'Publish Date', order: 8 },
            { name: 'featuredImage', type: 'image' as FieldType, required: false, label: 'Featured Image', order: 9 },
            { name: 'tags', type: 'tags' as FieldType, required: false, label: 'Tags', order: 10 }
          ];
          
          // Merge with existing fields, avoiding duplicates
          seoFields.forEach(seoField => {
            if (!inferredFields.find(f => f.name === seoField.name)) {
              inferredFields.push(seoField);
            }
          });
        } else if (category === 'e-commerce') {
          // Add product fields for e-commerce
          const productFields = [
            { name: 'name', type: 'text' as FieldType, required: true, label: 'Product Name', order: 1 },
            { name: 'description', type: 'richtext' as FieldType, required: true, label: 'Description', order: 2 },
            { name: 'price', type: 'number' as FieldType, required: true, label: 'Price', order: 3 },
            { name: 'sku', type: 'text' as FieldType, required: true, label: 'SKU', order: 4 },
            { name: 'stock', type: 'number' as FieldType, required: true, label: 'Stock Quantity', order: 5 },
            { name: 'availability', type: 'select' as FieldType, required: true, label: 'Availability', order: 6 },
            { name: 'images', type: 'gallery' as FieldType, required: false, label: 'Product Images', order: 7 },
            { name: 'category', type: 'select' as FieldType, required: true, label: 'Category', order: 8 },
            { name: 'weight', type: 'number' as FieldType, required: false, label: 'Weight', order: 9 },
            { name: 'dimensions', type: 'json' as FieldType, required: false, label: 'Dimensions', order: 10 }
          ];
          
          productFields.forEach(productField => {
            if (!inferredFields.find(f => f.name === productField.name)) {
              inferredFields.push(productField);
            }
          });
        } else if (category === 'portfolio') {
          // Add portfolio fields
          const portfolioFields = [
            { name: 'title', type: 'text' as FieldType, required: true, label: 'Project Title', order: 1 },
            { name: 'description', type: 'richtext' as FieldType, required: true, label: 'Description', order: 2 },
            { name: 'client', type: 'text' as FieldType, required: false, label: 'Client', order: 3 },
            { name: 'date', type: 'date' as FieldType, required: true, label: 'Project Date', order: 4 },
            { name: 'category', type: 'select' as FieldType, required: true, label: 'Category', order: 5 },
            { name: 'skills', type: 'tags' as FieldType, required: false, label: 'Skills Used', order: 6 },
            { name: 'images', type: 'gallery' as FieldType, required: true, label: 'Project Images', order: 7 },
            { name: 'showcase', type: 'image' as FieldType, required: false, label: 'Showcase Image', order: 8 },
            { name: 'url', type: 'url' as FieldType, required: false, label: 'Project URL', order: 9 },
            { name: 'testimonial', type: 'textarea' as FieldType, required: false, label: 'Client Testimonial', order: 10 }
          ];
          
          portfolioFields.forEach(portfolioField => {
            if (!inferredFields.find(f => f.name === portfolioField.name)) {
              inferredFields.push(portfolioField);
            }
          });
        }
        
        // Create definition for confidence scoring
        const typeDefinition: ContentTypeDefinition = {
          name,
          category: category === 'blog' || category === 'portfolio' ? 'page' : 'component',
          fields: inferredFields.map(f => ({
            name: f.name,
            type: f.type,
            required: f.required || false,
            validation: f.validation
          }))
        };
        
        // Calculate confidence score for AI-generated type
        const confidenceScore = confidenceScorer.calculateScore(typeDefinition);
        console.log(`AI-generated type confidence: ${confidenceScore.total}% (${confidenceScore.threshold})`);
        
        // Also validate with business rules for category-specific logic
        const businessValidation = await businessRules.validateForCategory(
          { fields: inferredFields },
          category
        );
        
        if (!businessValidation.valid && businessValidation.errors) {
          console.warn('Business rule validation warnings:', businessValidation.errors);
        }
      }
      
      // Prepare fields with proper IDs and type validation
      const preparedFields = inferredFields.map((field: any, index) => ({
        ...field,
        id: field.id || `field_${field.name}_${Date.now()}_${index}`,
        type: field.type as 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'date' | 'image' | 'richText' | 'reference' | 'select' | 'gallery' | 'tags' | 'json' | 'url',
        order: field.order || index + 1
      }));
      
      // Create content type using the service (with AI source)
      const result = await createContentTypeService({
        websiteId,
        name,
        pluralName: (settings.pluralName as string) || `${name}s`,
        icon: (settings.icon as string) || '📋',
        description: (settings.description as string) || '',
        fields: preparedFields,
        relationships: []
      }, 'AI');
      
      const executionTime = Date.now() - startTime;
      if (executionTime > 2000) {
        console.warn(`create-content-type execution exceeded 2s: ${executionTime}ms`);
      }
      
      return {
        success: true,
        contentType: {
          id: result.id,
          websiteId: result.websiteId,
          name: result.name,
          fields: result.fields,
          settings: result.settings,
          category,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        },
        inferredFieldsCount: preparedFields.length,
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Error creating content type:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create content type',
        executionTime: `${executionTime}ms`
      };
    }
  }
});