import { ICMSProvider } from './types';
import { OptimizelyProvider } from './optimizely';
import { MockProvider } from './mock';
import { getProviderConfig } from './config';

/**
 * Provider factory for creating CMS provider instances
 * Supports environment-based configuration and lazy loading
 */
export class ProviderFactory {
  private static providers: Map<string, () => ICMSProvider> = new Map<string, () => ICMSProvider>([
    ['optimizely', () => new OptimizelyProvider() as ICMSProvider],
    ['mock', () => new MockProvider() as ICMSProvider],
  ]);

  /**
   * Register a custom provider factory
   * @param id Provider identifier
   * @param factory Function that creates a provider instance
   */
  static registerProvider(id: string, factory: () => ICMSProvider): void {
    this.providers.set(id, factory);
  }

  /**
   * Create a provider instance based on configuration
   * @param providerId Provider identifier or 'auto' for environment-based selection
   * @param config Optional provider configuration
   * @returns Provider instance
   */
  static createProvider(
    providerId: string = 'auto',
    config?: Record<string, any>
  ): ICMSProvider {
    // Auto-detect provider from environment
    if (providerId === 'auto') {
      const providerConfig = getProviderConfig();
      providerId = providerConfig.providerId;
      config = config || providerConfig.config;
    }

    const factory = this.providers.get(providerId);
    if (!factory) {
      // Fallback to mock provider if not found
      console.warn(`Provider '${providerId}' not found, falling back to mock provider`);
      const mockProvider = new MockProvider();
      if (config && typeof (mockProvider as any).configure === 'function') {
        (mockProvider as any).configure(config);
      }
      return mockProvider;
    }

    const provider = factory();
    
    // Apply configuration if provided
    if (config && typeof (provider as any).configure === 'function') {
      (provider as any).configure(config);
    }

    return provider;
  }

  /**
   * Get available provider IDs
   * @returns Array of registered provider IDs
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available
   * @param providerId Provider identifier
   * @returns True if provider factory is registered
   */
  static hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }
}