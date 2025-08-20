/**
 * Extension Loader - Dynamic loading of platform-specific extensions
 */

import { 
  PlatformExtension, 
  ExtensionRegistry,
  ExtensionValidator,
  PLATFORM_CAPABILITIES,
  ExtensionConflictResolver
} from '../types/extensions';

/**
 * Extension loader configuration
 */
export interface ExtensionLoaderConfig {
  platform: string;
  autoLoad?: boolean;
  validateOnLoad?: boolean;
  conflictResolution?: 'first' | 'last' | 'highest-confidence';
}

/**
 * Extension loader result
 */
export interface ExtensionLoadResult {
  loaded: PlatformExtension[];
  failed: Array<{
    extension: string;
    reason: string;
  }>;
  conflicts: PlatformExtension[][];
}

/**
 * Dynamic extension loader
 */
export class ExtensionLoader {
  private config: ExtensionLoaderConfig;
  private loadedExtensions: Map<string, PlatformExtension> = new Map();

  constructor(config: ExtensionLoaderConfig) {
    this.config = {
      autoLoad: true,
      validateOnLoad: true,
      conflictResolution: 'highest-confidence',
      ...config
    };

    if (this.config.autoLoad) {
      this.loadPlatformExtensions();
    }
  }

  /**
   * Load extensions for the configured platform
   */
  async loadPlatformExtensions(): Promise<ExtensionLoadResult> {
    const result: ExtensionLoadResult = {
      loaded: [],
      failed: [],
      conflicts: []
    };

    try {
      // Dynamically import platform-specific extensions
      const extensions = await this.importPlatformExtensions(this.config.platform);
      
      for (const extension of extensions) {
        const loadResult = this.loadExtension(extension);
        
        if (loadResult.success) {
          result.loaded.push(extension);
        } else {
          result.failed.push({
            extension: extension.id,
            reason: loadResult.reason || 'Unknown error'
          });
        }
      }

      // Check for conflicts
      const conflicts = ExtensionConflictResolver.getConflicts(result.loaded);
      if (conflicts.length > 0) {
        result.conflicts = conflicts;
        
        // Resolve conflicts if configured
        if (this.config.conflictResolution) {
          result.loaded = this.resolveConflicts(result.loaded);
        }
      }
    } catch (error) {
      console.error(`Failed to load extensions for platform ${this.config.platform}:`, error);
    }

    return result;
  }

  /**
   * Import platform-specific extensions
   */
  private async importPlatformExtensions(platform: string): Promise<PlatformExtension[]> {
    const extensions: PlatformExtension[] = [];

    try {
      switch (platform.toLowerCase()) {
        case 'optimizely':
          const optimizelyModule = await import('./optimizely');
          extensions.push(...optimizelyModule.default);
          break;
        
        // Future platforms - currently just return empty arrays
        case 'contentful':
        case 'strapi':
        case 'sanity':
          // These will be implemented post-MVP
          console.info(`Platform ${platform} extensions will be available post-MVP`);
          break;
          
        default:
          console.warn(`Unknown platform: ${platform}`);
      }
    } catch (error) {
      // If the platform module doesn't exist yet, that's okay
      console.info(`No extensions found for platform: ${platform}`);
    }

    return extensions;
  }

  /**
   * Load a single extension
   */
  private loadExtension(extension: PlatformExtension): { success: boolean; reason?: string } {
    // Validate if configured
    if (this.config.validateOnLoad) {
      if (!ExtensionValidator.validate(extension)) {
        return { success: false, reason: 'Invalid extension structure' };
      }

      // Check platform capabilities
      const capabilities = PLATFORM_CAPABILITIES[this.config.platform];
      if (capabilities && !ExtensionValidator.checkCapabilities(extension, capabilities.capabilities)) {
        return { success: false, reason: 'Platform does not support required capabilities' };
      }
    }

    // Register the extension
    ExtensionRegistry.register(extension);
    this.loadedExtensions.set(`${extension.platform}:${extension.id}`, extension);

    return { success: true };
  }

  /**
   * Resolve conflicts between extensions
   */
  private resolveConflicts(extensions: PlatformExtension[]): PlatformExtension[] {
    const resolved: Map<string, PlatformExtension> = new Map();
    const groups = new Map<string, PlatformExtension[]>();

    // Group extensions by key
    for (const ext of extensions) {
      const key = `${ext.platform}:${ext.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ext);
    }

    // Resolve each group
    for (const [key, group] of groups) {
      const winner = ExtensionConflictResolver.resolve(group, this.config.conflictResolution);
      if (winner) {
        resolved.set(key, winner);
      }
    }

    return Array.from(resolved.values());
  }

  /**
   * Get loaded extensions
   */
  getLoadedExtensions(): PlatformExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  /**
   * Get extension by ID
   */
  getExtension(id: string): PlatformExtension | undefined {
    return this.loadedExtensions.get(`${this.config.platform}:${id}`);
  }

  /**
   * Check if extension is loaded
   */
  hasExtension(id: string): boolean {
    return this.loadedExtensions.has(`${this.config.platform}:${id}`);
  }

  /**
   * Unload an extension
   */
  unloadExtension(id: string): boolean {
    const key = `${this.config.platform}:${id}`;
    return this.loadedExtensions.delete(key);
  }

  /**
   * Unload all extensions
   */
  unloadAll(): void {
    this.loadedExtensions.clear();
  }

  /**
   * Detect extension capabilities
   */
  detectCapabilities(): string[] {
    const capabilities = new Set<string>();
    
    for (const extension of this.loadedExtensions.values()) {
      if (extension.requiredCapabilities) {
        extension.requiredCapabilities.forEach(cap => capabilities.add(cap));
      }
    }
    
    return Array.from(capabilities);
  }

  /**
   * Get extension for a specific type
   */
  getExtensionForType(type: any): PlatformExtension | undefined {
    for (const extension of this.loadedExtensions.values()) {
      if (JSON.stringify(extension.extendsType) === JSON.stringify(type)) {
        return extension;
      }
    }
    return undefined;
  }

  /**
   * Check extension compatibility
   */
  checkCompatibility(extension: PlatformExtension): boolean {
    const capabilities = PLATFORM_CAPABILITIES[this.config.platform];
    
    if (!capabilities) {
      console.warn(`No capability information for platform: ${this.config.platform}`);
      return true;
    }

    return ExtensionValidator.checkCapabilities(extension, capabilities.capabilities);
  }

  /**
   * Get platform capabilities
   */
  getPlatformCapabilities(): string[] {
    return PLATFORM_CAPABILITIES[this.config.platform]?.capabilities || [];
  }

  /**
   * Get platform limitations
   */
  getPlatformLimitations(): string[] {
    return PLATFORM_CAPABILITIES[this.config.platform]?.limitations || [];
  }
}