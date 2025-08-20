/**
 * Platform Extensions Layer - Platform-specific type features
 * Part of the three-layer type system (primitives, common patterns, extensions)
 */

import { Primitive } from './primitives';
import { CommonPatternType } from './common-patterns';

/**
 * Platform extension interface
 * Defines structure for platform-specific type extensions
 */
export interface PlatformExtension {
  /**
   * Unique identifier for the extension
   */
  id: string;

  /**
   * Platform this extension belongs to
   */
  platform: string;

  /**
   * Name of the extension
   */
  name: string;

  /**
   * Description of what this extension provides
   */
  description: string;

  /**
   * Version of the extension
   */
  version: string;

  /**
   * Base type this extension extends (primitive or pattern)
   */
  extendsType: Primitive | CommonPatternType;

  /**
   * Platform-specific properties
   */
  platformProperties: Record<string, any>;

  /**
   * Confidence score when transforming to/from universal type
   */
  transformationConfidence: number;

  /**
   * Features this extension provides beyond the base type
   */
  features: ExtensionFeature[];

  /**
   * Required capabilities for this extension to work
   */
  requiredCapabilities?: string[];

  /**
   * Migration path to universal type
   */
  migrationStrategy?: MigrationStrategy;
}

/**
 * Extension feature definition
 */
export interface ExtensionFeature {
  name: string;
  description: string;
  universal: boolean; // Can this feature be represented in universal format?
  fallback?: string; // How to handle if not supported
}

/**
 * Migration strategy for platform extensions
 */
export interface MigrationStrategy {
  toUniversal: (value: any) => any;
  fromUniversal: (value: any) => any;
  dataLossWarnings: string[];
}

/**
 * Extension validator for validating platform extensions
 */
export class ExtensionValidator {
  /**
   * Validate a platform extension
   */
  static validate(extension: PlatformExtension): boolean {
    if (!extension.id || !extension.platform || !extension.name) {
      return false;
    }
    
    if (!extension.extendsType) {
      return false;
    }
    
    if (extension.transformationConfidence < 0 || extension.transformationConfidence > 100) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate extension compatibility
   */
  static validateCompatibility(extension: PlatformExtension, capabilities: string[]): boolean {
    if (!extension.requiredCapabilities) {
      return true;
    }
    
    return extension.requiredCapabilities.every(cap => capabilities.includes(cap));
  }
}

/**
 * Extension registry for managing platform extensions
 */
export class ExtensionRegistry {
  private static extensions: Map<string, PlatformExtension> = new Map();

  /**
   * Register a platform extension
   */
  static register(extension: PlatformExtension): void {
    const key = `${extension.platform}:${extension.id}`;
    this.extensions.set(key, extension);
  }

  /**
   * Get extension by platform and ID
   */
  static get(platform: string, id: string): PlatformExtension | undefined {
    const key = `${platform}:${id}`;
    return this.extensions.get(key);
  }

  /**
   * Get all extensions for a platform
   */
  static getByPlatform(platform: string): PlatformExtension[] {
    const result: PlatformExtension[] = [];
    this.extensions.forEach((ext, key) => {
      if (key.startsWith(`${platform}:`)) {
        result.push(ext);
      }
    });
    return result;
  }

  /**
   * Get extensions by base type
   */
  static getByBaseType(baseType: Primitive | CommonPatternType): PlatformExtension[] {
    const result: PlatformExtension[] = [];
    this.extensions.forEach(ext => {
      if (JSON.stringify(ext.extendsType) === JSON.stringify(baseType)) {
        result.push(ext);
      }
    });
    return result;
  }

  /**
   * Clear all registered extensions
   */
  static clear(): void {
    this.extensions.clear();
  }
}

/**
 * Extension metadata structure
 */
export interface ExtensionMetadata {
  /**
   * Extension identifier
   */
  extensionId: string;

  /**
   * Platform identifier
   */
  platform: string;

  /**
   * Applied at timestamp
   */
  appliedAt: Date;

  /**
   * User who applied the extension
   */
  appliedBy?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Platform capabilities definition
 * NO HARDCODED PLATFORM DATA - providers inject their own capabilities
 */
export interface PlatformCapabilities {
  platform: string;
  version: string;
  capabilities: string[];
  limitations: string[];
  maxNestingDepth?: number;
  supportsComponents: boolean;
  supportsDynamicZones: boolean;
  supportsReferences: boolean;
  supportsLocalization: boolean;
  supportsVersioning: boolean;
  supportsWorkflows: boolean;
}

/**
 * Platform capabilities registry - populated by providers
 * NO HARDCODED DATA - all capabilities come from registered providers
 */
export class PlatformCapabilitiesRegistry {
  private static capabilities: Map<string, PlatformCapabilities> = new Map();

