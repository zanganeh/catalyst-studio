/**
 * Universal Primitive Types - Modular Class-Based System
 * Each primitive is a self-contained module with its own validation and transformation logic
 */

// Base class
export { PrimitiveType as PrimitiveTypeClass } from './base/primitive-type';
export type { 
  PrimitiveConfig, 
  ValidationResult, 
  TransformResult 
} from './base/primitive-type';

// Import for use in this file
import type { PrimitiveConfig } from './base/primitive-type';
import { PrimitiveType as PrimitiveTypeClassInternal } from './base/primitive-type';

// Registry
import { PrimitiveRegistry } from './registry';
const primitiveRegistry = PrimitiveRegistry.getInstance();

// Primitive implementations
export { TextPrimitive, createTextPrimitive } from './text';
export type { TextConfig } from './text';

export { LongTextPrimitive, createLongTextPrimitive } from './long-text';
export type { LongTextConfig } from './long-text';

export { NumberPrimitive, createNumberPrimitive } from './number';
export type { NumberConfig } from './number';

export { BooleanPrimitive, createBooleanPrimitive } from './boolean';
export type { BooleanConfig } from './boolean';

export { DatePrimitive, createDatePrimitive } from './date';
export type { DateConfig } from './date';

export { JsonPrimitive, createJsonPrimitive } from './json';
export type { JsonConfig } from './json';

export { DecimalPrimitive, createDecimalPrimitive } from './decimal';
export type { DecimalConfig } from './decimal';

// Registry and factory
export {
  PrimitiveRegistry,
  PrimitiveTypeId,
  primitiveRegistry,
  createPrimitive,
  type AnyPrimitive,
  type AnyPrimitiveConfig
} from './registry';

/**
 * Re-export primitive type enum for backward compatibility
 * New code should use PrimitiveTypeId from registry
 */
export { PrimitiveTypeId as PrimitiveType } from './registry';

/**
 * Type guard to check if value is a PrimitiveType instance
 */
export function isPrimitiveType(value: any): value is PrimitiveTypeClassInternal<any, any> {
  return value && 
    typeof value === 'object' && 
    typeof value.typeId === 'string' &&
    typeof value.validate === 'function' &&
    typeof value.transform === 'function';
}

/**
 * Helper to create primitive from JSON
 */
export function primitiveFromJSON(json: any): PrimitiveTypeClassInternal<any, any> {
  return primitiveRegistry.fromJSON(json);
}

/**
 * Helper to detect and create primitive from value
 */
export function primitiveFromValue(value: any, config?: PrimitiveConfig): PrimitiveTypeClassInternal<any, any> | null {
  return primitiveRegistry.createFromValue(value, config);
}