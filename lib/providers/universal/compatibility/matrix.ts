/**
 * Field Type Compatibility Matrix Interfaces
 * Defines interfaces for type compatibility without hardcoded platform data
 */

import { PrimitiveType } from '../types/primitives';
import { CommonPattern } from '../types/common-patterns';

/**
 * Compatibility matrix interface
 */
export interface CompatibilityMatrix {
  universalType: PrimitiveType | CommonPattern;
  platformMappings: PlatformMapping[];
}

/**
 * Platform mapping for a universal type
 */
export interface PlatformMapping {
  platform: string;
  nativeType: string;
  confidence: number;
  transformationRequired: boolean;
  dataLossRisk: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Compatibility score result
 */
export interface CompatibilityScore {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  recommendations: string[];
}

/**
 * Compatibility scorer that uses dependency injection
 * NO HARDCODED PLATFORM DATA - all data comes from injected providers
 */
export class CompatibilityScorer {
  /**
   * Calculate compatibility score using injected provider
   * @param universalType The universal type to check
   * @param platform The target platform
   * @param provider The injected type provider with platform mappings
   */
  static calculateScore(
    universalType: PrimitiveType | CommonPattern,
    platform: string,
    provider?: any // ITypeProvider interface from registry
  ): CompatibilityScore {
    // If no provider given, return low confidence
    if (!provider) {
      return {
        score: 0,
        confidence: 'low',
        warnings: ['No type provider available for platform'],
        recommendations: ['Register a type provider for this platform']
      };
    }

    // Get mapping from the provider
    const mapping = provider.getCompatibilityMapping?.(universalType);
    
    if (!mapping) {
      return {
        score: 0,
        confidence: 'low',
        warnings: [`No mapping defined for type: ${universalType}`],
        recommendations: ['Create fallback strategy', 'Use JSON primitive as fallback']
      };
    }

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Add warnings based on data loss risk
    switch (mapping.dataLossRisk) {
      case 'high':
        warnings.push('High risk of data loss during transformation');
        recommendations.push('Consider alternative type or accept data loss');
        break;
      case 'medium':
        warnings.push('Moderate risk of data loss');
        recommendations.push('Review transformation logic carefully');
        break;
      case 'low':
        warnings.push('Minor data loss possible');
        break;
    }

    if (mapping.transformationRequired) {
      warnings.push('Transformation required between formats');
      recommendations.push('Implement transformation logic');
    }

    if (mapping.notes) {
      warnings.push(mapping.notes);
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (mapping.confidence >= 90) {
      confidence = 'high';
    } else if (mapping.confidence >= 70) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: mapping.confidence,
      confidence,
      warnings,
      recommendations
    };
  }

  /**
   * Identify required transformations using injected providers
   */
  static identifyTransformations(
    universalType: PrimitiveType | CommonPattern,
    sourceProvider: any,
    targetProvider: any
  ): string[] {
    const transformations: string[] = [];
    
    if (!sourceProvider || !targetProvider) {
      return ['Provider not available'];
    }
    
    const sourceMapping = sourceProvider.getCompatibilityMapping?.(universalType);
    const targetMapping = targetProvider.getCompatibilityMapping?.(universalType);
    
    if (!sourceMapping || !targetMapping) {
      return ['Platform mapping not found'];
    }
    
    if (sourceMapping.nativeType !== targetMapping.nativeType) {
      transformations.push(`Convert ${sourceMapping.nativeType} to ${targetMapping.nativeType}`);
    }
    
    if (sourceMapping.transformationRequired || targetMapping.transformationRequired) {
      transformations.push('Format transformation required');
    }
    
    if (sourceMapping.dataLossRisk !== 'none' || targetMapping.dataLossRisk !== 'none') {
      transformations.push('Potential data loss during migration');
    }
    
    return transformations;
  }

  /**
   * Detect potential data loss using injected providers
   */
  static detectDataLoss(
    universalType: PrimitiveType | CommonPattern,
    sourceProvider: any,
    targetProvider: any
  ): {
    hasDataLoss: boolean;
    severity: 'none' | 'low' | 'medium' | 'high';
    details: string[];
  } {
    if (!sourceProvider || !targetProvider) {
      return {
        hasDataLoss: true,
        severity: 'high',
        details: ['Provider not available']
      };
    }
    
    const sourceMapping = sourceProvider.getCompatibilityMapping?.(universalType);
    const targetMapping = targetProvider.getCompatibilityMapping?.(universalType);
    
    if (!sourceMapping || !targetMapping) {
      return {
        hasDataLoss: true,
        severity: 'high',
        details: ['Platform mapping not found']
      };
    }
    
    const details: string[] = [];
    let maxSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';
    
    // Compare data loss risks
    const severityLevels = ['none', 'low', 'medium', 'high'];
    const sourceSeverity = severityLevels.indexOf(sourceMapping.dataLossRisk);
    const targetSeverity = severityLevels.indexOf(targetMapping.dataLossRisk);
    const maxSeverityIndex = Math.max(sourceSeverity, targetSeverity);
    maxSeverity = severityLevels[maxSeverityIndex] as any;
    
    if (sourceMapping.dataLossRisk !== 'none') {
      details.push(`Source platform: ${sourceMapping.notes || 'Data loss possible'}`);
    }
    
    if (targetMapping.dataLossRisk !== 'none') {
      details.push(`Target platform: ${targetMapping.notes || 'Data loss possible'}`);
    }
    
    // Check confidence difference
    const confidenceDiff = Math.abs(sourceMapping.confidence - targetMapping.confidence);
    if (confidenceDiff > 20) {
      details.push(`Large confidence difference (${confidenceDiff}%) between platforms`);
      if (maxSeverity === 'none') maxSeverity = 'low';
    }
    
    return {
      hasDataLoss: maxSeverity !== 'none',
      severity: maxSeverity,
      details
    };
  }

  /**
   * Generate migration warnings using injected provider
   */
  static generateMigrationWarnings(
    universalType: PrimitiveType | CommonPattern,
    targetProvider: any
  ): string[] {
    const warnings: string[] = [];
    const score = this.calculateScore(universalType, targetProvider?.getPlatformId?.(), targetProvider);
    
    warnings.push(...score.warnings);
    
    if (score.confidence === 'low') {
      warnings.push('Low confidence in type compatibility - manual review recommended');
    }
    
    if (score.score < 70) {
      warnings.push('Poor compatibility score - consider alternative type or custom handling');
    }
    
    return warnings;
  }
}