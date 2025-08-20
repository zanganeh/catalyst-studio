/**
 * Fallback Strategies - Handling incompatible type conversions
 * Defines strategies for when direct type mapping is not possible
 */

import { Primitive, PrimitiveType } from '../types/primitives';
import { CommonPatternType, CommonPattern } from '../types/common-patterns';

/**
 * Fallback strategy enumeration
 */
export enum FallbackStrategy {
  BEST_MATCH = 'BEST_MATCH',     // Find closest compatible type
  FLATTEN = 'FLATTEN',           // Convert to simpler type
  PRESERVE = 'PRESERVE',         // Keep as JSON/text with metadata
  DOCUMENT = 'DOCUMENT',         // Add migration notes
  REJECT = 'REJECT'              // Fail with clear error
}

/**
 * Fallback execution result
 */
export interface FallbackResult {
  strategy: FallbackStrategy;
  success: boolean;
  output: any;
  targetType: string;
  confidence: number;
  dataPreserved: number; // Percentage of data preserved (0-100)
  metadata?: FallbackMetadata;
  warnings: string[];
  errors?: string[];
}

/**
 * Fallback metadata for tracking transformations
 */
export interface FallbackMetadata {
  originalType: string;
  originalPlatform?: string;
  transformationDate: Date;
  transformationReason: string;
  reversible: boolean;
  reverseInstructions?: string;
}

/**
 * Fallback strategy selector
 */
export interface StrategySelector {
  type: Primitive | CommonPatternType;
  targetPlatform: string;
  options?: FallbackOptions;
}

/**
 * Fallback options
 */
export interface FallbackOptions {
  preferredStrategy?: FallbackStrategy;
  maxDataLoss?: number; // Maximum acceptable data loss percentage
  preserveMetadata?: boolean;
  documentChanges?: boolean;
  strictMode?: boolean; // Reject if confidence < threshold
  confidenceThreshold?: number;
}

/**
 * Fallback strategy executor
 */
export class FallbackExecutor {
  private static readonly DEFAULT_OPTIONS: FallbackOptions = {
    maxDataLoss: 20,
    preserveMetadata: true,
    documentChanges: true,
    strictMode: false,
    confidenceThreshold: 70
  };

  /**
   * Execute fallback strategy
   */
  static execute(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options?: FallbackOptions
  ): FallbackResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const strategy = opts.preferredStrategy || this.selectStrategy(sourceType, targetPlatform, opts);

