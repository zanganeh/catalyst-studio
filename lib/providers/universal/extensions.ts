// Layer 3: Platform-Specific Extensions

import { FieldType } from './types';

/**
 * Extension registry for platform-specific field types
 * Providers register their custom types here
 */
export class ExtensionRegistry {
  private static instance: ExtensionRegistry;
  private extensions: Map<string, Map<string, FieldType>>;

  private constructor() {
    this.extensions = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * Register a platform-specific extension type
   * @param platform The platform identifier (e.g., 'optimizely', 'contentful')
   * @param typeName The custom type name
   * @param fieldType The field type identifier
   */
  public registerExtension(platform: string, typeName: string, fieldType: FieldType): void {
    if (!this.extensions.has(platform)) {
      this.extensions.set(platform, new Map());
    }
    this.extensions.get(platform)!.set(typeName, fieldType);
  }

  /**
   * Get all extensions for a platform
   * @param platform The platform identifier
   */
  public getExtensions(platform: string): Map<string, FieldType> | undefined {
    return this.extensions.get(platform);
  }

  /**
   * Check if a type is an extension for a specific platform
   * @param platform The platform identifier
   * @param type The field type to check
   */
  public isExtension(platform: string, type: FieldType): boolean {
    const platformExtensions = this.extensions.get(platform);
    if (!platformExtensions) return false;
    return Array.from(platformExtensions.values()).includes(type);
  }

  /**
   * Clear all extensions for a platform
   * @param platform The platform identifier
   */
  public clearPlatformExtensions(platform: string): void {
    this.extensions.delete(platform);
  }

  /**
   * Get all registered platforms
   */
  public getRegisteredPlatforms(): string[] {
    return Array.from(this.extensions.keys());
  }
}

/**
 * Example extension types that might be registered by specific providers
 * These are NOT universally available - they must be registered per platform
 */
export const EXTENSION_EXAMPLES = {
  // Optimizely-specific
  optimizely: {
    personalization: 'optimizely_personalization',
    experiment: 'optimizely_experiment',
    audience: 'optimizely_audience'
  },
  // Contentful-specific
  contentful: {
    location: 'contentful_location',
    richTextEmbedded: 'contentful_rich_text_embedded'
  },
  // Strapi-specific
  strapi: {
    dynamicZone: 'strapi_dynamic_zone',
    relation: 'strapi_relation'
  }
};

// Export singleton instance
export const extensionRegistry = ExtensionRegistry.getInstance();