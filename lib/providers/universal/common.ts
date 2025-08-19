// Layer 2: Common Pattern Types

import { FieldType } from './types';

/**
 * Common pattern field type definitions
 * These are complex types commonly found across CMS platforms
 */
export const COMMON_PATTERNS: Record<string, FieldType> = {
  RICH_TEXT: 'richText',
  MEDIA: 'media',
  COLLECTION: 'collection',
  COMPONENT: 'component',
  SELECT: 'select',
  REPEATER: 'repeater',
  SLUG: 'slug',
  TAGS: 'tags'
} as const;

/**
 * Type guard to check if a field type is a common pattern
 */
export function isCommonPattern(type: FieldType): boolean {
  return Object.values(COMMON_PATTERNS).includes(type);
}

/**
 * Common pattern configurations
 */
export const COMMON_PATTERN_DEFAULTS = {
  richText: {
    allowedFormats: ['bold', 'italic', 'underline', 'link', 'heading', 'list'],
    maxLength: 100000,
    defaultValue: ''
  },
  media: {
    allowedTypes: ['image', 'video', 'document'],
    maxSize: 10485760, // 10MB
    multiple: false,
    defaultValue: null
  },
  collection: {
    minItems: 0,
    maxItems: null,
    defaultValue: []
  },
  component: {
    allowedComponents: [],
    required: false,
    defaultValue: null
  },
  select: {
    multiple: false,
    options: [],
    defaultValue: null
  },
  repeater: {
    minItems: 0,
    maxItems: null,
    fields: [],
    defaultValue: []
  },
  slug: {
    sourceField: 'title',
    pattern: '[a-z0-9-]+',
    unique: true,
    defaultValue: ''
  },
  tags: {
    minItems: 0,
    maxItems: null,
    allowCustom: true,
    defaultValue: []
  }
};

/**
 * Media type definitions
 */
export interface MediaType {
  url: string;
  alt?: string;
  title?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
}

/**
 * Select option definition
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}