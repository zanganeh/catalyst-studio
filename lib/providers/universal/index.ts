/**
 * Universal Type System - Main Entry Point
 * Provides 2-3 clear interfaces for external modules
 * No platform-specific knowledge exposed
 */

// Main Type System - Primary interface
export {
  TypeSystem,
  TypeRegistry,
  createTypeSystem,
  getGlobalTypeSystem
} from './type-system';

export type {
  UniversalType,
  TypeSystemConfig
} from './type-system';

// Type Provider Interface - For platform implementations
export type {
  ITypeProvider,
  PlatformMapping,
  TransformationResult,
  TypeProviderFactory
} from './interfaces/type-provider';

// Core Types - For type definitions
export {
  // Primitives
  PrimitiveType,
  type Primitive,
  type TextPrimitive,
  type LongTextPrimitive,
  type NumberPrimitive,
  type BooleanPrimitive,
  type DatePrimitive,
  type JsonPrimitive,
  type DecimalPrimitive
} from './types/primitives';

export {
  // Common Patterns
  CommonPattern,
  type CommonPatternType,
  type RichTextPattern,
  type MediaPattern,
  type CollectionPattern,
  type ComponentPattern,
  type SelectPattern,
  type RepeaterPattern,
  type SlugPattern,
  type TagsPattern
} from './types/common-patterns';

export {
  // Extensions
  type PlatformExtension,
  type ExtensionFeature,
  type MigrationStrategy
} from './types/extensions';

/**
 * Simple Usage Example:
 * 
 * ```typescript
 * import { createTypeSystem, PrimitiveType } from '@catalyst/universal-types';
 * import { createOptimizelyProvider } from '@catalyst/optimizely-provider';
 * 
 * // 1. Create type system with provider
 * const typeSystem = createTypeSystem({
 *   providers: [createOptimizelyProvider()],
 *   defaultPlatform: 'optimizely'
 * });
 * 
 * // 2. Use without platform knowledge
 * const result = typeSystem.validate({
 *   type: PrimitiveType.TEXT,
 *   maxLength: 255
 * });
 * 
 * // 3. Check compatibility
 * const compatible = typeSystem.checkCompatibility(PrimitiveType.TEXT);
 * ```
 */