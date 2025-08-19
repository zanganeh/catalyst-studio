// Provider Architecture Public API
// Clean exports for provider system

// Core interfaces and types
export type {
  ICMSProvider,
  ProviderCapabilities,
  ValidationResult
} from './types';

export {
  ProviderError,
  ProviderNotFoundError,
  ProviderValidationError,
  ProviderConnectionError,
  ProviderTransformationError
} from './types';

// Registry (singleton instance)
export { ProviderRegistry, providerRegistry } from './registry';

// Universal type system
export type {
  UniversalContentType,
  UniversalField,
  UniversalValidation,
  TypeMetadata,
  ContentTypeClassification,
  FieldLayer,
  FieldType,
  FallbackStrategy
} from './universal/types';

// Primitive types
export {
  PRIMITIVE_TYPES,
  PRIMITIVE_DEFAULTS,
  isPrimitiveType
} from './universal/primitives';

// Common patterns
export {
  COMMON_PATTERNS,
  COMMON_PATTERN_DEFAULTS,
  isCommonPattern
} from './universal/common';

export type {
  MediaType,
  SelectOption
} from './universal/common';

// Extensions
export {
  ExtensionRegistry,
  extensionRegistry,
  EXTENSION_EXAMPLES
} from './universal/extensions';

// Mock provider (for development/testing only)
export { MockProvider } from './mock/MockProvider';