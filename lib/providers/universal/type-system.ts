/**
 * Type System Facade - Simplified interface for external modules
 * Provides 2-3 clear entry points without exposing internal complexity
 */

import { ITypeProvider } from './interfaces/type-provider';
import { TypeSystemRegistry, getTypeRegistry } from './registry/type-system-registry';
import { PrimitiveType, Primitive } from './types/primitives';
import { CommonPattern, CommonPatternType } from './types/common-patterns';
import { PlatformExtension } from './types/extensions';
import { TypeValidator, ValidationResult } from './utils/type-validator';
import { TypeConverter, ConversionResult, TypeLayer } from './utils/type-converter';
import { CompatibilityScorer } from './compatibility/compatibility-scorer';

/**
 * Type definition - unified interface for all types
 */
export type UniversalType = Primitive | CommonPatternType | PlatformExtension;

/**
 * Type system configuration
 */
export interface TypeSystemConfig {
  providers?: ITypeProvider[];
  defaultPlatform?: string;
  strictMode?: boolean;
}

/**
 * Main Type System interface - simplified facade for external use
 */
export class TypeSystem {
  private registry: TypeSystemRegistry;
  private defaultPlatform?: string;
  private strictMode: boolean;

  constructor(config?: TypeSystemConfig) {
    this.registry = getTypeRegistry();
    this.defaultPlatform = config?.defaultPlatform;
    this.strictMode = config?.strictMode ?? false;

    // Register providers if provided
    if (config?.providers) {
      for (const provider of config.providers) {
        this.registry.register(provider);
      }
    }
  }

  /**
   * Register a platform provider
   */
  registerProvider(provider: ITypeProvider): void {
    this.registry.register(provider);
  }

  /**
   * Validate a type definition
   */
  validate(
    type: UniversalType,
    platform?: string
  ): ValidationResult {
    return TypeValidator.validateType(type, {
      platform: platform || this.defaultPlatform,
      strictMode: this.strictMode
    });
  }

  /**
   * Transform a value between platforms
   */
  transform(
    value: any,
    fromPlatform: string,
    toPlatform: string,
    type: PrimitiveType | CommonPattern
  ): {
    success: boolean;
    value: any;
    warnings: string[];
  } {
    const fromProvider = this.registry.getProvider(fromPlatform);
    const toProvider = this.registry.getProvider(toPlatform);

    if (!fromProvider || !toProvider) {
      return {
        success: false,
        value,
        warnings: ['Provider not found']
      };
    }

    // Transform to universal format
    const fromMapping = fromProvider.getCompatibilityMapping(type);
    if (!fromMapping) {
      return {
        success: false,
        value,
        warnings: [`Type not supported by ${fromPlatform}`]
      };
    }

    const toUniversal = fromProvider.transformToUniversal(
      value,
      fromMapping.nativeType,
      type
    );

    if (!toUniversal.success) {
      return {
        success: false,
        value,
        warnings: toUniversal.warnings
      };
    }

    // Transform from universal to target platform
    const toMapping = toProvider.getCompatibilityMapping(type);
    if (!toMapping) {
      return {
        success: false,
        value: toUniversal.value,
        warnings: [`Type not supported by ${toPlatform}`]
      };
    }

    const fromUniversal = toProvider.transformFromUniversal(
      toUniversal.value,
      type,
      toMapping.nativeType
    );

    return {
      success: fromUniversal.success,
      value: fromUniversal.value,
      warnings: [...toUniversal.warnings, ...fromUniversal.warnings]
    };
  }

  /**
   * Check compatibility between platforms
   */
  checkCompatibility(
    type: PrimitiveType | CommonPattern,
    platform?: string
  ): {
    compatible: boolean;
    confidence: number;
    warnings: string[];
  } {
    const scorer = new CompatibilityScorer();
    const score = scorer.calculateScore(
      type,
      platform || this.defaultPlatform
    );

    return {
      compatible: score.confidence !== 'low',
      confidence: score.score,
      warnings: score.warnings
    };
  }

  /**
   * Get platform extensions
   */
  getExtensions(platform: string): PlatformExtension[] {
    const provider = this.registry.getProvider(platform);
    return provider?.getExtensions() || [];
  }

  /**
   * Convert between type layers
   */
  convert(
    source: UniversalType,
    targetLayer: TypeLayer,
    platform?: string
  ): ConversionResult {
    return TypeConverter.convert(source, targetLayer, {
      platform: platform || this.defaultPlatform
    });
  }

  /**
   * Get all registered platforms
   */
  getPlatforms(): string[] {
    return this.registry.getPlatformIds();
  }

  /**
   * Check if a platform is supported
   */
  isPlatformSupported(platform: string): boolean {
    return this.registry.hasProvider(platform);
  }
}

/**
 * Type Registry - For discovery and registration
 */
export class TypeRegistry {
  private static instance: TypeRegistry;
  private typeSystem: TypeSystem;

  private constructor() {
    this.typeSystem = new TypeSystem();
  }

  static getInstance(): TypeRegistry {
    if (!TypeRegistry.instance) {
      TypeRegistry.instance = new TypeRegistry();
    }
    return TypeRegistry.instance;
  }

  /**
   * Register a provider
   */
  register(provider: ITypeProvider): void {
    this.typeSystem.registerProvider(provider);
  }

  /**
   * Get the type system
   */
  getTypeSystem(): TypeSystem {
    return this.typeSystem;
  }

  /**
   * Create a new isolated type system
   */
  createIsolated(config?: TypeSystemConfig): TypeSystem {
    return new TypeSystem(config);
  }
}

/**
 * Export main interfaces
 */
export { PrimitiveType, CommonPattern } from './types/primitives';
export type { ITypeProvider } from './interfaces/type-provider';

/**
 * Convenience functions
 */
export function createTypeSystem(config?: TypeSystemConfig): TypeSystem {
  return new TypeSystem(config);
}

export function getGlobalTypeSystem(): TypeSystem {
  return TypeRegistry.getInstance().getTypeSystem();
}