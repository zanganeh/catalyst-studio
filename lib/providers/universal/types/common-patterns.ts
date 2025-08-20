/**
 * Common Patterns Layer - Composed types built from primitives
 * Part of the three-layer type system (primitives, common patterns, extensions)
 */

import { Primitive, PrimitiveType } from './primitives';

/**
 * Enumeration of all common pattern types
 * These patterns are frequently used across CMS platforms
 */
export enum CommonPattern {
  RICH_TEXT = 'richText',
  MEDIA = 'media',
  COLLECTION = 'collection',
  COMPONENT = 'component',
  SELECT = 'select',
  REPEATER = 'repeater',
  SLUG = 'slug',
  TAGS = 'tags'
}

/**
 * Base interface for all common patterns
 */
export interface BasePattern {
  pattern: CommonPattern;
  required?: boolean;
  description?: string;
  fallbackPrimitive?: PrimitiveType;
}

/**
 * Rich text pattern - formatted text with markup
 * Platforms may support different markup formats (Markdown, HTML, Slate, etc.)
 * Fallback: longText primitive with markdown
 */
export interface RichTextPattern extends BasePattern {
  pattern: CommonPattern.RICH_TEXT;
  format?: 'markdown' | 'html' | 'slate' | 'portable-text' | 'custom';
  allowedFormats?: string[];
  allowedBlocks?: string[];
  allowedMarks?: string[];
  maxLength?: number;
  fallbackPrimitive?: PrimitiveType.LONG_TEXT;
}

/**
 * Media pattern - images, videos, files with metadata
 * Handles various media types with associated metadata
 * Fallback: JSON primitive with URL and metadata
 */
export interface MediaPattern extends BasePattern {
  pattern: CommonPattern.MEDIA;
  mediaType?: 'image' | 'video' | 'file' | 'any';
  allowedMimeTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  metadata?: {
    alt?: boolean;
    caption?: boolean;
    title?: boolean;
    dimensions?: boolean;
  };
  fallbackPrimitive?: PrimitiveType.JSON;
}

/**
 * Collection pattern - arrays of typed items
 * Used for lists of structured data
 * Fallback: JSON primitive with array structure
 */
export interface CollectionPattern extends BasePattern {
  pattern: CommonPattern.COLLECTION;
  itemType: Primitive | CommonPatternType;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  sortable?: boolean;
  fallbackPrimitive?: PrimitiveType.JSON;
}

/**
 * Component pattern - reusable content blocks
 * References to other content types or inline structures
 * Fallback: JSON primitive with component data
 */
export interface ComponentPattern extends BasePattern {
  pattern: CommonPattern.COMPONENT;
  componentType?: string;
  componentSchema?: object;
  allowedComponents?: string[];
  inline?: boolean;
  fallbackPrimitive?: PrimitiveType.JSON;
}

/**
 * Select pattern - dropdown/radio selections
 * Single or multiple choice from predefined options
 * Fallback: text primitive for single, JSON for multiple
 */
export interface SelectPattern extends BasePattern {
  pattern: CommonPattern.SELECT;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  multiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  defaultValue?: string | string[];
  fallbackPrimitive?: PrimitiveType.TEXT | PrimitiveType.JSON;
}

/**
 * Repeater pattern - dynamic lists of fields
 * Used for repeating field groups
 * Fallback: JSON primitive with array of field groups
 */
export interface RepeaterPattern extends BasePattern {
  pattern: CommonPattern.REPEATER;
  fields: Array<{
    name: string;
    type: Primitive | CommonPatternType;
    required?: boolean;
  }>;
  minRows?: number;
  maxRows?: number;
  collapsible?: boolean;
  fallbackPrimitive?: PrimitiveType.JSON;
}

/**
 * Slug pattern - URL-friendly identifiers
 * Auto-generated or manual URL slugs
 * Fallback: text primitive with validation
 */
export interface SlugPattern extends BasePattern {
  pattern: CommonPattern.SLUG;
  sourceField?: string;
  editable?: boolean;
  unique?: boolean;
  maxLength?: number;
  fallbackPrimitive?: PrimitiveType.TEXT;
}

/**
 * Tags pattern - categorization labels
 * Multiple tags for content categorization
 * Fallback: JSON primitive with array of strings
 */
export interface TagsPattern extends BasePattern {
  pattern: CommonPattern.TAGS;
  allowCustomTags?: boolean;
  predefinedTags?: string[];
  minTags?: number;
  maxTags?: number;
  separator?: string;
  fallbackPrimitive?: PrimitiveType.JSON;
}

