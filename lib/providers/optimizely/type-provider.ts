/**
 * Optimizely Type Provider - Platform-specific type implementation
 * Contains all Optimizely-specific type knowledge and transformations
 */

import {
  ITypeProvider,
  PlatformMapping,
  TransformationResult
} from '../universal/interfaces/type-provider';
import { PrimitiveType } from '../universal/types/primitives';
import { CommonPattern } from '../universal/types/common-patterns';
import { 
  PlatformExtension, 
  PlatformCapabilities,
  PlatformCapabilitiesRegistry 
} from '../universal/types/extensions';
import optimizelyExtensions from './type-extensions/index';

/**
 * Optimizely type provider implementation
 */
export class OptimizelyTypeProvider implements ITypeProvider {
  private compatibilityMap: Map<PrimitiveType | CommonPattern, PlatformMapping> = new Map();
  private extensions: Map<string, PlatformExtension> = new Map();

  constructor() {
    this.initializeCompatibilityMap();
    this.initializeExtensions();
    this.registerPlatformCapabilities();
  }

  getPlatformId(): string {
    return 'optimizely';
  }

  getPlatformName(): string {
    return 'Optimizely CMS';
  }

  getCompatibilityMapping(universalType: PrimitiveType | CommonPattern): PlatformMapping | undefined {
    return this.compatibilityMap.get(universalType);
  }

  getExtensions(): PlatformExtension[] {
    return Array.from(this.extensions.values());
  }

  getExtension(id: string): PlatformExtension | undefined {
    return this.extensions.get(id);
  }

  transformToUniversal(
    value: any,
    nativeType: string,
    universalType: PrimitiveType | CommonPattern
  ): TransformationResult {
    // Platform-specific transformation logic
    switch (nativeType) {
      case 'XhtmlString':
        return this.transformXhtmlToUniversal(value);
      case 'ContentArea':
        return this.transformContentAreaToUniversal(value);
      case 'ContentReference':
        return this.transformContentReferenceToUniversal(value);
      default:
        return {
          success: true,
          value,
          confidence: 100,
          warnings: []
        };
    }
  }

  transformFromUniversal(
    value: any,
    universalType: PrimitiveType | CommonPattern,
    nativeType: string
  ): TransformationResult {
    // Platform-specific transformation logic
    switch (nativeType) {
      case 'XhtmlString':
        return this.transformUniversalToXhtml(value);
      case 'ContentArea':
        return this.transformUniversalToContentArea(value);
      case 'ContentReference':
        return this.transformUniversalToContentReference(value);
      default:
        return {
          success: true,
          value,
          confidence: 100,
          warnings: []
        };
    }
  }

  supportsType(universalType: PrimitiveType | CommonPattern): boolean {
    return this.compatibilityMap.has(universalType);
  }

  getCapabilities(): string[] {
    return [
      'content-areas',
      'blocks',
      'personalization',
      'versioning',
      'rich-text',
      'references',
      'select-fields',
      'link-validation',
      'nested-components'
    ];
  }

