/**
 * Type Provider Interface - Contract for platform-specific type providers
 * This interface enables dependency injection and removes platform coupling
 */

import { PrimitiveType } from '../types/primitives';
import { CommonPattern } from '../types/common-patterns';
import { PlatformExtension } from '../types/extensions';

/**
 * Platform-specific type mapping
 */
export interface PlatformMapping {
  nativeType: string;
  confidence: number;
  transformationRequired: boolean;
  dataLossRisk: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Type transformation result
 */
export interface TransformationResult {
  success: boolean;
  value: any;
  confidence: number;
  warnings: string[];
}

/**
 * Type provider interface - implemented by each platform
 */
export interface ITypeProvider {
  /**
   * Get the platform identifier
   */
  getPlatformId(): string;

  /**
   * Get platform name for display
   */
  getPlatformName(): string;

  /**
   * Get compatibility mapping for a universal type
   */
  getCompatibilityMapping(universalType: PrimitiveType | CommonPattern): PlatformMapping | undefined;

  /**
   * Get all platform-specific extensions
   */
  getExtensions(): PlatformExtension[];

  /**
   * Get a specific extension by ID
   */
  getExtension(id: string): PlatformExtension | undefined;

  /**
   * Transform a value from platform format to universal format
   */
  transformToUniversal(
    value: any,
    nativeType: string,
    universalType: PrimitiveType | CommonPattern
  ): TransformationResult;

  /**
   * Transform a value from universal format to platform format
   */
  transformFromUniversal(
    value: any,
    universalType: PrimitiveType | CommonPattern,
    nativeType: string
  ): TransformationResult;

  /**
   * Check if platform supports a universal type
   */
  supportsType(universalType: PrimitiveType | CommonPattern): boolean;

  /**
   * Get platform capabilities
   */
  getCapabilities(): string[];

  /**
   * Validate a value against platform constraints
   */
  validateValue(
    value: any,
    nativeType: string
  ): {
    valid: boolean;
    errors: string[];
  };
}

/**
 * Type provider factory function signature
 */
export type TypeProviderFactory = () => ITypeProvider;