/**
 * Type Converter - Convert between type layers
 * Handles conversion between primitives, patterns, and extensions
 */

import { Primitive, PrimitiveType } from '../types/primitives';
import { CommonPatternType, CommonPattern, PatternComposer } from '../types/common-patterns';
import { PlatformExtension } from '../types/extensions';
import { PatternTransformer } from '../transformers/pattern-transformer';

/**
 * Type conversion result
 */
export interface ConversionResult {
  success: boolean;
  output: Primitive | CommonPatternType | PlatformExtension;
  confidence: number;
  dataLoss: string[];
  transformations: string[];
}

/**
 * Type layer enumeration
 */
export enum TypeLayer {
  PRIMITIVE = 'primitive',
  PATTERN = 'pattern',
  EXTENSION = 'extension'
}

/**
 * Type converter class
 */
export class TypeConverter {
  /**
   * Convert between type layers
   */
  static convert(
    source: Primitive | CommonPatternType | PlatformExtension,
    targetLayer: TypeLayer,
    options?: ConversionOptions
  ): ConversionResult {
    const sourceLayer = this.identifyLayer(source);

    if (sourceLayer === targetLayer) {
      return {
        success: true,
        output: source,
        confidence: 100,
        dataLoss: [],
        transformations: []
      };
    }

    switch (`${sourceLayer}->${targetLayer}`) {
      case 'primitive->pattern':
        return this.primitiveToPattern(source as Primitive, options);
      case 'pattern->primitive':
        return this.patternToPrimitive(source as CommonPatternType, options);
      case 'primitive->extension':
        return this.primitiveToExtension(source as Primitive, options);
      case 'extension->primitive':
        return this.extensionToPrimitive(source as PlatformExtension, options);
      case 'pattern->extension':
        return this.patternToExtension(source as CommonPatternType, options);
      case 'extension->pattern':
        return this.extensionToPattern(source as PlatformExtension, options);
      default:
        return {
          success: false,
          output: source,
          confidence: 0,
          dataLoss: ['Unknown conversion path'],
          transformations: []
        };
    }
  }

  /**
   * Handle type composition
   */
  static compose(
    types: Array<Primitive | CommonPatternType>,
    targetPattern: CommonPattern
  ): ConversionResult {
    const primitives = types.filter(t => 'type' in t) as Primitive[];
    const composed = PatternComposer.composeFromPrimitives(targetPattern, primitives);

    if (!composed) {
      return {
        success: false,
        output: { type: PrimitiveType.JSON },
        confidence: 0,
        dataLoss: ['Cannot compose pattern from given types'],
        transformations: []
      };
    }

    return {
      success: true,
      output: composed,
      confidence: 85,
      dataLoss: [],
      transformations: [`Composed ${targetPattern} from ${primitives.length} primitives`]
    };
  }

  /**
   * Manage type inheritance
   */
  static inherit(
    baseType: Primitive | CommonPatternType,
    extensions: Partial<Primitive | CommonPatternType>
  ): Primitive | CommonPatternType {
    if ('type' in baseType) {
      // Primitive inheritance
      return {
        ...baseType,
        ...extensions
      } as Primitive;
    } else if ('pattern' in baseType) {
      // Pattern inheritance
      return {
        ...baseType,
        ...extensions
      } as CommonPatternType;
    }

    return baseType;
  }

  /**
   * Private conversion methods
   */