/**
 * Union type for all common patterns
 */
export type CommonPatternType = 
  | RichTextPattern
  | MediaPattern
  | CollectionPattern
  | ComponentPattern
  | SelectPattern
  | RepeaterPattern
  | SlugPattern
  | TagsPattern;

/**
 * Type guards for pattern detection
 */
export const isCommonPattern = (value: any): value is CommonPatternType => {
  return value && typeof value === 'object' && 
    'pattern' in value && 
    Object.values(CommonPattern).includes(value.pattern);
};

export const isRichTextPattern = (value: any): value is RichTextPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.RICH_TEXT;
};

export const isMediaPattern = (value: any): value is MediaPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.MEDIA;
};

export const isCollectionPattern = (value: any): value is CollectionPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.COLLECTION;
};

export const isComponentPattern = (value: any): value is ComponentPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.COMPONENT;
};

export const isSelectPattern = (value: any): value is SelectPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.SELECT;
};

export const isRepeaterPattern = (value: any): value is RepeaterPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.REPEATER;
};

export const isSlugPattern = (value: any): value is SlugPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.SLUG;
};

export const isTagsPattern = (value: any): value is TagsPattern => {
  return isCommonPattern(value) && value.pattern === CommonPattern.TAGS;
};

/**
 * Pattern composition utilities
 */
export class PatternComposer {
  /**
   * Compose a pattern from primitive types
   */
  static composeFromPrimitives(
    pattern: CommonPattern,
    primitives: Primitive[]
  ): CommonPatternType | null {
    switch (pattern) {
      case CommonPattern.RICH_TEXT:
        return this.createRichTextFromPrimitive(primitives[0]);
      case CommonPattern.SLUG:
        return this.createSlugFromPrimitive(primitives[0]);
      case CommonPattern.TAGS:
        return this.createTagsFromPrimitives(primitives);
      case CommonPattern.SELECT:
        return this.createSelectFromPrimitive(primitives[0]);
      default:
        return null;
    }
  }

  private static createRichTextFromPrimitive(primitive: Primitive): RichTextPattern | null {
    if (primitive.type !== PrimitiveType.LONG_TEXT && 
        primitive.type !== PrimitiveType.TEXT) {
      return null;
    }

    return {
      pattern: CommonPattern.RICH_TEXT,
      format: 'markdown',
      required: primitive.required,
      description: primitive.description,
      fallbackPrimitive: PrimitiveType.LONG_TEXT
    };
  }

  private static createSlugFromPrimitive(primitive: Primitive): SlugPattern | null {
    if (primitive.type !== PrimitiveType.TEXT) {
      return null;
    }

    return {
      pattern: CommonPattern.SLUG,
      editable: true,
      unique: false,
      maxLength: 255,
      required: primitive.required,
      description: primitive.description,
      fallbackPrimitive: PrimitiveType.TEXT
    };
  }

  private static createTagsFromPrimitives(primitives: Primitive[]): TagsPattern | null {
    const jsonPrimitive = primitives.find(p => p.type === PrimitiveType.JSON);
    if (!jsonPrimitive) return null;

    return {
      pattern: CommonPattern.TAGS,
      allowCustomTags: true,
      required: jsonPrimitive.required,
      description: jsonPrimitive.description,
      fallbackPrimitive: PrimitiveType.JSON
    };
  }

  private static createSelectFromPrimitive(primitive: Primitive): SelectPattern | null {
    if (primitive.type !== PrimitiveType.TEXT) {
      return null;
    }

    return {
      pattern: CommonPattern.SELECT,
      options: [],
      multiple: false,
      required: primitive.required,
      description: primitive.description,
      fallbackPrimitive: PrimitiveType.TEXT
    };
  }

  /**
   * Decompose a pattern into primitive types
   */
  static decomposeToPrimitives(pattern: CommonPatternType): Primitive[] {
    switch (pattern.pattern) {
      case CommonPattern.RICH_TEXT:
        return [{
          type: PrimitiveType.LONG_TEXT,
          required: pattern.required,
          description: pattern.description
        }];

      case CommonPattern.MEDIA:
        return [{
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description,
          schema: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              alt: { type: 'string' },
              caption: { type: 'string' },
              mimeType: { type: 'string' },
              size: { type: 'number' }
            }
          }
        }];

      case CommonPattern.COLLECTION:
        return [{
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description,
          schema: {
            type: 'array'
          }
        }];

