import { z } from 'zod';

// Category-specific validation schemas
const blogRequiredFields = z.object({
  title: z.string().min(1, 'Title is required'),
  metaDescription: z.string().min(1, 'Meta description is required for SEO'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  author: z.string().min(1, 'Author is required'),
  publishDate: z.string().datetime().or(z.date()),
  content: z.string().min(1, 'Content is required'),
});

const ecommerceRequiredFields = z.object({
  title: z.string().min(1, 'Product title is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  inventory: z.number().int().min(0, 'Inventory must be non-negative'),
  productImages: z.array(z.string()).min(1, 'At least one product image is required'),
  shippingInfo: z.object({
    weight: z.number().positive('Weight must be positive'),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }).optional(),
  }),
  description: z.string().min(1, 'Product description is required'),
});

const portfolioRequiredFields = z.object({
  projectTitle: z.string().min(1, 'Project title is required'),
  description: z.string().min(1, 'Project description is required'),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  images: z.array(z.string()).min(1, 'At least one project image is required'),
  links: z.object({
    live: z.string().url().optional(),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
  }).refine(
    (data) => data.live || data.github || data.demo,
    'At least one project link is required'
  ),
});

// Map of category to validation schema
const categorySchemas: Record<string, z.ZodSchema> = {
  blog: blogRequiredFields,
  ecommerce: ecommerceRequiredFields,
  portfolio: portfolioRequiredFields,
};

// Map of content types to their typical fields
const contentTypeFields: Record<string, Record<string, string[]>> = {
  blog: {
    article: ['title', 'content', 'author', 'publishDate', 'tags', 'metaDescription', 'featuredImage'],
    news: ['title', 'content', 'author', 'publishDate', 'tags', 'metaDescription', 'source', 'breaking'],
    tutorial: ['title', 'content', 'author', 'publishDate', 'tags', 'metaDescription', 'difficulty', 'duration', 'prerequisites'],
  },
  ecommerce: {
    product: ['title', 'price', 'sku', 'inventory', 'productImages', 'description', 'shippingInfo', 'category', 'variants'],
    category: ['name', 'description', 'parentCategory', 'image', 'seoMetadata'],
    promotion: ['code', 'discount', 'startDate', 'endDate', 'conditions', 'applicableProducts'],
  },
  portfolio: {
    project: ['projectTitle', 'description', 'technologies', 'images', 'links', 'client', 'duration', 'role'],
    casestudy: ['projectTitle', 'description', 'technologies', 'images', 'links', 'challenge', 'solution', 'results', 'testimonial'],
    showcase: ['projectTitle', 'description', 'technologies', 'images', 'links', 'awards', 'metrics'],
  },
};

// Field suggestions based on category and purpose
const fieldSuggestions: Record<string, Record<string, string[]>> = {
  blog: {
    seo: ['canonicalUrl', 'ogImage', 'ogDescription', 'keywords', 'structuredData'],
    engagement: ['commentsEnabled', 'relatedPosts', 'callToAction', 'newsletter', 'socialSharing'],
    analytics: ['viewCount', 'readTime', 'shareCount', 'trackingId'],
  },
  ecommerce: {
    marketing: ['crossSells', 'upSells', 'bundles', 'reviews', 'ratings'],
    inventory: ['reorderPoint', 'leadTime', 'supplier', 'warehouseLocation', 'backorderAllowed'],
    pricing: ['compareAtPrice', 'costPerItem', 'taxable', 'taxCode', 'wholesalePrice'],
  },
  portfolio: {
    credibility: ['clientTestimonial', 'projectBudget', 'teamSize', 'awards', 'press'],
    technical: ['architecture', 'performance', 'scalability', 'security', 'deployment'],
    results: ['metrics', 'roi', 'userGrowth', 'revenue', 'efficiency'],
  },
};

export class BusinessRulesEngine {
  /**
   * Validates data against category-specific rules
   */
  async validateForCategory(data: any, category: string): Promise<{
    valid: boolean;
    errors?: Array<{ field: string; message: string }>;
    warnings?: Array<{ field: string; message: string }>;
  }> {
    const schema = categorySchemas[category.toLowerCase()];
    
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: 'category', message: `Unknown category: ${category}` }],
      };
    }

    try {
      await schema.parseAsync(data);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        // Add warnings for suggested fields that are missing
        const warnings: Array<{ field: string; message: string }> = [];
        const suggestedFields = this.getSuggestedFields(category, 'general');
        
        suggestedFields.forEach(field => {
          if (!(field in data)) {
            warnings.push({
              field,
              message: `Consider adding '${field}' for better content quality`,
            });
          }
        });

        return { valid: false, errors, warnings };
      }
      
      throw error;
    }
  }

  /**
   * Gets required fields for a category and content type
   */
  getRequiredFields(category: string, contentType?: string): string[] {
    const categoryLower = category.toLowerCase();
    const schema = categorySchemas[categoryLower];
    
    if (!schema) {
      return [];
    }

    // Extract field names from the schema
    if (schema instanceof z.ZodObject) {
      return Object.keys(schema.shape);
    }

    // Fallback to content type fields if available
    if (contentType && contentTypeFields[categoryLower]?.[contentType]) {
      return contentTypeFields[categoryLower][contentType];
    }

    // Return basic required fields based on category
    switch (categoryLower) {
      case 'blog':
        return ['title', 'content', 'author', 'publishDate', 'tags', 'metaDescription'];
      case 'ecommerce':
        return ['title', 'price', 'sku', 'inventory', 'productImages', 'description', 'shippingInfo'];
      case 'portfolio':
        return ['projectTitle', 'description', 'technologies', 'images', 'links'];
      default:
        return [];
    }
  }

  /**
   * Suggests additional fields based on category and purpose
   */
  suggestFields(category: string, purpose: string): string[] {
    const categoryLower = category.toLowerCase();
    const purposeLower = purpose.toLowerCase();
    
    // Get specific suggestions for the purpose
    const purposeSuggestions = fieldSuggestions[categoryLower]?.[purposeLower] || [];
    
    // Get general suggestions (all purposes)
    const generalSuggestions = Object.values(fieldSuggestions[categoryLower] || {}).flat();
    
    // Combine and deduplicate
    const allSuggestions = [...new Set([...purposeSuggestions, ...generalSuggestions])];
    
    return allSuggestions;
  }

  /**
   * Get suggested fields (internal helper)
   */
  private getSuggestedFields(category: string, purpose: string = 'general'): string[] {
    const categoryLower = category.toLowerCase();
    const allSuggestions = Object.values(fieldSuggestions[categoryLower] || {}).flat();
    return [...new Set(allSuggestions)];
  }
}

// Export singleton instance
export const businessRules = new BusinessRulesEngine();