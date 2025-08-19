// Mock Provider for Testing and Development

import { 
  ICMSProvider, 
  ProviderCapabilities, 
  ValidationResult 
} from '../types';
import { 
  UniversalContentType, 
  UniversalField, 
  TypeMetadata 
} from '../universal/types';

/**
 * Mock CMS Provider for testing and development
 * Implements the ICMSProvider interface with sample data
 */
export class MockProvider implements ICMSProvider {
  private contentTypes: Map<string, UniversalContentType>;
  private readonly providerId = 'mock';

  constructor() {
    this.contentTypes = new Map();
    this.initializeSampleData();
  }

  /**
   * Initialize sample content types for testing
   */
  private initializeSampleData(): void {
    // BlogPost type (page)
    const blogPost: UniversalContentType = {
      version: '1.0.0',
      id: 'blog-post',
      name: 'Blog Post',
      type: 'page',
      description: 'A blog post with title, content, author, and publish date',
      isRoutable: true,
      fields: [
        {
          id: 'title',
          name: 'Title',
          layer: 'primitive',
          type: 'text',
          description: 'The blog post title',
          required: true,
          validations: [
            { type: 'required', message: 'Title is required' },
            { type: 'max', value: 100, message: 'Title must be less than 100 characters' }
          ]
        },
        {
          id: 'slug',
          name: 'Slug',
          layer: 'common',
          type: 'slug',
          description: 'URL-friendly version of the title',
          required: true,
          validations: [
            { type: 'required', message: 'Slug is required' },
            { type: 'pattern', value: '^[a-z0-9-]+$', message: 'Slug must be lowercase with hyphens only' }
          ]
        },
        {
          id: 'content',
          name: 'Content',
          layer: 'common',
          type: 'richText',
          description: 'The main blog post content',
          required: true,
          validations: [
            { type: 'required', message: 'Content is required' }
          ]
        },
        {
          id: 'author',
          name: 'Author',
          layer: 'primitive',
          type: 'text',
          description: 'The author of the blog post',
          required: true,
          defaultValue: 'Anonymous'
        },
        {
          id: 'publishDate',
          name: 'Publish Date',
          layer: 'primitive',
          type: 'date',
          description: 'When the blog post should be published',
          required: false
        },
        {
          id: 'tags',
          name: 'Tags',
          layer: 'common',
          type: 'tags',
          description: 'Tags for categorization',
          required: false
        },
        {
          id: 'featuredImage',
          name: 'Featured Image',
          layer: 'common',
          type: 'media',
          description: 'Main image for the blog post',
          required: false
        },
        {
          id: 'customData',
          name: 'Custom Data',
          layer: 'extension',
          type: 'mock_custom_field',
          description: 'Mock platform-specific extension field',
          fallbackStrategy: 'json'
        }
      ],
      metadata: {
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-19'),
        createdBy: 'mock-provider',
        aiGenerated: false,
        version: '1.0.0'
      }
    };

    // HeroSection type (component)
    const heroSection: UniversalContentType = {
      version: '1.0.0',
      id: 'hero-section',
      name: 'Hero Section',
      type: 'component',
      description: 'A hero section component with headline, subheading, and CTA',
      isRoutable: false,
      fields: [
        {
          id: 'headline',
          name: 'Headline',
          layer: 'primitive',
          type: 'text',
          description: 'Main headline text',
          required: true,
          validations: [
            { type: 'required', message: 'Headline is required' },
            { type: 'max', value: 80, message: 'Headline must be less than 80 characters' }
          ]
        },
        {
          id: 'subheading',
          name: 'Subheading',
          layer: 'primitive',
          type: 'longText',
          description: 'Supporting subheading text',
          required: false,
          validations: [
            { type: 'max', value: 200, message: 'Subheading must be less than 200 characters' }
          ]
        },
        {
          id: 'ctaButton',
          name: 'CTA Button',
          layer: 'common',
          type: 'component',
          description: 'Call-to-action button configuration',
          required: false
        },
        {
          id: 'backgroundImage',
          name: 'Background Image',
          layer: 'common',
          type: 'media',
          description: 'Hero section background image',
          required: false
        },
        {
          id: 'alignment',
          name: 'Text Alignment',
          layer: 'common',
          type: 'select',
          description: 'Text alignment option',
          defaultValue: 'center',
          platformSpecific: {
            options: ['left', 'center', 'right']
          }
        }
      ],
      metadata: {
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-19'),
        createdBy: 'mock-provider',
        aiGenerated: false,
        version: '1.0.0'
      }
    };

    // ProductCard type (component) - Additional example
    const productCard: UniversalContentType = {
      version: '1.0.0',
      id: 'product-card',
      name: 'Product Card',
      type: 'component',
      description: 'A product card component for e-commerce',
      isRoutable: false,
      fields: [
        {
          id: 'productName',
          name: 'Product Name',
          layer: 'primitive',
          type: 'text',
          required: true
        },
        {
          id: 'price',
          name: 'Price',
          layer: 'primitive',
          type: 'decimal',
          required: true
        },
        {
          id: 'inStock',
          name: 'In Stock',
          layer: 'primitive',
          type: 'boolean',
          defaultValue: true
        },
        {
          id: 'images',
          name: 'Product Images',
          layer: 'common',
          type: 'collection',
          description: 'Multiple product images'
        }
      ],
      metadata: {
        createdAt: new Date('2025-01-19'),
        updatedAt: new Date('2025-01-19'),
        createdBy: 'mock-provider',
        aiGenerated: true,
        aiModel: 'gpt-4',
        version: '1.0.0'
      }
    };

    // Add to content types map
    this.contentTypes.set(blogPost.id, blogPost);
    this.contentTypes.set(heroSection.id, heroSection);
    this.contentTypes.set(productCard.id, productCard);
  }

