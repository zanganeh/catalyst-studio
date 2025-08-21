// ICMSProvider Interface and Related Types

import type { UniversalContentType } from './universal/types';
export type { UniversalContentType } from './universal/types';

/**
 * Validation result for content type operations
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Provider capability matrix
 */
export interface ProviderCapabilities {
  supportsComponents: boolean;
  supportsPages: boolean;
  supportsRichText: boolean;
  supportsMedia: boolean;
  supportsReferences: boolean;
  supportsLocalizations: boolean;
  supportsVersioning: boolean;
  supportsScheduling: boolean;
  supportsWebhooks: boolean;
  customCapabilities?: Record<string, boolean>;
}

/**
 * Core CMS Provider Interface
 * All CMS-specific implementations must implement this interface
 */
export interface ICMSProvider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string;
  
  /**
   * Human-readable name for the provider
   */
  readonly name: string;
  
  /**
   * Provider version
   */
  readonly version: string;
  
  /**
   * Retrieves all content types from the CMS
   * @returns Promise resolving to array of universal content types
   */
  getContentTypes(): Promise<UniversalContentType[]>;

  /**
   * Retrieves a specific content type by ID
   * @param id The content type identifier
   * @returns Promise resolving to universal content type or null if not found
   */
  getContentType(id: string): Promise<UniversalContentType | null>;

  /**
   * Creates a new content type in the CMS
   * @param type The universal content type to create
   * @returns Promise resolving to the created content type
   */
  createContentType(type: UniversalContentType): Promise<UniversalContentType>;

  /**
   * Updates an existing content type
   * @param id The content type identifier
   * @param type The updated universal content type
   * @returns Promise resolving to the updated content type
   */
  updateContentType(id: string, type: UniversalContentType): Promise<UniversalContentType>;

  /**
   * Deletes a content type from the CMS
   * @param id The content type identifier
   * @returns Promise resolving to true if successful
   */
  deleteContentType(id: string): Promise<boolean>;

  /**
   * Validates a content type against CMS constraints
   * @param type The universal content type to validate
   * @returns Promise resolving to validation result
   */
  validateContentType(type: UniversalContentType): Promise<ValidationResult>;

  /**
   * Gets the capabilities of this provider
   * @returns Provider capability matrix
   */
  getProviderCapabilities(): ProviderCapabilities;

  /**
   * Maps native CMS type to universal format
   * @param nativeType The CMS-specific type format
   * @returns Universal content type
   */
  mapToUniversal(nativeType: any): UniversalContentType;

  /**
   * Maps universal type to native CMS format
   * @param universalType The universal content type
   * @returns CMS-specific type format
   */
  mapFromUniversal(universalType: UniversalContentType): any;

  /**
   * Sets dry run mode for the provider
   * When enabled, no actual API calls are made to the CMS
   * @param enabled Whether to enable dry run mode
   */
  setDryRun?(enabled: boolean): void;
}

/**
 * Base error class for provider operations
 */
export class ProviderError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Error thrown when a provider is not found
 */
export class ProviderNotFoundError extends ProviderError {
  constructor(providerId: string) {
    super(`Provider '${providerId}' not found`, 'PROVIDER_NOT_FOUND');
    this.name = 'ProviderNotFoundError';
  }
}

/**
 * Error thrown when content type validation fails
 */
export class ProviderValidationError extends ProviderError {
  constructor(message: string, public validationResult?: ValidationResult) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ProviderValidationError';
  }
}

/**
 * Error thrown when provider connection fails
 */
export class ProviderConnectionError extends ProviderError {
  constructor(message: string, public cause?: Error) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ProviderConnectionError';
  }
}

/**
 * Error thrown when type transformation fails
 */
export class ProviderTransformationError extends ProviderError {
  constructor(message: string, public sourceType?: any) {
    super(message, 'TRANSFORMATION_ERROR');
    this.name = 'ProviderTransformationError';
  }
}