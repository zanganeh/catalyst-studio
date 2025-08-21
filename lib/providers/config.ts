/**
 * Provider configuration utilities
 * Handles environment-based provider selection and configuration
 */

export interface ProviderConfig {
  providerId: string;
  config?: Record<string, any>;
}

/**
 * Get provider configuration from environment
 * @returns Provider configuration with auto-detection
 */
export function getProviderConfig(): ProviderConfig {
  const envProvider = process.env.CMS_PROVIDER || process.env.NEXT_PUBLIC_CMS_PROVIDER;
  
  // If explicitly set, use that provider
  if (envProvider && envProvider !== 'auto') {
    return {
      providerId: envProvider,
      config: getProviderSpecificConfig(envProvider)
    };
  }
  
  // Auto-detect based on available credentials
  if (process.env.OPTIMIZELY_CLIENT_ID && process.env.OPTIMIZELY_CLIENT_SECRET) {
    return {
      providerId: 'optimizely',
      config: getProviderSpecificConfig('optimizely')
    };
  }
  
  // Default to mock provider for development
  return {
    providerId: 'mock',
    config: getProviderSpecificConfig('mock')
  };
}

/**
 * Get provider-specific configuration
 * @param providerId Provider identifier
 * @returns Provider-specific configuration object
 */
function getProviderSpecificConfig(providerId: string): Record<string, any> {
  switch (providerId) {
    case 'optimizely':
      return {
        clientId: process.env.OPTIMIZELY_CLIENT_ID,
        clientSecret: process.env.OPTIMIZELY_CLIENT_SECRET,
        projectId: process.env.OPTIMIZELY_PROJECT_ID,
        cacheEnabled: process.env.PROVIDER_CACHE_ENABLED === 'true',
        cacheTTL: parseInt(process.env.PROVIDER_CACHE_TTL || '300', 10)
      };
      
    case 'mock':
      return {
        simulateDelay: parseInt(process.env.MOCK_PROVIDER_DELAY || '0', 10),
        shouldFail: process.env.MOCK_PROVIDER_FAIL === 'true',
        failureMessage: process.env.MOCK_PROVIDER_FAIL_MESSAGE
      };
      
    default:
      return {};
  }
}

/**
 * Check if a provider is available
 * @param providerId Provider identifier
 * @returns True if provider can be configured
 */
export function isProviderAvailable(providerId: string): boolean {
  switch (providerId) {
    case 'optimizely':
      return !!(process.env.OPTIMIZELY_CLIENT_ID && process.env.OPTIMIZELY_CLIENT_SECRET);
    case 'mock':
      return true; // Mock is always available
    default:
      return false;
  }
}

/**
 * Get list of available providers
 * @returns Array of available provider IDs
 */
export function getAvailableProviders(): string[] {
  const providers: string[] = ['mock']; // Mock is always available
  
  if (isProviderAvailable('optimizely')) {
    providers.push('optimizely');
  }
  
  return providers;
}

/**
 * Get provider display name
 * @param providerId Provider identifier
 * @returns Human-readable provider name
 */
export function getProviderDisplayName(providerId: string): string {
  const names: Record<string, string> = {
    optimizely: 'Optimizely CMS',
    mock: 'Mock Provider (Development)',
    contentful: 'Contentful'
  };
  
  return names[providerId] || providerId;
}