  async getContentTypes(): Promise<UniversalContentType[]> {
    // Simulate async operation
    await this.simulateLatency(50);
    return Array.from(this.contentTypes.values());
  }

  async getContentType(id: string): Promise<UniversalContentType | null> {
    await this.simulateLatency(10);
    return this.contentTypes.get(id) || null;
  }

  async createContentType(type: UniversalContentType): Promise<UniversalContentType> {
    await this.simulateLatency(20);
    
    // Validate first
    const validation = await this.validateContentType(type);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
    }

    // Add metadata if not present
    if (!type.metadata) {
      type.metadata = {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-provider',
        version: '1.0.0'
      };
    }

    this.contentTypes.set(type.id, type);
    return type;
  }

  async updateContentType(id: string, type: UniversalContentType): Promise<UniversalContentType> {
    await this.simulateLatency(20);
    
    if (!this.contentTypes.has(id)) {
      throw new Error(`Content type '${id}' not found`);
    }

    // Validate first
    const validation = await this.validateContentType(type);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
    }

    // Update metadata
    type.metadata = {
      ...type.metadata,
      updatedAt: new Date(),
      updatedBy: 'mock-provider'
    };

    this.contentTypes.set(id, type);
    return type;
  }

  async deleteContentType(id: string): Promise<boolean> {
    await this.simulateLatency(20);
    return this.contentTypes.delete(id);
  }

  async validateContentType(type: UniversalContentType): Promise<ValidationResult> {
    await this.simulateLatency(20);
    
    const errors: Array<{ field: string; message: string; code?: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // Basic validation rules
    if (!type.id) {
      errors.push({ field: 'id', message: 'Content type ID is required', code: 'REQUIRED' });
    }
    if (!type.name) {
      errors.push({ field: 'name', message: 'Content type name is required', code: 'REQUIRED' });
    }
    if (!type.type) {
      errors.push({ field: 'type', message: 'Content type classification is required', code: 'REQUIRED' });
    }
    if (!type.fields || type.fields.length === 0) {
      errors.push({ field: 'fields', message: 'At least one field is required', code: 'MIN_LENGTH' });
    }

    // Validate fields
    type.fields?.forEach((field, index) => {
      if (!field.id) {
        errors.push({ field: `fields[${index}].id`, message: 'Field ID is required', code: 'REQUIRED' });
      }
      if (!field.name) {
        errors.push({ field: `fields[${index}].name`, message: 'Field name is required', code: 'REQUIRED' });
      }
      if (!field.layer) {
        errors.push({ field: `fields[${index}].layer`, message: 'Field layer is required', code: 'REQUIRED' });
      }
      if (!field.type) {
        errors.push({ field: `fields[${index}].type`, message: 'Field type is required', code: 'REQUIRED' });
      }
    });

    // Warnings for best practices
    if (!type.description) {
      warnings.push({ field: 'description', message: 'Consider adding a description for better documentation' });
    }
    if (type.fields?.length > 50) {
      warnings.push({ field: 'fields', message: 'Content type has many fields, consider splitting into components' });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  getProviderCapabilities(): ProviderCapabilities {
    return {
      supportsComponents: true,
      supportsPages: true,
      supportsRichText: true,
      supportsMedia: true,
      supportsReferences: true,
      supportsLocalizations: false,
      supportsVersioning: false,
      supportsScheduling: false,
      supportsWebhooks: false,
      customCapabilities: {
        supportsMockData: true,
        supportsCustomExtensions: true
      }
    };
  }

  mapToUniversal(nativeType: any): UniversalContentType {
    // Mock implementation - in real providers this would transform platform-specific format
    return nativeType as UniversalContentType;
  }

  mapFromUniversal(universalType: UniversalContentType): any {
    // Mock implementation - in real providers this would transform to platform-specific format
    return universalType;
  }

  /**
   * Simulate network latency for testing
   */
  private async simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get provider ID
   */
  getProviderId(): string {
    return this.providerId;
  }
}