  /**
   * Register platform capabilities (called by providers)
   */
  static register(platformId: string, capabilities: PlatformCapabilities): void {
    this.capabilities.set(platformId, capabilities);
  }

  /**
   * Get capabilities for a platform
   */
  static get(platformId: string): PlatformCapabilities | undefined {
    return this.capabilities.get(platformId);
  }

  /**
   * Get all registered platforms
   */
  static getPlatforms(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Clear all registered capabilities
   */
  static clear(): void {
    this.capabilities.clear();
  }
}

/**
 * Temporary backward compatibility export
 * @deprecated Use PlatformCapabilitiesRegistry instead
 */
export const PLATFORM_CAPABILITIES: Record<string, PlatformCapabilities> = {};

/**
 * Extension conflict resolution
 */
export class ExtensionConflictResolver {
  /**
   * Resolve conflicts between extensions
   */
  static resolve(
    extensions: PlatformExtension[],
    strategy: 'first' | 'last' | 'highest-confidence' = 'highest-confidence'
  ): PlatformExtension | null {
    if (extensions.length === 0) return null;
    if (extensions.length === 1) return extensions[0];

    switch (strategy) {
      case 'first':
        return extensions[0];
      case 'last':
        return extensions[extensions.length - 1];
      case 'highest-confidence':
        return extensions.reduce((best, current) => 
          current.transformationConfidence > best.transformationConfidence ? current : best
        );
      default:
        return extensions[0];
    }
  }

  /**
   * Check for conflicts between extensions
   */
  static hasConflicts(extensions: PlatformExtension[]): boolean {
    const seen = new Set<string>();
    
    for (const ext of extensions) {
      const key = `${ext.platform}:${ext.id}`;
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
    
    return false;
  }

  /**
   * Get conflicts between extensions
   */
  static getConflicts(extensions: PlatformExtension[]): PlatformExtension[] {
    const conflicts: PlatformExtension[] = [];
    const seen = new Map<string, PlatformExtension>();
    
    for (const ext of extensions) {
      const key = `${ext.platform}:${ext.id}`;
      if (seen.has(key)) {
        if (!conflicts.includes(seen.get(key)!)) {
          conflicts.push(seen.get(key)!);
        }
        if (!conflicts.includes(ext)) {
          conflicts.push(ext);
        }
      } else {
        seen.set(key, ext);
      }
    }
    
    return conflicts;
  }

  /**
   * Get conflict details
   */
  static getConflictDetails(extensions: PlatformExtension[]): Array<{
    extension1: PlatformExtension;
    extension2: PlatformExtension;
    conflictType: 'id' | 'feature' | 'capability';
  }> {
    const conflicts: Array<{
      extension1: PlatformExtension;
      extension2: PlatformExtension;
      conflictType: 'id' | 'feature' | 'capability';
    }> = [];

    for (let i = 0; i < extensions.length; i++) {
      for (let j = i + 1; j < extensions.length; j++) {
        const ext1 = extensions[i];
        const ext2 = extensions[j];

        // Check ID conflicts
        if (ext1.platform === ext2.platform && ext1.id === ext2.id) {
          conflicts.push({
            extension1: ext1,
            extension2: ext2,
            conflictType: 'id'
          });
        }

        // Check feature conflicts
        const features1 = new Set(ext1.features.map(f => f.name));
        const features2 = new Set(ext2.features.map(f => f.name));
        const commonFeatures = [...features1].filter(f => features2.has(f));
        
        if (commonFeatures.length > 0) {
          conflicts.push({
            extension1: ext1,
            extension2: ext2,
            conflictType: 'feature'
          });
        }
      }
    }

    return conflicts;
  }
}

/**
 * Extension application result
 */
export interface ExtensionApplicationResult {
  success: boolean;
  appliedExtensions: PlatformExtension[];
  skippedExtensions: Array<{
    extension: PlatformExtension;
    reason: string;
  }>;
  conflicts: Array<{
    extension1: PlatformExtension;
    extension2: PlatformExtension;
    resolution: 'used-first' | 'used-second' | 'merged' | 'skipped-both';
  }>;
  warnings: string[];
}