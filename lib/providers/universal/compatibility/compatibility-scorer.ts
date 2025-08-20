/**
 * Compatibility Scorer - Calculate type compatibility using injected providers
 * No hardcoded platform knowledge - all platform info comes from providers
 */

import { PrimitiveType } from '../types/primitives';
import { CommonPattern } from '../types/common-patterns';
import { ITypeProvider } from '../interfaces/type-provider';
import { getTypeRegistry } from '../registry/type-system-registry';

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
 * Compatibility scorer using dependency injection
 */
export class CompatibilityScorer {
  private provider: ITypeProvider | undefined;

  constructor(provider?: ITypeProvider) {
    this.provider = provider;
  }

  /**
   * Calculate compatibility score for a type on a platform
   */
  calculateScore(
    universalType: PrimitiveType | CommonPattern,
    platformId?: string
  ): CompatibilityScore {
    // If platform specified, use that provider
    if (platformId) {
      const provider = this.provider || getTypeRegistry().getProvider(platformId);
      if (!provider) {
        return {
          score: 0,
          confidence: 'low',
          warnings: [`No provider registered for platform: ${platformId}`],
          recommendations: ['Register provider or use fallback strategy']
        };
      }
      return this.scoreWithProvider(universalType, provider);
    }

    // If no platform specified, calculate average across all providers
    const registry = getTypeRegistry();
    const providers = registry.getAllProviders();
    
    if (providers.length === 0) {
      return {
        score: 0,
        confidence: 'low',
        warnings: ['No providers registered'],
        recommendations: ['Register at least one provider']
      };
    }

    const scores = providers.map(p => this.scoreWithProvider(universalType, p));
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    
    return {
      score: avgScore,
      confidence: avgScore >= 80 ? 'high' : avgScore >= 50 ? 'medium' : 'low',
      warnings: scores.flatMap(s => s.warnings),
      recommendations: scores.flatMap(s => s.recommendations)
    };
  }

  /**
   * Score with a specific provider
   */
  private scoreWithProvider(
    universalType: PrimitiveType | CommonPattern,
    provider: ITypeProvider
  ): CompatibilityScore {
    const mapping = provider.getCompatibilityMapping(universalType);
    
    if (!mapping) {
      return {
        score: 0,
        confidence: 'low',
        warnings: [`Type not supported by ${provider.getPlatformName()}`],
        recommendations: ['Use fallback strategy', 'Consider JSON primitive']
      };
    }

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Add warnings based on data loss risk
    switch (mapping.dataLossRisk) {
      case 'high':
        warnings.push('High risk of data loss during migration');
        recommendations.push('Review data carefully', 'Create backup before migration');
        break;
      case 'medium':
        warnings.push('Moderate risk of data loss');
        recommendations.push('Test migration thoroughly');
        break;
      case 'low':
        warnings.push('Minor data loss possible');
        break;
    }

    // Add transformation warnings
    if (mapping.transformationRequired) {
      warnings.push('Transformation required');
      recommendations.push('Validate transformed data');
    }

    // Add notes as recommendations
    if (mapping.notes) {
      recommendations.push(mapping.notes);
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
   * Compare compatibility between two platforms
   */
  compareCompatibility(
    universalType: PrimitiveType | CommonPattern,
    sourcePlatformId: string,
    targetPlatformId: string
  ): {
    compatible: boolean;
    transformations: string[];
    dataLoss: {
      hasDataLoss: boolean;
      severity: 'none' | 'low' | 'medium' | 'high';
      details: string[];
    };
  } {
    const registry = getTypeRegistry();
    const sourceProvider = registry.getProvider(sourcePlatformId);
    const targetProvider = registry.getProvider(targetPlatformId);

    if (!sourceProvider || !targetProvider) {
      return {
        compatible: false,
        transformations: ['Provider not found'],
        dataLoss: {
          hasDataLoss: true,
          severity: 'high',
          details: ['Cannot determine compatibility without providers']
        }
      };
    }

    const sourceMapping = sourceProvider.getCompatibilityMapping(universalType);
    const targetMapping = targetProvider.getCompatibilityMapping(universalType);

    if (!sourceMapping || !targetMapping) {
      return {
        compatible: false,
        transformations: ['Type not supported by one or both platforms'],
        dataLoss: {
          hasDataLoss: true,
          severity: 'high',
          details: ['Type mapping not found']
        }
      };
    }

    const transformations: string[] = [];
    const dataLossDetails: string[] = [];

    // Check if transformation needed
    if (sourceMapping.nativeType !== targetMapping.nativeType) {
      transformations.push(`Convert ${sourceMapping.nativeType} to ${targetMapping.nativeType}`);
    }

    if (sourceMapping.transformationRequired || targetMapping.transformationRequired) {
      transformations.push('Format transformation required');
    }

    // Determine data loss severity
    const severityLevels = ['none', 'low', 'medium', 'high'] as const;
    const sourceSeverityIndex = severityLevels.indexOf(sourceMapping.dataLossRisk);
    const targetSeverityIndex = severityLevels.indexOf(targetMapping.dataLossRisk);
    const maxSeverityIndex = Math.max(sourceSeverityIndex, targetSeverityIndex);
    const maxSeverity = severityLevels[maxSeverityIndex];

    if (sourceMapping.dataLossRisk !== 'none') {
      dataLossDetails.push(`Source platform: ${sourceMapping.dataLossRisk} risk`);
    }
    if (targetMapping.dataLossRisk !== 'none') {
      dataLossDetails.push(`Target platform: ${targetMapping.dataLossRisk} risk`);
    }

    // Check confidence levels
    const minConfidence = Math.min(sourceMapping.confidence, targetMapping.confidence);
    const compatible = minConfidence >= 50;

    if (!compatible) {
      dataLossDetails.push('Low confidence in type compatibility');
    }

    return {
      compatible,
      transformations,
      dataLoss: {
        hasDataLoss: maxSeverity !== 'none',
        severity: maxSeverity,
        details: dataLossDetails
      }
    };
  }

  /**
   * Get recommended fallback type
   */
  getRecommendedFallback(
    universalType: PrimitiveType | CommonPattern,
    platformId: string
  ): PrimitiveType {
    const provider = this.provider || getTypeRegistry().getProvider(platformId);
    
    if (!provider) {
      return PrimitiveType.JSON;
    }

    const mapping = provider.getCompatibilityMapping(universalType);
    
    if (!mapping || mapping.confidence < 50) {
      // Low compatibility - recommend JSON as universal fallback
      return PrimitiveType.JSON;
    }

    // Return the original type if compatibility is good
    if ('type' in { type: universalType } && Object.values(PrimitiveType).includes(universalType as PrimitiveType)) {
      return universalType as PrimitiveType;
    }

    // For patterns, return their fallback primitive
    return PrimitiveType.JSON;
  }
}

/**
 * Factory function for creating scorer with provider
 */
export function createCompatibilityScorer(provider?: ITypeProvider): CompatibilityScorer {
  return new CompatibilityScorer(provider);
}