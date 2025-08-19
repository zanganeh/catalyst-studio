// Layer 1: Universal Primitive Types

import { FieldType } from './types';

/**
 * Primitive field type definitions
 * These are the foundational types that all CMS platforms support
 */
export const PRIMITIVE_TYPES: Record<string, FieldType> = {
  TEXT: 'text',
  LONG_TEXT: 'longText',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  JSON: 'json',
  DECIMAL: 'decimal'
} as const;

/**
 * Type guard to check if a field type is primitive
 */
export function isPrimitiveType(type: FieldType): boolean {
  return Object.values(PRIMITIVE_TYPES).includes(type);
}

/**
 * Default configurations for primitive types
 */
export const PRIMITIVE_DEFAULTS = {
  text: {
    maxLength: 255,
    defaultValue: ''
  },
  longText: {
    maxLength: 65535,
    defaultValue: ''
  },
  number: {
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    defaultValue: 0
  },
  boolean: {
    defaultValue: false
  },
  date: {
    format: 'ISO8601',
    defaultValue: null
  },
  json: {
    maxSize: 1048576, // 1MB
    defaultValue: {}
  },
  decimal: {
    precision: 10,
    scale: 2,
    defaultValue: 0.0
  }
};