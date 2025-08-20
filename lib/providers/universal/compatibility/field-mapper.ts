/**
 * Field Mapper - Maps universal types to platform-specific types
 * Uses dependency injection for platform-specific mappings
 */

import { Primitive, PrimitiveType } from '../types/primitives';
import { CommonPatternType, CommonPattern } from '../types/common-patterns';
import { CompatibilityScorer } from './matrix';
import { PatternTransformer } from '../transformers/pattern-transformer';
import { ITypeProvider } from '../interfaces/type-provider';

/**
 * Field mapping result
 */
export interface FieldMappingResult {
  success: boolean;
  targetType: string;
  confidence: number;
  transformation?: TransformationDetails;
  warnings: string[];
  fallback?: FallbackDetails;
}

/**
 * Transformation details
 */
export interface TransformationDetails {
  required: boolean;
  type: 'direct' | 'conversion' | 'fallback';
  steps: string[];
  dataLoss: boolean;
}

/**
 * Fallback details
 */
export interface FallbackDetails {
  strategy: 'primitive' | 'json' | 'text';
  targetType: string;
  confidence: number;
  reason: string;
}

/**
 * Bidirectional mapping result
 */
export interface BidirectionalMapping {
  forward: FieldMappingResult;
  reverse: FieldMappingResult;
  roundTripAccuracy: number;
}

/**
 * Field mapper class - uses dependency injection
 */
export class FieldMapper {
  /**
   * Map universal type to platform-specific type using provider
   */
  static mapToPlatform(
    universalType: Primitive | CommonPatternType,
    targetPlatform: string,
    provider?: ITypeProvider
  ): FieldMappingResult {
    if (!provider) {
      return this.createFallbackMapping(universalType, targetPlatform);
    }

    const typeKey = this.getTypeKey(universalType);
    const platformMapping = provider.getCompatibilityMapping(typeKey);

    if (!platformMapping) {
      return this.createFallbackMapping(universalType, targetPlatform);
    }

    const warnings: string[] = [];
    let transformation: TransformationDetails | undefined;

    if (platformMapping.transformationRequired) {
      transformation = {
        required: true,
        type: platformMapping.dataLossRisk === 'none' ? 'conversion' : 'fallback',
        steps: this.getTransformationSteps(typeKey, targetPlatform),
        dataLoss: platformMapping.dataLossRisk !== 'none'
      };
    }

    if (platformMapping.notes) {
      warnings.push(platformMapping.notes);
    }

    if (platformMapping.dataLossRisk !== 'none') {
      warnings.push(`Data loss risk: ${platformMapping.dataLossRisk}`);
    }

    return {
      success: true,
      targetType: platformMapping.nativeType,
      confidence: platformMapping.confidence,
      transformation,
      warnings
    };
  }

  /**
   * Map platform-specific type to universal type using provider
   */
  static mapFromPlatform(
    platformType: string,
    sourcePlatform: string,
    provider?: ITypeProvider
  ): FieldMappingResult {
    if (!provider) {
      return {
        success: false,
        targetType: 'json',
        confidence: 60,
        warnings: [`No provider for ${sourcePlatform}`],
        fallback: {
          strategy: 'json',
          targetType: PrimitiveType.JSON,
          confidence: 60,
          reason: 'No provider available'
        }
      };
    }

    // Provider doesn't have reverse mapping in the interface
    // Use a basic fallback implementation

    // No direct mapping found, use fallback
    return {
      success: false,
      targetType: 'json',
      confidence: 60,
      warnings: [`No mapping found for ${sourcePlatform}:${platformType}`],
      fallback: {
        strategy: 'json',
        targetType: PrimitiveType.JSON,
        confidence: 60,
        reason: 'Unknown platform type'
      }
    };
  }