    switch (strategy) {
      case FallbackStrategy.BEST_MATCH:
        return this.executeBestMatch(value, sourceType, targetPlatform, opts);
      case FallbackStrategy.FLATTEN:
        return this.executeFlatten(value, sourceType, targetPlatform, opts);
      case FallbackStrategy.PRESERVE:
        return this.executePreserve(value, sourceType, targetPlatform, opts);
      case FallbackStrategy.DOCUMENT:
        return this.executeDocument(value, sourceType, targetPlatform, opts);
      case FallbackStrategy.REJECT:
        return this.executeReject(value, sourceType, targetPlatform, opts);
      default:
        return this.executeReject(value, sourceType, targetPlatform, opts);
    }
  }

  /**
   * Select appropriate strategy based on type and platform
   */
  static selectStrategy(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackStrategy {
    // If strict mode and low confidence, reject
    if (options.strictMode) {
      const confidence = this.calculateConfidence(sourceType, targetPlatform);
      if (confidence < (options.confidenceThreshold || 70)) {
        return FallbackStrategy.REJECT;
      }
    }

    // Pattern-specific strategy selection
    if ('pattern' in sourceType) {
      switch (sourceType.pattern) {
        case CommonPattern.RICH_TEXT:
        case CommonPattern.MEDIA:
        case CommonPattern.COMPONENT:
          return FallbackStrategy.PRESERVE;
        case CommonPattern.COLLECTION:
        case CommonPattern.REPEATER:
          return FallbackStrategy.FLATTEN;
        case CommonPattern.SELECT:
        case CommonPattern.SLUG:
        case CommonPattern.TAGS:
          return FallbackStrategy.BEST_MATCH;
        default:
          return FallbackStrategy.DOCUMENT;
      }
    }

    // Primitive types usually have good matches
    return FallbackStrategy.BEST_MATCH;
  }

  /**
   * Execute BEST_MATCH strategy
   */
  private static executeBestMatch(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackResult {
    const targetType = this.findBestMatch(sourceType, targetPlatform);
    const transformed = this.transformValue(value, sourceType, targetType);
    const dataPreserved = this.calculateDataPreservation(value, transformed);

    return {
      strategy: FallbackStrategy.BEST_MATCH,
      success: true,
      output: transformed,
      targetType: this.getTargetTypeName(targetType),
      confidence: this.calculateConfidence(sourceType, targetPlatform),
      dataPreserved,
      metadata: options.preserveMetadata ? this.createMetadata(sourceType, targetPlatform, 'Best match found') : undefined,
      warnings: dataPreserved < 100 ? [`${100 - dataPreserved}% of data structure modified`] : []
    };
  }

  /**
   * Execute FLATTEN strategy
   */
  private static executeFlatten(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackResult {
    const flattened = this.flattenValue(value, sourceType);
    const targetType = this.getSimpleType(sourceType);
    const dataPreserved = this.calculateDataPreservation(value, flattened);

    if (dataPreserved < (100 - (options.maxDataLoss || 20))) {
      return this.executeReject(value, sourceType, targetPlatform, options);
    }

    return {
      strategy: FallbackStrategy.FLATTEN,
      success: true,
      output: flattened,
      targetType: this.getTargetTypeName(targetType),
      confidence: 70,
      dataPreserved,
      metadata: options.preserveMetadata ? this.createMetadata(sourceType, targetPlatform, 'Flattened to simpler type') : undefined,
      warnings: [
        'Complex structure flattened',
        `${100 - dataPreserved}% of structure lost`
      ]
    };
  }

  /**
   * Execute PRESERVE strategy
   */
  private static executePreserve(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackResult {
    const preserved = {
      _type: 'preserved',
      _originalType: this.getTypeIdentifier(sourceType),
      _platform: targetPlatform,
      _timestamp: new Date().toISOString(),
      _data: value,
      _metadata: this.extractTypeMetadata(sourceType)
    };

    return {
      strategy: FallbackStrategy.PRESERVE,
      success: true,
      output: preserved,
      targetType: 'json',
      confidence: 100,
      dataPreserved: 100,
      metadata: options.preserveMetadata ? this.createMetadata(sourceType, targetPlatform, 'Preserved as JSON with metadata', true) : undefined,
      warnings: ['Data preserved in JSON format', 'Manual transformation may be needed']
    };
  }

  /**
   * Execute DOCUMENT strategy
   */
  private static executeDocument(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackResult {
    const documentation = this.generateMigrationDocumentation(sourceType, targetPlatform, value);
    const fallbackValue = this.createDocumentedValue(value, documentation);

    return {
      strategy: FallbackStrategy.DOCUMENT,
      success: true,
      output: fallbackValue,
      targetType: 'documented_json',
      confidence: 60,
      dataPreserved: 100,
      metadata: {
        originalType: this.getTypeIdentifier(sourceType),
        originalPlatform: targetPlatform,
        transformationDate: new Date(),
        transformationReason: 'Type incompatible - documented for manual migration',
        reversible: true,
        reverseInstructions: documentation.reverseInstructions
      },
      warnings: [
        'Manual migration required',
        'See documentation in _migration field'
      ]
    };
  }

  /**
   * Execute REJECT strategy
   */
  private static executeReject(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    options: FallbackOptions
  ): FallbackResult {
    const reason = this.getRejectReason(sourceType, targetPlatform);
    
    return {
      strategy: FallbackStrategy.REJECT,
      success: false,
      output: null,
      targetType: 'none',
      confidence: 0,
      dataPreserved: 0,
      warnings: [],
      errors: [
        `Cannot convert ${this.getTypeIdentifier(sourceType)} to ${targetPlatform}`,
        reason,
        'Manual intervention required'
      ]
    };
  }

  /**
   * Helper methods
   */

  private static findBestMatch(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string
  ): Primitive | CommonPatternType {
    // This would use the compatibility matrix to find the best match
    // For now, returning a simplified version
    if ('pattern' in sourceType) {
      // Convert pattern to primitive
      return {
        type: sourceType.fallbackPrimitive || PrimitiveType.JSON
      } as Primitive;
    }
    return sourceType;
  }

  private static transformValue(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType
  ): any {
    // Implement actual transformation logic
    return value;
  }

  private static flattenValue(
    value: any,
    sourceType: Primitive | CommonPatternType
  ): any {
    if (Array.isArray(value)) {
      return value.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : item
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value;
  }

  private static getSimpleType(
    sourceType: Primitive | CommonPatternType
  ): Primitive {
    if ('type' in sourceType) {
      return sourceType;
    }
    
    return {
      type: sourceType.fallbackPrimitive || PrimitiveType.JSON
    } as Primitive;
  }

  private static calculateConfidence(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string
  ): number {
    // This would use the compatibility matrix
    // For now, returning a default value
    if ('type' in sourceType) {
      return 85; // Primitives usually have good compatibility
    }
    return 70; // Patterns are more complex
  }

  private static calculateDataPreservation(original: any, transformed: any): number {
    if (original === transformed) return 100;
    
    // Simple calculation based on structure
    const originalKeys = this.extractKeys(original);
    const transformedKeys = this.extractKeys(transformed);
    
    if (originalKeys.length === 0) return 100;
    
    const preserved = transformedKeys.filter(key => originalKeys.includes(key)).length;
    return Math.round((preserved / originalKeys.length) * 100);
  }

  private static extractKeys(value: any): string[] {
    if (typeof value !== 'object' || value === null) return [];
    
    const keys: string[] = [];
    const extract = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          extract(obj[key], fullKey);
        }
      });
    };
    
    extract(value);
    return keys;
  }

  private static getTypeIdentifier(type: Primitive | CommonPatternType): string {
    if ('type' in type) {
      return `primitive:${type.type}`;
    } else if ('pattern' in type) {
      return `pattern:${type.pattern}`;
    }
    return 'unknown';
  }

  private static getTargetTypeName(type: Primitive | CommonPatternType): string {
    if ('type' in type) {
      return type.type;
    } else if ('pattern' in type) {
      return type.pattern;
    }
    return 'unknown';
  }

  private static createMetadata(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    reason: string,
    reversible: boolean = false
  ): FallbackMetadata {
    return {
      originalType: this.getTypeIdentifier(sourceType),
      originalPlatform: targetPlatform,
      transformationDate: new Date(),
      transformationReason: reason,
      reversible,
      reverseInstructions: reversible ? 'Extract _data field from preserved structure' : undefined
    };
  }

  private static extractTypeMetadata(type: Primitive | CommonPatternType): any {
    const metadata: any = {};
    
    if ('type' in type) {
      metadata.primitiveType = type.type;
      if (type.required) metadata.required = true;
      if (type.description) metadata.description = type.description;
    } else if ('pattern' in type) {
      metadata.patternType = type.pattern;
      if (type.required) metadata.required = true;
      if (type.description) metadata.description = type.description;
    }
    
    return metadata;
  }

  private static generateMigrationDocumentation(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    value: any
  ): any {
    return {
      sourceType: this.getTypeIdentifier(sourceType),
      targetPlatform,
      migrationSteps: [
        'Review the original data structure',
        `Create appropriate ${targetPlatform} type`,
        'Map fields according to platform requirements',
        'Validate transformed data'
      ],
      considerations: [
        'Check for data loss',
        'Verify required fields',
        'Test with sample data'
      ],
      reverseInstructions: 'Extract from _original field'
    };
  }

  private static createDocumentedValue(value: any, documentation: any): any {
    return {
      _migration: documentation,
      _original: value,
      _timestamp: new Date().toISOString()
    };
  }

  private static getRejectReason(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string
  ): string {
    const typeId = this.getTypeIdentifier(sourceType);
    return `Type ${typeId} is incompatible with ${targetPlatform} and no safe fallback exists`;
  }
}

/**
 * Fallback strategy selector helper
 */
export class StrategyHelper {
  /**
   * Get recommended strategy for type pair
   */
  static recommendStrategy(
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string
  ): FallbackStrategy {
    // Rich content should be preserved
    if ('pattern' in sourceType) {
      switch (sourceType.pattern) {
        case CommonPattern.RICH_TEXT:
        case CommonPattern.MEDIA:
          return FallbackStrategy.PRESERVE;
        case CommonPattern.COMPONENT:
          return FallbackStrategy.DOCUMENT;
        default:
          return FallbackStrategy.BEST_MATCH;
      }
    }
    
    // Primitives can usually find matches
    return FallbackStrategy.BEST_MATCH;
  }

  /**
   * Check if strategy is appropriate
   */
  static isStrategyAppropriate(
    strategy: FallbackStrategy,
    sourceType: Primitive | CommonPatternType,
    maxDataLoss: number
  ): boolean {
    if (strategy === FallbackStrategy.REJECT) {
      return true; // Always appropriate as last resort
    }
    
    if (strategy === FallbackStrategy.FLATTEN) {
      // Only appropriate for complex types
      return 'pattern' in sourceType;
    }
    
    if (strategy === FallbackStrategy.PRESERVE) {
      // Check if data loss is acceptable
      return maxDataLoss >= 0;
    }
    
    return true;
  }
}