  validateValue(value: any, nativeType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (nativeType) {
      case 'String':
        if (typeof value !== 'string') {
          errors.push('Value must be a string');
        }
        break;
      case 'Int32':
        if (!Number.isInteger(value)) {
          errors.push('Value must be an integer');
        }
        break;
      case 'Boolean':
        if (typeof value !== 'boolean') {
          errors.push('Value must be a boolean');
        }
        break;
      case 'DateTime':
        if (!(value instanceof Date) && !Date.parse(value)) {
          errors.push('Value must be a valid date');
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Initialize compatibility mappings
   */
  private initializeCompatibilityMap(): void {
    this.compatibilityMap = new Map();

    // Primitive mappings
    this.compatibilityMap.set(PrimitiveType.TEXT, {
      nativeType: 'String',
      confidence: 100,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(PrimitiveType.LONG_TEXT, {
      nativeType: 'String',
      confidence: 95,
      transformationRequired: false,
      dataLossRisk: 'none',
      notes: 'No distinction between short and long text'
    });

    this.compatibilityMap.set(PrimitiveType.NUMBER, {
      nativeType: 'Int32',
      confidence: 95,
      transformationRequired: false,
      dataLossRisk: 'low',
      notes: 'Floats need Double type'
    });

    this.compatibilityMap.set(PrimitiveType.BOOLEAN, {
      nativeType: 'Boolean',
      confidence: 100,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(PrimitiveType.DATE, {
      nativeType: 'DateTime',
      confidence: 100,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(PrimitiveType.JSON, {
      nativeType: 'String',
      confidence: 80,
      transformationRequired: true,
      dataLossRisk: 'low',
      notes: 'Stored as JSON string'
    });

    this.compatibilityMap.set(PrimitiveType.DECIMAL, {
      nativeType: 'Decimal',
      confidence: 100,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    // Pattern mappings
    this.compatibilityMap.set(CommonPattern.RICH_TEXT, {
      nativeType: 'XhtmlString',
      confidence: 90,
      transformationRequired: true,
      dataLossRisk: 'low',
      notes: 'HTML to/from Markdown conversion'
    });

    this.compatibilityMap.set(CommonPattern.MEDIA, {
      nativeType: 'ContentReference',
      confidence: 85,
      transformationRequired: true,
      dataLossRisk: 'low',
      notes: 'Reference to media content'
    });

    this.compatibilityMap.set(CommonPattern.COLLECTION, {
      nativeType: 'IList<T>',
      confidence: 90,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(CommonPattern.COMPONENT, {
      nativeType: 'Block',
      confidence: 95,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(CommonPattern.SELECT, {
      nativeType: 'SelectOne',
      confidence: 100,
      transformationRequired: false,
      dataLossRisk: 'none'
    });

    this.compatibilityMap.set(CommonPattern.REPEATER, {
      nativeType: 'ContentArea',
      confidence: 80,
      transformationRequired: true,
      dataLossRisk: 'medium',
      notes: 'Different structure'
    });

    this.compatibilityMap.set(CommonPattern.SLUG, {
      nativeType: 'String',
      confidence: 85,
      transformationRequired: true,
      dataLossRisk: 'low',
      notes: 'With URL segment'
    });

    this.compatibilityMap.set(CommonPattern.TAGS, {
      nativeType: 'IList<String>',
      confidence: 85,
      transformationRequired: true,
      dataLossRisk: 'low',
      notes: 'List of strings'
    });
  }

  /**
   * Initialize platform extensions
   */
  private initializeExtensions(): void {
    this.extensions = new Map();
    
    for (const extension of optimizelyExtensions) {
      this.extensions.set(extension.id, extension);
    }
  }

  /**
   * Transform XhtmlString to universal rich text
   */
  private transformXhtmlToUniversal(value: any): TransformationResult {
    if (typeof value !== 'string') {
      return {
        success: false,
        value: '',
        confidence: 0,
        warnings: ['Invalid XhtmlString value']
      };
    }

    return {
      success: true,
      value: {
        content: value,
        format: 'html',
        metadata: {
          originalPlatform: 'optimizely',
          editorType: 'TinyMCE'
        }
      },
      confidence: 85,
      warnings: []
    };
  }

  /**
   * Transform universal rich text to XhtmlString
   */
  private transformUniversalToXhtml(value: any): TransformationResult {
    if (typeof value === 'string') {
      return {
        success: true,
        value,
        confidence: 100,
        warnings: []
      };
    }

    if (value && value.content) {
      return {
        success: true,
        value: value.content,
        confidence: 90,
        warnings: value.format !== 'html' ? ['Format conversion may be needed'] : []
      };
    }

    return {
      success: false,
      value: '',
      confidence: 0,
      warnings: ['Invalid rich text value']
    };
  }

  /**
   * Transform ContentArea to universal collection
   */
  private transformContentAreaToUniversal(value: any): TransformationResult {
    if (!value || !Array.isArray(value.items)) {
      return {
        success: false,
        value: [],
        confidence: 0,
        warnings: ['Invalid ContentArea value']
      };
    }

    const transformed = value.items.map((item: any) => ({
      id: item.contentLink?.id,
      type: item.contentLink?.type,
      displayOption: item.displayOption,
      personalization: item.personalizationData,
      content: item.content
    }));

    return {
      success: true,
      value: transformed,
      confidence: 85,
      warnings: []
    };
  }

  /**
   * Transform universal collection to ContentArea
   */
  private transformUniversalToContentArea(value: any): TransformationResult {
    if (!Array.isArray(value)) {
      return {
        success: false,
        value: { items: [] },
        confidence: 0,
        warnings: ['Value must be an array']
      };
    }

    const items = value.map((item: any) => ({
      contentLink: {
        id: item.id,
        type: item.type
      },
      displayOption: item.displayOption || 'full',
      personalizationData: item.personalization,
      content: item.content
    }));

    return {
      success: true,
      value: { items },
      confidence: 85,
      warnings: []
    };
  }

  /**
   * Transform ContentReference to universal format
   */
  private transformContentReferenceToUniversal(value: any): TransformationResult {
    return {
      success: true,
      value: {
        id: value?.id,
        workId: value?.workId,
        providerName: value?.providerName
      },
      confidence: 95,
      warnings: []
    };
  }

  /**
   * Transform universal format to ContentReference
   */
  private transformUniversalToContentReference(value: any): TransformationResult {
    return {
      success: true,
      value: {
        id: value?.id,
        workId: value?.workId,
        providerName: value?.providerName || 'default'
      },
      confidence: 95,
      warnings: []
    };
  }

  /**
   * Register Optimizely platform capabilities
   */
  private registerPlatformCapabilities(): void {
    const capabilities: PlatformCapabilities = {
      platform: 'optimizely',
      version: '12+',
      capabilities: [
        'blocks',
        'content-areas',
        'nested-components',
        'page-routing',
        'personalization',
        'a-b-testing',
        'workflows',
        'versioning',
        'localization'
      ],
      limitations: [],
      supportsComponents: true,
      supportsDynamicZones: true,
      supportsReferences: true,
      supportsLocalization: true,
      supportsVersioning: true,
      supportsWorkflows: true
    };

    // Register with the platform capabilities registry
    PlatformCapabilitiesRegistry.register('optimizely', capabilities);
  }
}

/**
 * Factory function to create Optimizely provider
 */
export function createOptimizelyProvider(): ITypeProvider {
  return new OptimizelyTypeProvider();
}