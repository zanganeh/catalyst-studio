import { 
  ICMSProvider, 
  UniversalContentType,
  ProviderCapabilities,
  ValidationResult
} from '../types';

// Additional types that might not be exported yet
interface ContentInstance {
  id: string;
  typeId: string;
  data: Record<string, any>;
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
    version?: string;
    status?: string;
  };
}

interface TransformationResult {
  success: boolean;
  data: any;
  warnings?: string[];
  errors?: string[];
}

interface ProviderMetadata {
  provider: string;
  version: string;
  connected: boolean;
  lastSync?: Date;
  capabilities?: ProviderCapabilities;
}

/**
 * Mock provider for testing without a real CMS
 * Provides deterministic responses and tracks method calls
 */
export class MockProvider implements ICMSProvider {
  readonly id = 'mock';
  readonly name = 'Mock CMS Provider';
  readonly version = '1.0.0';
  
  private contentTypes: Map<string, UniversalContentType> = new Map();
  private contentInstances: Map<string, ContentInstance[]> = new Map();
  private methodCalls: Array<{ method: string; args: any[]; timestamp: Date }> = [];
  private simulateDelay: number = 0;
  private shouldFail: boolean = false;
  private failureMessage: string = 'Mock provider simulated failure';

  constructor() {
    this.initializeTestData();
  }

  /**
   * Initialize with test data fixtures
   */
  private initializeTestData(): void {
    // Add some default test content types
    const blogPost: UniversalContentType = {
      version: '1.0.0',
      id: 'blog-post',
      name: 'Blog Post',
      type: 'page',
      isRoutable: true,
      fields: [
        {
          id: 'title',
          name: 'title',
          layer: 'primitive',
          type: 'text',
          required: true,
          validations: [
            { type: 'required', message: 'Title is required' },
            { type: 'max', value: 200, message: 'Title must be less than 200 characters' }
          ]
        },
        {
          id: 'content',
          name: 'content',
          layer: 'primitive',
          type: 'longText',
          required: true,
          validations: [
            { type: 'required', message: 'Content is required' }
          ]
        },
        {
          id: 'author',
          name: 'author',
          layer: 'primitive',
          type: 'text',
          required: false
        },
        {
          id: 'publishDate',
          name: 'publishDate',
          layer: 'primitive',
          type: 'date',
          required: false
        }
      ],
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: '1.0.0'
      }
    };