      case CommonPattern.COMPONENT:
        return [{
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description
        }];

      case CommonPattern.SELECT:
        const selectPrimitive: Primitive = pattern.multiple ? {
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description
        } : {
          type: PrimitiveType.TEXT,
          required: pattern.required,
          description: pattern.description
        };
        return [selectPrimitive];

      case CommonPattern.REPEATER:
        return [{
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description,
          schema: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        }];

      case CommonPattern.SLUG:
        return [{
          type: PrimitiveType.TEXT,
          required: pattern.required,
          description: pattern.description,
          maxLength: pattern.maxLength || 255,
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        }];

      case CommonPattern.TAGS:
        return [{
          type: PrimitiveType.JSON,
          required: pattern.required,
          description: pattern.description,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }];

      default:
        return [];
    }
  }
}

/**
 * Pattern validation utilities
 */
export class PatternValidator {
  static validateRichText(value: any, pattern: RichTextPattern): boolean {
    if (typeof value !== 'string' && typeof value !== 'object') return false;
    
    if (pattern.maxLength && typeof value === 'string' && value.length > pattern.maxLength) {
      return false;
    }
    
    return true;
  }

  static validateMedia(value: any, pattern: MediaPattern): boolean {
    if (!value || typeof value !== 'object') return false;
    
    if (pattern.multiple) {
      if (!Array.isArray(value)) return false;
      return value.every(item => this.validateSingleMedia(item, pattern));
    }
    
    return this.validateSingleMedia(value, pattern);
  }

  private static validateSingleMedia(value: any, pattern: MediaPattern): boolean {
    if (!value.url || typeof value.url !== 'string') return false;
    
    if (pattern.allowedMimeTypes && value.mimeType) {
      if (!pattern.allowedMimeTypes.includes(value.mimeType)) return false;
    }
    
    if (pattern.maxSize && value.size && value.size > pattern.maxSize) {
      return false;
    }
    
    return true;
  }

  static validateCollection(value: any, pattern: CollectionPattern): boolean {
    if (!Array.isArray(value)) return false;
    
    if (pattern.minItems !== undefined && value.length < pattern.minItems) return false;
    if (pattern.maxItems !== undefined && value.length > pattern.maxItems) return false;
    
    if (pattern.uniqueItems) {
      const uniqueValues = new Set(value.map(item => JSON.stringify(item)));
      if (uniqueValues.size !== value.length) return false;
    }
    
    return true;
  }

  static validateSelect(value: any, pattern: SelectPattern): boolean {
    const validValues = pattern.options.map(opt => opt.value);
    
    if (pattern.multiple) {
      if (!Array.isArray(value)) return false;
      if (pattern.minSelections && value.length < pattern.minSelections) return false;
      if (pattern.maxSelections && value.length > pattern.maxSelections) return false;
      return value.every(v => validValues.includes(v));
    }
    
    return validValues.includes(value);
  }

  static validateSlug(value: any, pattern: SlugPattern): boolean {
    if (typeof value !== 'string') return false;
    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(value)) return false;
    
    if (pattern.maxLength && value.length > pattern.maxLength) return false;
    
    return true;
  }

  static validateTags(value: any, pattern: TagsPattern): boolean {
    if (!Array.isArray(value)) return false;
    
    if (pattern.minTags && value.length < pattern.minTags) return false;
    if (pattern.maxTags && value.length > pattern.maxTags) return false;
    
    if (pattern.predefinedTags && !pattern.allowCustomTags) {
      return value.every(tag => pattern.predefinedTags!.includes(tag));
    }
    
    return value.every(tag => typeof tag === 'string');
  }

  static validate(value: any, pattern: CommonPatternType): boolean {
    if (pattern.required && (value === null || value === undefined)) {
      return false;
    }
    
    if (!pattern.required && (value === null || value === undefined)) {
      return true;
    }
    
    switch (pattern.pattern) {
      case CommonPattern.RICH_TEXT:
        return this.validateRichText(value, pattern);
      case CommonPattern.MEDIA:
        return this.validateMedia(value, pattern);
      case CommonPattern.COLLECTION:
        return this.validateCollection(value, pattern);
      case CommonPattern.SELECT:
        return this.validateSelect(value, pattern);
      case CommonPattern.SLUG:
        return this.validateSlug(value, pattern);
      case CommonPattern.TAGS:
        return this.validateTags(value, pattern);
      default:
        return false;
    }
  }
}