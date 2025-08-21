/**
 * Test file demonstrating the new type system architecture with Optimizely
 */

import { createTypeSystem, TypeSystem } from '../universal/type-system';
import { createOptimizelyProvider } from './type-provider';
import { PrimitiveType } from '../universal/types/primitives';
import { CommonPattern } from '../universal/types/common-patterns';
import { TypeSystemRegistry } from '../universal/registry/type-system-registry';

describe('Optimizely Type Provider', () => {
  let typeSystem: TypeSystem;

  beforeEach(() => {
    // Reset the singleton registry before each test
    TypeSystemRegistry.resetInstance();
    
    // Create type system with Optimizely provider
    typeSystem = createTypeSystem({
      providers: [createOptimizelyProvider()],
      defaultPlatform: 'optimizely',
      allowOverride: true // Allow override for test isolation
    });
  });

  afterEach(() => {
    // Clean up the type system after each test
    if (typeSystem && typeof (typeSystem as any).clear === 'function') {
      (typeSystem as any).clear();
    }
    // Reset the singleton registry after each test
    TypeSystemRegistry.resetInstance();
  });

  describe('Platform Registration', () => {
    it('should register Optimizely provider', () => {
      expect(typeSystem.isPlatformSupported('optimizely')).toBe(true);
      expect(typeSystem.getPlatforms()).toContain('optimizely');
    });
  });

  describe('Type Compatibility', () => {
    it('should check primitive type compatibility', () => {
      const result = typeSystem.checkCompatibility(PrimitiveType.TEXT, 'optimizely');
      
      expect(result.compatible).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.warnings).toHaveLength(0);
    });

    it('should check pattern compatibility', () => {
      const result = typeSystem.checkCompatibility(CommonPattern.RICH_TEXT, 'optimizely');
      
      expect(result.compatible).toBe(true);
      expect(result.confidence).toBe(90);
      expect(result.warnings).toContain('Transformation required');
    });

    it('should handle low compatibility types', () => {
      const result = typeSystem.checkCompatibility(CommonPattern.REPEATER, 'optimizely');
      
      expect(result.compatible).toBe(true);
      expect(result.confidence).toBe(80);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Type Validation', () => {
    it('should validate text primitive', () => {
      const textType = {
        type: PrimitiveType.TEXT,
        maxLength: 255,
        required: true
      };

      const result = typeSystem.validate(textType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate with platform-specific rules', () => {
      const jsonType = {
        type: PrimitiveType.JSON,
        required: true
      };

      const result = typeSystem.validate(jsonType, 'optimizely');
      
      expect(result.valid).toBe(true);
      // JSON is stored as string in Optimizely
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Value Transformation', () => {
    it('should transform XhtmlString to universal format', () => {
      const htmlContent = '<p>Hello <strong>World</strong></p>';
      
      // This would transform from Optimizely XhtmlString to universal rich text
      const provider = createOptimizelyProvider();
      const result = provider.transformToUniversal(
        htmlContent,
        'XhtmlString',
        CommonPattern.RICH_TEXT
      );

      expect(result.success).toBe(true);
      expect(result.value).toHaveProperty('content', htmlContent);
      expect(result.value).toHaveProperty('format', 'html');
      expect(result.value.metadata.originalPlatform).toBe('optimizely');
    });

    it('should transform ContentArea to universal collection', () => {
      const contentArea = {
        items: [
          {
            contentLink: { id: 123, type: 'Block' },
            displayOption: 'full',
            content: { title: 'Test Block' }
          }
        ]
      };

      const provider = createOptimizelyProvider();
      const result = provider.transformToUniversal(
        contentArea,
        'ContentArea',
        CommonPattern.COLLECTION
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value[0]).toHaveProperty('id', 123);
      expect(result.value[0]).toHaveProperty('displayOption', 'full');
    });
  });

  describe('Platform Extensions', () => {
    it('should retrieve Optimizely extensions', () => {
      const extensions = typeSystem.getExtensions('optimizely');
      
      expect(extensions.length).toBeGreaterThan(0);
      
      const contentAreaExtension = extensions.find(e => e.id === 'content-area');
      expect(contentAreaExtension).toBeDefined();
      expect(contentAreaExtension?.platform).toBe('optimizely');
      expect(contentAreaExtension?.name).toBe('Content Area');
    });

    it('should get specific extension features', () => {
      const extensions = typeSystem.getExtensions('optimizely');
      const blockExtension = extensions.find(e => e.id === 'block');
      
      expect(blockExtension).toBeDefined();
      expect(blockExtension?.features).toContainEqual(
        expect.objectContaining({
          name: 'Shared Blocks',
          universal: true
        })
      );
    });
  });

  describe('No Platform Coupling', () => {
    it('should work without knowing platform internals', () => {
      // External modules only need to know the platform ID
      const platformId = 'optimizely';
      
      // Check support
      const supported = typeSystem.isPlatformSupported(platformId);
      expect(supported).toBe(true);

      // Use types without knowing Optimizely specifics
      const compatibility = typeSystem.checkCompatibility(
        PrimitiveType.TEXT,
        platformId
      );
      expect(compatibility.compatible).toBe(true);

      // Validate without platform knowledge
      const validation = typeSystem.validate(
        { type: PrimitiveType.NUMBER, required: true },
        platformId
      );
      expect(validation.valid).toBe(true);
    });
  });
});

/**
 * Example usage for external modules
 */
export function exampleUsage() {
  // 1. Create type system with provider
  const typeSystem = createTypeSystem({
    providers: [createOptimizelyProvider()],
    defaultPlatform: 'optimizely'
  });

  // 2. Check compatibility
  const isCompatible = typeSystem.checkCompatibility(PrimitiveType.TEXT);
  console.log('Text type compatible:', isCompatible.compatible);

  // 3. Validate a type
  const validation = typeSystem.validate({
    type: PrimitiveType.TEXT,
    maxLength: 255,
    required: true
  });
  console.log('Validation result:', validation.valid);

  // 4. Get extensions
  const extensions = typeSystem.getExtensions('optimizely');
  console.log('Available extensions:', extensions.map(e => e.name));

  // That's it! No need to know about Optimizely internals
}