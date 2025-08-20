import { OptimizelyProvider } from '../OptimizelyProvider';
import { OptimizelyClient } from '../client';
import { UniversalContentType } from '../../universal/types';
import { OptimizelyContentType } from '../types';

// Mock the client
jest.mock('../client');

describe('OptimizelyProvider', () => {
  let provider: OptimizelyProvider;
  let mockClient: jest.Mocked<OptimizelyClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create provider instance
    provider = new OptimizelyProvider();
    
    // Get the mocked client
    mockClient = (provider as any).client as jest.Mocked<OptimizelyClient>;
  });

  describe('getContentTypes', () => {
    it('should fetch and transform content types', async () => {
      const mockOptimizelyTypes: OptimizelyContentType[] = [
        {
          key: 'TestType',
          displayName: 'Test Type',
          description: 'Test description',
          baseType: '_component',
          source: 'test',
          sortOrder: 100,
          mayContainTypes: [],
          properties: {
            title: {
              type: 'String',
              displayName: 'Title',
              required: true,
              description: 'Title field'
            }
          }
        }
      ];

      mockClient.getContentTypes.mockResolvedValue(mockOptimizelyTypes);

      const result = await provider.getContentTypes();

      expect(mockClient.getContentTypes).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TestType');
      expect(result[0].name).toBe('TestType');
      expect(result[0].type).toBe('component');
    });

    it('should handle errors gracefully', async () => {
      mockClient.getContentTypes.mockRejectedValue(new Error('Connection failed'));

      await expect(provider.getContentTypes()).rejects.toThrow('Failed to fetch content types');
    });
  });

  describe('getContentType', () => {
    it('should fetch and transform a single content type', async () => {
      const mockOptimizelyType: OptimizelyContentType = {
        key: 'TestType',
        displayName: 'Test Type',
        description: 'Test description',
        baseType: '_page',
        source: 'test',
        sortOrder: 100,
        mayContainTypes: [],
        properties: {}
      };

      mockClient.getContentType.mockResolvedValue(mockOptimizelyType);

      const result = await provider.getContentType('TestType');

      expect(mockClient.getContentType).toHaveBeenCalledWith('TestType');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('TestType');
      expect(result?.type).toBe('page');
    });

    it('should return null for non-existent content type', async () => {
      mockClient.getContentType.mockResolvedValue(null);

      const result = await provider.getContentType('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('createContentType', () => {
    it('should transform and create content type', async () => {
      const universalType: UniversalContentType = {
        version: '1.0',
        id: 'NewType',
        name: 'NewType',
        type: 'component',
        description: 'New type description',
        isRoutable: false,
        fields: [
          {
            id: 'field_title',
            name: 'title',
            layer: 'primitive',
            type: 'text',
            required: true,
            validations: []
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const mockCreatedType: OptimizelyContentType = {
        key: 'NewType',
        displayName: 'NewType',
        description: 'New type description',
        baseType: '_component',
        source: 'catalyst-studio-sync',
        sortOrder: 100,
        mayContainTypes: [],
        properties: {
          title: {
            type: 'String',
            displayName: 'title',
            required: true
          }
        }
      };

      mockClient.createContentType.mockResolvedValue(mockCreatedType);

      const result = await provider.createContentType(universalType);

      expect(mockClient.createContentType).toHaveBeenCalled();
      expect(result.id).toBe('NewType');
    });
  });

  describe('validateContentType', () => {
    it('should validate content type and return validation result', async () => {
      const universalType: UniversalContentType = {
        version: '1.0',
        id: 'TestType',
        name: 'TestType',
        type: 'component',
        isRoutable: false,
        fields: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockClient.validateContentType.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['Minor issue']
      });

      const result = await provider.validateContentType(universalType);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('getProviderCapabilities', () => {
    it('should return Optimizely provider capabilities', () => {
      const capabilities = provider.getProviderCapabilities();

      expect(capabilities.supportsComponents).toBe(true);
      expect(capabilities.supportsPages).toBe(true);
      expect(capabilities.supportsRichText).toBe(true);
      expect(capabilities.supportsVersioning).toBe(true);
      expect(capabilities.customCapabilities).toBeDefined();
    });
  });

  describe('mapToUniversal', () => {
    it('should transform Optimizely type to Universal format', () => {
      const optimizelyType: OptimizelyContentType = {
        key: 'TestType',
        displayName: 'Test Type',
        description: 'Test description',
        baseType: '_component',
        source: 'test',
        sortOrder: 100,
        mayContainTypes: [],
        properties: {
          title: {
            type: 'String',
            displayName: 'Title',
            required: true
          }
        }
      };

      const result = provider.mapToUniversal(optimizelyType);

      expect(result.id).toBe('TestType');
      expect(result.type).toBe('component');
      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].name).toBe('title');
    });
  });

  describe('mapFromUniversal', () => {
    it('should transform Universal type to Optimizely format', () => {
      const universalType: UniversalContentType = {
        version: '1.0',
        id: 'TestType',
        name: 'TestType',
        type: 'page',
        description: 'Test description',
        isRoutable: true,
        fields: [
          {
            id: 'field_title',
            name: 'title',
            layer: 'primitive',
            type: 'text',
            required: true,
            validations: []
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const result = provider.mapFromUniversal(universalType);

      expect(result.key).toBe('TestType');
      expect(result.baseType).toBe('_page');
      expect(result.properties.title).toBeDefined();
      expect(result.properties.title.type).toBe('String');
    });
  });
});