  private static primitiveToPattern(
    primitive: Primitive,
    options?: ConversionOptions
  ): ConversionResult {
    const targetPattern = options?.targetPattern;
    const dataLoss: string[] = [];
    const transformations: string[] = [];

    // Try to upgrade primitive to pattern
    let pattern: CommonPatternType | null = null;
    let confidence = 0;

    switch (primitive.type) {
      case PrimitiveType.TEXT:
        if (targetPattern === CommonPattern.SLUG) {
          pattern = {
            pattern: CommonPattern.SLUG,
            editable: true,
            maxLength: primitive.maxLength || 255,
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.TEXT
          };
          confidence = 95;
          transformations.push('Text upgraded to slug pattern');
        } else if (targetPattern === CommonPattern.SELECT) {
          pattern = {
            pattern: CommonPattern.SELECT,
            options: [],
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.TEXT
          };
          confidence = 80;
          transformations.push('Text upgraded to select pattern');
          dataLoss.push('No options defined');
        }
        break;

      case PrimitiveType.LONG_TEXT:
        if (!targetPattern || targetPattern === CommonPattern.RICH_TEXT) {
          pattern = {
            pattern: CommonPattern.RICH_TEXT,
            format: 'markdown',
            maxLength: primitive.maxLength,
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.LONG_TEXT
          };
          confidence = 90;
          transformations.push('Long text upgraded to rich text pattern');
        }
        break;

      case PrimitiveType.JSON:
        if (targetPattern === CommonPattern.COLLECTION) {
          pattern = {
            pattern: CommonPattern.COLLECTION,
            itemType: { type: PrimitiveType.JSON },
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.JSON
          };
          confidence = 85;
          transformations.push('JSON upgraded to collection pattern');
        } else if (targetPattern === CommonPattern.COMPONENT) {
          pattern = {
            pattern: CommonPattern.COMPONENT,
            componentSchema: primitive.schema,
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.JSON
          };
          confidence = 85;
          transformations.push('JSON upgraded to component pattern');
        } else if (targetPattern === CommonPattern.TAGS) {
          pattern = {
            pattern: CommonPattern.TAGS,
            allowCustomTags: true,
            required: primitive.required,
            description: primitive.description,
            fallbackPrimitive: PrimitiveType.JSON
          };
          confidence = 85;
          transformations.push('JSON upgraded to tags pattern');
        }
        break;
    }

    if (!pattern) {
      return {
        success: false,
        output: primitive,
        confidence: 0,
        dataLoss: ['Cannot convert primitive to pattern'],
        transformations: []
      };
    }

    return {
      success: true,
      output: pattern,
      confidence,
      dataLoss,
      transformations
    };
  }

  private static patternToPrimitive(
    pattern: CommonPatternType,
    options?: ConversionOptions
  ): ConversionResult {
    const result = PatternTransformer.transformToFallback(pattern);
    
    return {
      success: true,
      output: result.target,
      confidence: result.confidence,
      dataLoss: result.dataLoss,
      transformations: [`Pattern ${pattern.pattern} converted to primitive`]
    };
  }

  private static primitiveToExtension(
    primitive: Primitive,
    options?: ConversionOptions
  ): ConversionResult {
    if (!options?.platform) {
      return {
        success: false,
        output: primitive,
        confidence: 0,
        dataLoss: ['Platform required for extension conversion'],
        transformations: []
      };
    }

    // Create a basic extension wrapper
    const extension: PlatformExtension = {
      id: `custom-${primitive.type}`,
      platform: options.platform,
      name: `Custom ${primitive.type}`,
      description: primitive.description || '',
      version: '1.0.0',
      extendsType: primitive,
      platformProperties: {},
      transformationConfidence: 100,
      features: []
    };

    return {
      success: true,
      output: extension,
      confidence: 90,
      dataLoss: [],
      transformations: [`Primitive wrapped as ${options.platform} extension`]
    };
  }

  private static extensionToPrimitive(
    extension: PlatformExtension,
    options?: ConversionOptions
  ): ConversionResult {
    const baseType = extension.extendsType;
    
    if ('type' in baseType) {
      return {
        success: true,
        output: baseType,
        confidence: extension.transformationConfidence,
        dataLoss: extension.features
          .filter(f => !f.universal)
          .map(f => `Platform feature lost: ${f.name}`),
        transformations: [`Extension converted to base primitive ${baseType.type}`]
      };
    }

    // Extension extends a pattern, need to go pattern->primitive
    return this.patternToPrimitive(baseType as CommonPatternType, options);
  }

