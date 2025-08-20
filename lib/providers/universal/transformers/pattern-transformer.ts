/**
 * Pattern Transformer - Handles transformations between patterns and primitives
 * Generates confidence scores for each transformation
 */

import { 
  Primitive, 
  PrimitiveType,
  TextPrimitive,
  LongTextPrimitive,
  JsonPrimitive,
  getDefaultValue
} from '../types/primitives';

import { 
  CommonPatternType, 
  CommonPattern,
  PatternComposer,
  RichTextPattern,
  MediaPattern,
  CollectionPattern,
  ComponentPattern,
  SelectPattern,
  RepeaterPattern,
  SlugPattern,
  TagsPattern
} from '../types/common-patterns';

/**
 * Transformation result with confidence score
 */
export interface TransformationResult {
  target: Primitive | CommonPatternType;
  confidence: number;
  dataLoss: string[];
  warnings: string[];
}

/**
 * Pattern transformer class
 */
export class PatternTransformer {
  /**
   * Transform a complex pattern to primitive fallback
   */
  static transformToFallback(pattern: CommonPatternType): TransformationResult {
    switch (pattern.pattern) {
      case CommonPattern.RICH_TEXT:
        return this.transformRichTextToFallback(pattern);
      case CommonPattern.MEDIA:
        return this.transformMediaToFallback(pattern);
      case CommonPattern.COLLECTION:
        return this.transformCollectionToFallback(pattern);
      case CommonPattern.COMPONENT:
        return this.transformComponentToFallback(pattern);
      case CommonPattern.SELECT:
        return this.transformSelectToFallback(pattern);
      case CommonPattern.REPEATER:
        return this.transformRepeaterToFallback(pattern);
      case CommonPattern.SLUG:
        return this.transformSlugToFallback(pattern);
      case CommonPattern.TAGS:
        return this.transformTagsToFallback(pattern);
      default:
        throw new Error(`Unknown pattern type: ${(pattern as any).pattern}`);
    }
  }