    const heroSection: UniversalContentType = {
      version: '1.0.0',
      id: 'hero-section',
      name: 'Hero Section',
      type: 'component',
      isRoutable: false,
      fields: [
        {
          id: 'heading',
          name: 'heading',
          layer: 'primitive',
          type: 'text',
          required: true,
          validations: [
            { type: 'required', message: 'Heading is required' },
            { type: 'max', value: 100, message: 'Heading must be less than 100 characters' }
          ]
        },
        {
          id: 'subheading',
          name: 'subheading',
          layer: 'primitive',
          type: 'text',
          required: false
        },
        {
          id: 'backgroundImage',
          name: 'backgroundImage',
          layer: 'common',
          type: 'media',
          required: false
        },
        {
          id: 'ctaText',
          name: 'ctaText',
          layer: 'primitive',
          type: 'text',
          required: false
        },
        {
          id: 'ctaUrl',
          name: 'ctaUrl',
          layer: 'primitive',
          type: 'text',
          required: false
        }
      ],
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: '1.0.0'
      }
    };

    this.contentTypes.set('blog-post', blogPost);
    this.contentTypes.set('hero-section', heroSection);

    // Add test content instances
    this.contentInstances.set('blog-post', [
      {
        id: 'blog-1',
        typeId: 'blog-post',
        data: {
          title: 'Test Blog Post',
          content: 'This is test content',
          author: 'Test Author',
          publishDate: new Date('2024-01-15')
        },
        metadata: {
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          version: '1.0.0',
          status: 'published'
        }
      }
    ]);
  }

  /**
   * Track method calls for test assertions
   */
  private trackCall(method: string, args: any[]): void {
    this.methodCalls.push({
      method,
      args,
      timestamp: new Date()
    });
  }

  /**
   * Simulate network delay if configured
   */
  private async simulateLatency(): Promise<void> {
    if (this.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulateDelay));
    }
  }

  /**
   * Check if should simulate failure
   */
  private checkFailure(): void {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
  }

  // ICMSProvider Implementation

  async getContentTypes(): Promise<UniversalContentType[]> {
    this.trackCall('getContentTypes', []);
    await this.simulateLatency();
    this.checkFailure();
    
    return Array.from(this.contentTypes.values());
  }

  async getContentType(id: string): Promise<UniversalContentType | null> {
    this.trackCall('getContentType', [id]);
    await this.simulateLatency();
    this.checkFailure();
    
    return this.contentTypes.get(id) || null;
  }

  async createContentType(type: UniversalContentType): Promise<UniversalContentType> {
    this.trackCall('createContentType', [type]);
    await this.simulateLatency();
    this.checkFailure();
    
    if (this.contentTypes.has(type.id)) {
      throw new Error(`Content type ${type.id} already exists`);
    }
    
    const newType = {
      ...type,
      metadata: {
        ...type.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      }
    };
    
    this.contentTypes.set(type.id, newType);
    return newType;
  }

  async updateContentType(id: string, type: Partial<UniversalContentType>): Promise<UniversalContentType> {
    this.trackCall('updateContentType', [id, type]);
    await this.simulateLatency();
    this.checkFailure();
    
    const existing = this.contentTypes.get(id);
    if (!existing) {
      throw new Error(`Content type ${id} not found`);
    }
    
    const updatedType = {
      ...existing,
      ...type,
      id, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        ...type.metadata,
        updatedAt: new Date()
      }
    };
    
    this.contentTypes.set(id, updatedType);
    return updatedType;
  }

  async deleteContentType(id: string): Promise<boolean> {
    this.trackCall('deleteContentType', [id]);
    await this.simulateLatency();
    this.checkFailure();
    
    if (!this.contentTypes.has(id)) {
      throw new Error(`Content type ${id} not found`);
    }
    
    this.contentTypes.delete(id);
    this.contentInstances.delete(id);
    return true;
  }

  async getContentInstances(typeId: string): Promise<ContentInstance[]> {
    this.trackCall('getContentInstances', [typeId]);
    await this.simulateLatency();
    this.checkFailure();
    
    return this.contentInstances.get(typeId) || [];
  }

  async getContentInstance(typeId: string, instanceId: string): Promise<ContentInstance | null> {
    this.trackCall('getContentInstance', [typeId, instanceId]);
    await this.simulateLatency();
    this.checkFailure();
    
    const instances = this.contentInstances.get(typeId) || [];
    return instances.find(i => i.id === instanceId) || null;
  }

  async createContentInstance(instance: ContentInstance): Promise<string> {
    this.trackCall('createContentInstance', [instance]);
    await this.simulateLatency();
    this.checkFailure();
    
    const instances = this.contentInstances.get(instance.typeId) || [];
    const newId = `mock-${Date.now()}`;
    
    instances.push({
      ...instance,
      id: newId,
      metadata: {
        ...instance.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      }
    });
    
    this.contentInstances.set(instance.typeId, instances);
    return newId;
  }

  async updateContentInstance(
    typeId: string, 
    instanceId: string, 
    data: Partial<ContentInstance>
  ): Promise<void> {
    this.trackCall('updateContentInstance', [typeId, instanceId, data]);
    await this.simulateLatency();
    this.checkFailure();
    
    const instances = this.contentInstances.get(typeId) || [];
    const index = instances.findIndex(i => i.id === instanceId);
    
    if (index === -1) {
      throw new Error(`Content instance ${instanceId} not found`);
    }
    
    instances[index] = {
      ...instances[index],
      ...data,
      id: instanceId,
      typeId,
      metadata: {
        ...instances[index].metadata,
        ...data.metadata,
        updatedAt: new Date()
      }
    };
    
    this.contentInstances.set(typeId, instances);
  }

  async deleteContentInstance(typeId: string, instanceId: string): Promise<void> {
    this.trackCall('deleteContentInstance', [typeId, instanceId]);
    await this.simulateLatency();
    this.checkFailure();
    
    const instances = this.contentInstances.get(typeId) || [];
    const filtered = instances.filter(i => i.id !== instanceId);
    
    if (filtered.length === instances.length) {
      throw new Error(`Content instance ${instanceId} not found`);
    }
    
    this.contentInstances.set(typeId, filtered);
  }

  async transform(data: any): Promise<TransformationResult> {
    this.trackCall('transform', [data]);
    await this.simulateLatency();
    this.checkFailure();
    
    return {
      success: true,
      data: data,
      warnings: []
    };
  }

  mapToUniversal(providerSpecific: any): UniversalContentType {
    this.trackCall('mapToUniversal', [providerSpecific]);
    return providerSpecific as UniversalContentType;
  }

  mapFromUniversal(universal: UniversalContentType): any {
    this.trackCall('mapFromUniversal', [universal]);
    return universal;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsVersioning: true,
      supportsLocalizations: true,
      supportsComponents: true,
      supportsPages: true,
      supportsRichText: true,
      supportsMedia: true,
      supportsReferences: true,
      supportsScheduling: false,
      supportsWebhooks: false,
      customCapabilities: {
        supportsTestMode: true,
        supportsMockData: true,
        supportsWorkflow: false,
        supportsContentRelationships: true
      }
    };
  }

  getProviderCapabilities(): ProviderCapabilities {
    // Alias for getCapabilities to match interface
    return this.getCapabilities();
  }

  async validateContentType(type: UniversalContentType): Promise<ValidationResult> {
    this.trackCall('validateContentType', [type]);
    await this.simulateLatency();
    
    const errors: Array<{ field: string; message: string }> = [];
    
    if (!type.id) errors.push({ field: 'id', message: 'Content type ID is required' });
    if (!type.name) errors.push({ field: 'name', message: 'Content type name is required' });
    if (!type.fields || type.fields.length === 0) {
      errors.push({ field: 'fields', message: 'At least one field is required' });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async getMetadata(): Promise<ProviderMetadata> {
    return {
      provider: this.name,
      version: this.version,
      connected: true,
      lastSync: new Date(),
      capabilities: this.getCapabilities()
    };
  }

  // Test helper methods

  /**
   * Configure test behavior
   */
  configure(config: {
    simulateDelay?: number;
    shouldFail?: boolean;
    failureMessage?: string;
  }): void {
    if (config.simulateDelay !== undefined) {
      this.simulateDelay = config.simulateDelay;
    }
    if (config.shouldFail !== undefined) {
      this.shouldFail = config.shouldFail;
    }
    if (config.failureMessage !== undefined) {
      this.failureMessage = config.failureMessage;
    }
  }

  /**
   * Get method call history for test assertions
   */
  getMethodCalls(): Array<{ method: string; args: any[]; timestamp: Date }> {
    return [...this.methodCalls];
  }

  /**
   * Clear method call history
   */
  clearMethodCalls(): void {
    this.methodCalls = [];
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.contentTypes.clear();
    this.contentInstances.clear();
    this.methodCalls = [];
    this.simulateDelay = 0;
    this.shouldFail = false;
    this.initializeTestData();
  }

  /**
   * Add test data
   */
  addTestData(types: UniversalContentType[], instances?: ContentInstance[]): void {
    types.forEach(type => {
      this.contentTypes.set(type.id, type);
    });
    
    if (instances) {
      instances.forEach(instance => {
        const existing = this.contentInstances.get(instance.typeId) || [];
        existing.push(instance);
        this.contentInstances.set(instance.typeId, existing);
      });
    }
  }
}