/**
 * Type System Registry - Central registry for type providers
 * Implements dependency injection pattern for platform providers
 */

import { ITypeProvider } from '../interfaces/type-provider';
import { PrimitiveType } from '../types/primitives';
import { CommonPattern } from '../types/common-patterns';

/**
 * Registry configuration options
 */
export interface RegistryOptions {
  allowOverride?: boolean;
  validateOnRegister?: boolean;
}

/**
 * Type system registry singleton
 */
export class TypeSystemRegistry {
  private static instance: TypeSystemRegistry;
  private providers: Map<string, ITypeProvider> = new Map();
  private options: RegistryOptions;

  private constructor(options: RegistryOptions = {}) {
    this.options = {
      allowOverride: false,
      validateOnRegister: true,
      ...options
    };
  }

  /**
   * Get registry instance
   */
  static getInstance(options?: RegistryOptions): TypeSystemRegistry {
    if (!TypeSystemRegistry.instance) {
      TypeSystemRegistry.instance = new TypeSystemRegistry(options);
    }
    return TypeSystemRegistry.instance;
  }

  /**
   * Register a type provider
   */
  register(provider: ITypeProvider): void {
    const platformId = provider.getPlatformId();
    
    if (this.providers.has(platformId) && !this.options.allowOverride) {
      throw new Error(`Provider for platform '${platformId}' is already registered`);
    }

    if (this.options.validateOnRegister) {
      this.validateProvider(provider);
    }

    this.providers.set(platformId, provider);
  }

  /**
   * Unregister a provider
   */
  unregister(platformId: string): boolean {
    return this.providers.delete(platformId);
  }

  /**
   * Get a provider by platform ID
   */
  getProvider(platformId: string): ITypeProvider | undefined {
    return this.providers.get(platformId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ITypeProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all registered platform IDs
   */
  getPlatformIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a platform is registered
   */
  hasProvider(platformId: string): boolean {
    return this.providers.has(platformId);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * Get compatibility score across all platforms
   */
  getCompatibilityScore(
    universalType: PrimitiveType | CommonPattern
  ): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [platformId, provider] of this.providers) {
      const mapping = provider.getCompatibilityMapping(universalType);
      scores.set(platformId, mapping?.confidence ?? 0);
    }
    
    return scores;
  }

  /**
   * Find providers that support a specific type
   */
  findProvidersByType(
    universalType: PrimitiveType | CommonPattern
  ): ITypeProvider[] {
    return Array.from(this.providers.values()).filter(provider =>
      provider.supportsType(universalType)
    );
  }

  /**
   * Find providers by capability
   */
  findProvidersByCapability(capability: string): ITypeProvider[] {
    return Array.from(this.providers.values()).filter(provider =>
      provider.getCapabilities().includes(capability)
    );
  }

  /**
   * Validate provider implementation
   */
  private validateProvider(provider: ITypeProvider): void {
    const requiredMethods = [
      'getPlatformId',
      'getPlatformName',
      'getCompatibilityMapping',
      'getExtensions',
      'transformToUniversal',
      'transformFromUniversal',
      'supportsType',
      'getCapabilities'
    ];

    for (const method of requiredMethods) {
      if (typeof (provider as any)[method] !== 'function') {
        throw new Error(
          `Provider for '${provider.getPlatformId()}' is missing required method: ${method}`
        );
      }
    }

    // Validate platform ID
    const platformId = provider.getPlatformId();
    if (!platformId || typeof platformId !== 'string') {
      throw new Error('Provider must return a valid platform ID');
    }

    // Validate capabilities
    const capabilities = provider.getCapabilities();
    if (!Array.isArray(capabilities)) {
      throw new Error('Provider must return an array of capabilities');
    }
  }

  /**
   * Reset the singleton instance (mainly for testing)
   */
  static resetInstance(): void {
    TypeSystemRegistry.instance = undefined as any;
  }
}

/**
 * Convenience function to get the global registry
 */
export function getTypeRegistry(): TypeSystemRegistry {
  return TypeSystemRegistry.getInstance();
}