  private static patternToExtension(
    pattern: CommonPatternType,
    options?: ConversionOptions
  ): ConversionResult {
    if (!options?.platform) {
      return {
        success: false,
        output: pattern,
        confidence: 0,
        dataLoss: ['Platform required for extension conversion'],
        transformations: []
      };
    }

    // Create extension from pattern
    const extension: PlatformExtension = {
      id: `custom-${pattern.pattern}`,
      platform: options.platform,
      name: `Custom ${pattern.pattern}`,
      description: pattern.description || '',
      version: '1.0.0',
      extendsType: pattern,
      platformProperties: {},
      transformationConfidence: 85,
      features: this.extractPatternFeatures(pattern)
    };

    return {
      success: true,
      output: extension,
      confidence: 85,
      dataLoss: [],
      transformations: [`Pattern wrapped as ${options.platform} extension`]
    };
  }

  private static extensionToPattern(
    extension: PlatformExtension,
    options?: ConversionOptions
  ): ConversionResult {
    const baseType = extension.extendsType;
    
    if ('pattern' in baseType) {
      return {
        success: true,
        output: baseType,
        confidence: extension.transformationConfidence,
        dataLoss: extension.features
          .filter(f => !f.universal)
          .map(f => `Platform feature lost: ${f.name}`),
        transformations: [`Extension converted to base pattern ${baseType.pattern}`]
      };
    }

    // Extension extends a primitive, try to upgrade to pattern
    return this.primitiveToPattern(baseType as Primitive, options);
  }

  /**
   * Helper methods
   */

  private static identifyLayer(
    type: Primitive | CommonPatternType | PlatformExtension
  ): TypeLayer {
    if ('id' in type && 'platform' in type) {
      return TypeLayer.EXTENSION;
    }
    if ('pattern' in type) {
      return TypeLayer.PATTERN;
    }
    if ('type' in type) {
      return TypeLayer.PRIMITIVE;
    }
    throw new Error('Unknown type structure');
  }

  private static extractPatternFeatures(pattern: CommonPatternType): any[] {
    const features: any[] = [];

    switch (pattern.pattern) {
      case CommonPattern.RICH_TEXT:
        features.push({
          name: 'Rich formatting',
          description: 'Support for formatted text',
          universal: true
        });
        break;
      case CommonPattern.MEDIA:
        features.push({
          name: 'Media handling',
          description: 'Support for images and files',
          universal: true
        });
        break;
      case CommonPattern.COLLECTION:
        features.push({
          name: 'Multiple items',
          description: 'Support for lists of items',
          universal: true
        });
        break;
      // Add more pattern features as needed
    }

    return features;
  }
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  targetPattern?: CommonPattern;
  platform?: string;
  preserveMetadata?: boolean;
  maxDataLoss?: number;
}

/**
 * Type composition helper
 */
export class TypeComposer {
  /**
   * Compose complex type from simpler types
   */
  static composeComplex(
    components: Array<{
      name: string;
      type: Primitive | CommonPatternType;
      required?: boolean;
    }>
  ): CommonPatternType {
    return {
      pattern: CommonPattern.COMPONENT,
      componentSchema: {
        type: 'object',
        properties: components.reduce((props, comp) => {
          props[comp.name] = this.typeToSchema(comp.type);
          return props;
        }, {} as any),
        required: components
          .filter(c => c.required)
          .map(c => c.name)
      },
      fallbackPrimitive: PrimitiveType.JSON
    };
  }

  private static typeToSchema(type: Primitive | CommonPatternType): any {
    if ('type' in type) {
      switch (type.type) {
        case PrimitiveType.TEXT:
        case PrimitiveType.LONG_TEXT:
          return { type: 'string' };
        case PrimitiveType.NUMBER:
        case PrimitiveType.DECIMAL:
          return { type: 'number' };
        case PrimitiveType.BOOLEAN:
          return { type: 'boolean' };
        case PrimitiveType.DATE:
          return { type: 'string', format: 'date-time' };
        case PrimitiveType.JSON:
          return { type: 'object' };
        default:
          return { type: 'any' };
      }
    }
    
    return { type: 'object' };
  }
}