  /**
   * Transform rich text pattern to fallback
   */
  private static transformRichTextToFallback(pattern: RichTextPattern): TransformationResult {
    const fallback: LongTextPrimitive = {
      type: PrimitiveType.LONG_TEXT,
      required: pattern.required,
      description: pattern.description || 'Rich text converted to markdown',
      maxLength: pattern.maxLength
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 100;

    if (pattern.format && pattern.format !== 'markdown') {
      dataLoss.push(`Formatting will be converted from ${pattern.format} to markdown`);
      confidence -= 10;
    }

    if (pattern.allowedBlocks && pattern.allowedBlocks.length > 0) {
      warnings.push('Block restrictions will not be enforced in fallback');
      confidence -= 5;
    }

    if (pattern.allowedMarks && pattern.allowedMarks.length > 0) {
      warnings.push('Mark restrictions will not be enforced in fallback');
      confidence -= 5;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform media pattern to fallback
   */
  private static transformMediaToFallback(pattern: MediaPattern): TransformationResult {
    const fallback: JsonPrimitive = {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Media data stored as JSON',
      schema: {
        type: pattern.multiple ? 'array' : 'object',
        properties: {
          url: { type: 'string', required: true },
          alt: { type: 'string' },
          caption: { type: 'string' },
          title: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      }
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 85;

    if (pattern.mediaType && pattern.mediaType !== 'any') {
      warnings.push(`Media type restriction (${pattern.mediaType}) will not be enforced`);
      confidence -= 5;
    }

    if (pattern.allowedMimeTypes) {
      warnings.push('MIME type restrictions will not be enforced in fallback');
      confidence -= 5;
    }

    if (pattern.maxSize) {
      warnings.push('File size restrictions will not be enforced in fallback');
      confidence -= 5;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform collection pattern to fallback
   */
  private static transformCollectionToFallback(pattern: CollectionPattern): TransformationResult {
    const fallback: JsonPrimitive = {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Collection stored as JSON array',
      schema: {
        type: 'array',
        minItems: pattern.minItems,
        maxItems: pattern.maxItems,
        uniqueItems: pattern.uniqueItems
      }
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 90;

    if (pattern.sortable) {
      warnings.push('Sortable UI will not be available in fallback');
      confidence -= 5;
    }

    if (pattern.itemType && 'pattern' in pattern.itemType) {
      dataLoss.push('Nested pattern types will be flattened to JSON');
      confidence -= 15;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform component pattern to fallback
   */
  private static transformComponentToFallback(pattern: ComponentPattern): TransformationResult {
    const fallback: JsonPrimitive = {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Component data stored as JSON',
      schema: pattern.componentSchema || {
        type: 'object'
      }
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 75;

    if (pattern.componentType) {
      warnings.push(`Component type (${pattern.componentType}) validation will not be enforced`);
      confidence -= 10;
    }

    if (pattern.allowedComponents) {
      warnings.push('Component restrictions will not be enforced in fallback');
      confidence -= 10;
    }

    if (!pattern.inline) {
      dataLoss.push('Component references will be stored as IDs only');
      confidence -= 5;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform select pattern to fallback
   */
  private static transformSelectToFallback(pattern: SelectPattern): TransformationResult {
    const fallback: Primitive = pattern.multiple ? {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Multiple selections stored as JSON array',
      schema: {
        type: 'array',
        items: { type: 'string' }
      }
    } : {
      type: PrimitiveType.TEXT,
      required: pattern.required,
      description: pattern.description || 'Single selection stored as text',
      maxLength: 255
    } as TextPrimitive;

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 95;

    if (pattern.options.some(opt => opt.description)) {
      dataLoss.push('Option descriptions will be lost in fallback');
      confidence -= 5;
    }

    warnings.push('Option validation will need to be implemented separately');

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform repeater pattern to fallback
   */
  private static transformRepeaterToFallback(pattern: RepeaterPattern): TransformationResult {
    const fallback: JsonPrimitive = {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Repeater rows stored as JSON array',
      schema: {
        type: 'array',
        minItems: pattern.minRows,
        maxItems: pattern.maxRows,
        items: {
          type: 'object',
          properties: pattern.fields.reduce((props, field) => {
            props[field.name] = { type: 'any' };
            return props;
          }, {} as any)
        }
      }
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 80;

    if (pattern.collapsible) {
      warnings.push('Collapsible UI will not be available in fallback');
      confidence -= 5;
    }

    if (pattern.fields.some(f => 'pattern' in f.type)) {
      dataLoss.push('Nested patterns in repeater fields will be flattened');
      confidence -= 15;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform slug pattern to fallback
   */
  private static transformSlugToFallback(pattern: SlugPattern): TransformationResult {
    const fallback: TextPrimitive = {
      type: PrimitiveType.TEXT,
      required: pattern.required,
      description: pattern.description || 'URL slug',
      maxLength: pattern.maxLength || 255,
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 95;

    if (pattern.sourceField) {
      warnings.push('Auto-generation from source field will not be available');
      confidence -= 5;
    }

    if (pattern.unique) {
      warnings.push('Uniqueness validation will need to be implemented separately');
      confidence -= 5;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Transform tags pattern to fallback
   */
  private static transformTagsToFallback(pattern: TagsPattern): TransformationResult {
    const fallback: JsonPrimitive = {
      type: PrimitiveType.JSON,
      required: pattern.required,
      description: pattern.description || 'Tags stored as JSON array',
      schema: {
        type: 'array',
        minItems: pattern.minTags,
        maxItems: pattern.maxTags,
        items: { type: 'string' }
      }
    };

    const dataLoss: string[] = [];
    const warnings: string[] = [];
    let confidence = 90;

    if (pattern.predefinedTags && !pattern.allowCustomTags) {
      warnings.push('Tag restrictions will need to be validated separately');
      confidence -= 10;
    }

    if (pattern.separator) {
      warnings.push('Custom separator will not be used in JSON storage');
      confidence -= 5;
    }

    return {
      target: fallback,
      confidence,
      dataLoss,
      warnings
    };
  }

  /**
   * Handle nested pattern structures
   */
  static handleNestedPatterns(
    pattern: CommonPatternType,
    depth: number = 0
  ): TransformationResult {
    const maxDepth = 10;
    
    if (depth > maxDepth) {
      return {
        target: {
          type: PrimitiveType.JSON,
          description: 'Deeply nested structure stored as JSON'
        },
        confidence: 50,
        dataLoss: ['Structure exceeds maximum nesting depth'],
        warnings: ['Deep nesting may impact performance']
      };
    }

    const baseResult = this.transformToFallback(pattern);
    
    if (depth > 5) {
      baseResult.confidence -= (depth - 5) * 5;
      baseResult.warnings.push(`Nesting depth (${depth}) may cause complexity`);
    }

    return baseResult;
  }

  /**
   * Generate confidence score for transformation
   */
  static calculateConfidenceScore(
    source: CommonPatternType | Primitive,
    target: CommonPatternType | Primitive
  ): number {
    // Same type = 100% confidence
    if (JSON.stringify(source) === JSON.stringify(target)) {
      return 100;
    }

    // Pattern to pattern
    if ('pattern' in source && 'pattern' in target) {
      if (source.pattern === target.pattern) {
        return 95;
      }
      return this.calculatePatternCompatibility(source, target);
    }

    // Primitive to primitive
    if ('type' in source && 'type' in target) {
      if (source.type === target.type) {
        return 100;
      }
      return this.calculatePrimitiveCompatibility(source, target);
    }

    // Pattern to primitive (fallback)
    if ('pattern' in source && 'type' in target) {
      const fallbackResult = this.transformToFallback(source);
      return fallbackResult.confidence;
    }

    // Primitive to pattern (upgrade)
    if ('type' in source && 'pattern' in target) {
      return this.calculateUpgradeConfidence(source, target);
    }

    return 0;
  }

  private static calculatePatternCompatibility(
    source: CommonPatternType,
    target: CommonPatternType
  ): number {
    const compatibilityMatrix: Record<CommonPattern, Partial<Record<CommonPattern, number>>> = {
      [CommonPattern.RICH_TEXT]: {
        [CommonPattern.LONG_TEXT]: 85,
        [CommonPattern.COMPONENT]: 60
      },
      [CommonPattern.MEDIA]: {
        [CommonPattern.COMPONENT]: 70
      },
      [CommonPattern.COLLECTION]: {
        [CommonPattern.REPEATER]: 80
      },
      [CommonPattern.COMPONENT]: {
        [CommonPattern.COLLECTION]: 75
      },
      [CommonPattern.SELECT]: {
        [CommonPattern.TAGS]: 70
      },
      [CommonPattern.REPEATER]: {
        [CommonPattern.COLLECTION]: 85
      },
      [CommonPattern.SLUG]: {
        [CommonPattern.TEXT]: 95
      },
      [CommonPattern.TAGS]: {
        [CommonPattern.SELECT]: 75,
        [CommonPattern.COLLECTION]: 80
      }
    };

    return compatibilityMatrix[source.pattern]?.[target.pattern] || 50;
  }

  private static calculatePrimitiveCompatibility(
    source: Primitive,
    target: Primitive
  ): number {
    const compatibilityMatrix: Record<PrimitiveType, Partial<Record<PrimitiveType, number>>> = {
      [PrimitiveType.TEXT]: {
        [PrimitiveType.LONG_TEXT]: 100,
        [PrimitiveType.JSON]: 70
      },
      [PrimitiveType.LONG_TEXT]: {
        [PrimitiveType.TEXT]: 80,
        [PrimitiveType.JSON]: 75
      },
      [PrimitiveType.NUMBER]: {
        [PrimitiveType.DECIMAL]: 95,
        [PrimitiveType.TEXT]: 85
      },
      [PrimitiveType.BOOLEAN]: {
        [PrimitiveType.NUMBER]: 90,
        [PrimitiveType.TEXT]: 85
      },
      [PrimitiveType.DATE]: {
        [PrimitiveType.TEXT]: 90,
        [PrimitiveType.NUMBER]: 80
      },
      [PrimitiveType.JSON]: {
        [PrimitiveType.LONG_TEXT]: 90
      },
      [PrimitiveType.DECIMAL]: {
        [PrimitiveType.NUMBER]: 85,
        [PrimitiveType.TEXT]: 80
      }
    };

    return compatibilityMatrix[source.type]?.[target.type] || 60;
  }

  private static calculateUpgradeConfidence(
    source: Primitive,
    target: CommonPatternType
  ): number {
    const upgradeMatrix: Record<PrimitiveType, Partial<Record<CommonPattern, number>>> = {
      [PrimitiveType.TEXT]: {
        [CommonPattern.SLUG]: 95,
        [CommonPattern.SELECT]: 85
      },
      [PrimitiveType.LONG_TEXT]: {
        [CommonPattern.RICH_TEXT]: 90
      },
      [PrimitiveType.JSON]: {
        [CommonPattern.COLLECTION]: 85,
        [CommonPattern.COMPONENT]: 80,
        [CommonPattern.TAGS]: 85,
        [CommonPattern.MEDIA]: 75
      },
      [PrimitiveType.NUMBER]: {},
      [PrimitiveType.BOOLEAN]: {},
      [PrimitiveType.DATE]: {},
      [PrimitiveType.DECIMAL]: {}
    };

    return upgradeMatrix[source.type]?.[target.pattern] || 50;
  }

  /**
   * Document degradation strategy
   */
  static documentDegradationStrategy(
    pattern: CommonPatternType
  ): string {
    const strategies: Record<CommonPattern, string> = {
      [CommonPattern.RICH_TEXT]: 
        'Rich text will be converted to Markdown format. Complex formatting like tables or custom blocks may be simplified.',
      [CommonPattern.MEDIA]: 
        'Media files will be stored as JSON with URL references. Direct file handling will need external implementation.',
      [CommonPattern.COLLECTION]: 
        'Collections will be stored as JSON arrays. Type validation for items must be implemented separately.',
      [CommonPattern.COMPONENT]: 
        'Components will be stored as JSON objects. Component validation and rendering logic needed separately.',
      [CommonPattern.SELECT]: 
        'Single selections stored as text, multiple as JSON array. Option validation required separately.',
      [CommonPattern.REPEATER]: 
        'Repeater rows stored as JSON array. Field validation and UI controls needed separately.',
      [CommonPattern.SLUG]: 
        'Slugs stored as validated text. Auto-generation and uniqueness checks needed separately.',
      [CommonPattern.TAGS]: 
        'Tags stored as JSON string array. Tag suggestions and restrictions implemented separately.'
    };

    return strategies[pattern.pattern] || 'Pattern will be stored as JSON with potential data structure changes.';
  }
}