  /**
   * Perform bidirectional mapping
   */
  static mapBidirectional(
    universalType: Primitive | CommonPatternType,
    platform: string,
    provider?: ITypeProvider
  ): BidirectionalMapping {
    const forward = this.mapToPlatform(universalType, platform, provider);
    
    // If forward mapping succeeded, try reverse mapping
    let reverse: FieldMappingResult;
    if (forward.success) {
      reverse = this.mapFromPlatform(forward.targetType, platform, provider);
    } else {
      reverse = {
        success: false,
        targetType: this.getTypeKey(universalType),
        confidence: 0,
        warnings: ['Forward mapping failed']
      };
    }

    // Calculate round-trip accuracy
    const roundTripAccuracy = this.calculateRoundTripAccuracy(
      universalType,
      forward,
      reverse
    );

    return {
      forward,
      reverse,
      roundTripAccuracy
    };
  }

  /**
   * Handle type conversions with confidence scores
   */
  static convertType(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    provider?: ITypeProvider
  ): {
    value: any;
    confidence: number;
    warnings: string[];
  } {
    const mapping = this.mapToPlatform(sourceType, targetPlatform, provider);
    
    if (!mapping.success) {
      return {
        value,
        confidence: 0,
        warnings: ['Mapping failed']
      };
    }

    let convertedValue = value;
    const warnings: string[] = [...mapping.warnings];

    // Apply transformation if needed
    if (mapping.transformation?.required && provider) {
      try {
        const result = provider.transformFromUniversal(
          value,
          sourceType,
          mapping.targetType
        );
        
        if (result.success) {
          convertedValue = result.value;
        } else {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        warnings.push(`Transformation error: ${error}`);
        return {
          value,
          confidence: 0,
          warnings
        };
      }
    }

    return {
      value: convertedValue,
      confidence: mapping.confidence,
      warnings
    };
  }

  /**
   * Create mapping documentation
   */
  static documentMapping(
    universalType: Primitive | CommonPatternType,
    platform: string,
    provider?: ITypeProvider
  ): string {
    const mapping = this.mapToPlatform(universalType, platform, provider);
    const typeKey = this.getTypeKey(universalType);
    
    let doc = `## Mapping: ${typeKey} → ${platform}\n\n`;
    
    if (mapping.success) {
      doc += `**Target Type:** ${mapping.targetType}\n`;
      doc += `**Confidence:** ${mapping.confidence}%\n`;
      
      if (mapping.transformation) {
        doc += `\n### Transformation Required\n`;
        doc += `- Type: ${mapping.transformation.type}\n`;
        doc += `- Data Loss: ${mapping.transformation.dataLoss ? 'Yes' : 'No'}\n`;
        doc += `- Steps:\n`;
        mapping.transformation.steps.forEach(step => {
          doc += `  1. ${step}\n`;
        });
      }
      
      if (mapping.warnings.length > 0) {
        doc += `\n### Warnings\n`;
        mapping.warnings.forEach(warning => {
          doc += `- ${warning}\n`;
        });
      }
      
      if (mapping.fallback) {
        doc += `\n### Fallback Strategy\n`;
        doc += `- Strategy: ${mapping.fallback.strategy}\n`;
        doc += `- Target: ${mapping.fallback.targetType}\n`;
        doc += `- Reason: ${mapping.fallback.reason}\n`;
      }
    } else {
      doc += `**Mapping Failed**\n`;
      doc += `No direct mapping available. Fallback to JSON storage recommended.\n`;
    }
    
    return doc;
  }

  /**
   * Private helper methods
   */

  private static getTypeKey(type: Primitive | CommonPatternType): PrimitiveType | CommonPattern {
    if ('type' in type) {
      return type.type;
    } else if ('pattern' in type) {
      return type.pattern;
    }
    throw new Error('Unknown type structure');
  }

  private static getUniversalTypeName(type: PrimitiveType | CommonPattern): string {
    return type;
  }

  private static createFallbackMapping(
    universalType: Primitive | CommonPatternType,
    targetPlatform: string
  ): FieldMappingResult {
    const typeKey = this.getTypeKey(universalType);
    
    // Pattern types fallback to their primitive
    if ('pattern' in universalType) {
      const transformResult = PatternTransformer.transformToFallback(universalType);
      const fallbackPrimitive = transformResult.target as Primitive;
      
      return {
        success: false,
        targetType: this.getFallbackType(targetPlatform),
        confidence: transformResult.confidence,
        warnings: [
          `No direct mapping for ${typeKey} on ${targetPlatform}`,
          ...transformResult.warnings,
          ...transformResult.dataLoss
        ],
        fallback: {
          strategy: 'primitive',
          targetType: fallbackPrimitive.type,
          confidence: transformResult.confidence,
          reason: 'Pattern not supported, using primitive fallback'
        }
      };
    }
    
    // Primitive types fallback to JSON
    return {
      success: false,
      targetType: this.getFallbackType(targetPlatform),
      confidence: 60,
      warnings: [`No mapping for ${typeKey} on ${targetPlatform}`],
      fallback: {
        strategy: 'json',
        targetType: 'JSON',
        confidence: 60,
        reason: 'No platform mapping available'
      }
    };
  }

  private static getFallbackType(platform: string): string {
    const fallbackTypes: Record<string, string> = {
      optimizely: 'String',
      contentful: 'Object',
      strapi: 'json',
      sanity: 'object'
    };
    return fallbackTypes[platform] || 'string';
  }

  private static getTransformationSteps(
    universalType: PrimitiveType | CommonPattern,
    targetPlatform: string
  ): string[] {
    const steps: string[] = [];
    
    // Add type-specific transformation steps
    if (universalType === CommonPattern.RICH_TEXT) {
      steps.push('Parse rich text format');
      steps.push('Convert to platform format');
      steps.push('Validate converted content');
    } else if (universalType === CommonPattern.MEDIA) {
      steps.push('Extract media metadata');
      steps.push('Upload to platform media library');
      steps.push('Create platform reference');
    } else if (universalType === CommonPattern.COMPONENT) {
      steps.push('Resolve component structure');
      steps.push('Map component fields');
      steps.push('Create platform component');
    } else {
      steps.push('Convert data format');
      steps.push('Apply platform validation');
    }
    
    return steps;
  }

  private static applyTransformation(
    value: any,
    sourceType: Primitive | CommonPatternType,
    targetPlatform: string,
    targetType: string
  ): any {
    // This would contain actual transformation logic
    // For now, returning the value as-is with a note
    console.log(`Transforming ${JSON.stringify(sourceType)} to ${targetPlatform}:${targetType}`);
    
    // Handle specific transformations
    if ('pattern' in sourceType) {
      switch (sourceType.pattern) {
        case CommonPattern.RICH_TEXT:
          // Convert rich text formats
          if (targetPlatform === 'optimizely') {
            // Convert to HTML for XhtmlString
            return value;
          }
          break;
        case CommonPattern.MEDIA:
          // Convert media references
          if (typeof value === 'object' && value.url) {
            return value;
          }
          break;
        case CommonPattern.TAGS:
          // Ensure tags are in array format
          if (Array.isArray(value)) {
            return value;
          } else if (typeof value === 'string') {
            return value.split(',').map(t => t.trim());
          }
          break;
      }
    }
    
    return value;
  }

  private static calculateRoundTripAccuracy(
    originalType: Primitive | CommonPatternType,
    forward: FieldMappingResult,
    reverse: FieldMappingResult
  ): number {
    if (!forward.success || !reverse.success) {
      return 0;
    }
    
    const originalKey = this.getTypeKey(originalType);
    const roundTripKey = reverse.targetType;
    
    if (originalKey === roundTripKey) {
      // Perfect round trip
      return Math.min(forward.confidence, reverse.confidence);
    }
    
    // Imperfect round trip - calculate degradation
    const avgConfidence = (forward.confidence + reverse.confidence) / 2;
    const penalty = 20; // 20% penalty for type mismatch
    
    return Math.max(0, avgConfidence - penalty);
  }
}