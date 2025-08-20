/**
 * Confidence Scorer - Calculate transformation confidence
 * Scores based on data loss potential and platform capabilities
 */

import { Primitive, PrimitiveType } from '../types/primitives';
import { CommonPatternType, CommonPattern } from '../types/common-patterns';
import { PLATFORM_CAPABILITIES } from '../types/extensions';
import { ITypeProvider } from '../interfaces/type-provider';

/**
 * Confidence score result
 */
export interface ConfidenceScore {
  score: number; // 0-100
  level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  factors: ScoreFactor[];
  breakdown: ScoreBreakdown;
  recommendations: string[];
}

/**
 * Score factor
 */
export interface ScoreFactor {
  name: string;
  impact: number; // Positive or negative impact on score
  reason: string;
}

/**
 * Score breakdown
 */
export interface ScoreBreakdown {
  baseScore: number;
  dataLossPenalty: number;
  complexityPenalty: number;
  platformBonus: number;
  finalScore: number;
}

/**
 * Confidence scorer class
 */
export class ConfidenceScorer {
  /**
   * Calculate transformation confidence
   */
  static calculateConfidence(
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType,
    sourcePlatform?: string,
    targetPlatform?: string
  ): ConfidenceScore {
    const factors: ScoreFactor[] = [];
    
    // Calculate base score
    const baseScore = this.calculateBaseScore(sourceType, targetType, factors);
    
    // Calculate penalties
    const dataLossPenalty = this.calculateDataLossPenalty(sourceType, targetType, factors);
    const complexityPenalty = this.calculateComplexityPenalty(sourceType, targetType, factors);
    
    // Calculate bonuses
    const platformBonus = this.calculatePlatformBonus(
      sourceType, 
      targetType, 
      sourcePlatform, 
      targetPlatform, 
      factors
    );
    
    // Calculate final score
    const finalScore = Math.max(0, Math.min(100, 
      baseScore - dataLossPenalty - complexityPenalty + platformBonus
    ));
    
    // Determine level
    const level = this.scoreToLevel(finalScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      finalScore, 
      factors, 
      sourceType, 
      targetType
    );
    
    return {
      score: finalScore,
      level,
      factors,
      breakdown: {
        baseScore,
        dataLossPenalty,
        complexityPenalty,
        platformBonus,
        finalScore
      },
      recommendations
    };
  }

  /**
   * Score based on data loss potential
   */
  static scoreDataLoss(
    sourceData: any,
    transformedData: any,
    sourceType: Primitive | CommonPatternType
  ): number {
    // Calculate how much data is preserved
    const sourceComplexity = this.calculateDataComplexity(sourceData);
    const transformedComplexity = this.calculateDataComplexity(transformedData);
    
    if (sourceComplexity === 0) return 100;
    
    const preservationRatio = transformedComplexity / sourceComplexity;
    const score = Math.round(preservationRatio * 100);
    
    // Apply type-specific adjustments
    if ('pattern' in sourceType) {
      switch (sourceType.pattern) {
        case CommonPattern.RICH_TEXT:
          // Rich text transformations typically lose some formatting
          return Math.min(score, 85);
        case CommonPattern.MEDIA:
          // Media transformations may lose metadata
          return Math.min(score, 90);
        case CommonPattern.COMPONENT:
          // Component transformations can lose structure
          return Math.min(score, 80);
      }
    }
    
    return score;
  }

  /**
   * Consider platform capabilities
   */
  static scorePlatformCapabilities(
    type: Primitive | CommonPatternType,
    platform: string,
    provider?: ITypeProvider
  ): number {
    const capabilities = PLATFORM_CAPABILITIES[platform];
    if (!capabilities) return 50; // Unknown platform
    
    let score = 100;
    const typeKey = this.getTypeKey(type);
    
    // Get mapping from provider if available
    if (provider) {
      const mapping = provider.getCompatibilityMapping(typeKey);
      if (mapping) {
        return mapping.confidence;
      }
    }
    
    // Check specific capabilities
    if ('pattern' in type) {
      switch (type.pattern) {
        case CommonPattern.COMPONENT:
          if (!capabilities.supportsComponents) score -= 30;
          break;
        case CommonPattern.REPEATER:
          if (!capabilities.supportsDynamicZones) score -= 20;
          break;
        case CommonPattern.RICH_TEXT:
          // Most platforms support some form of rich text
          score = Math.max(score - 10, 70);
          break;
      }
    }
    
    // Check limitations
    if (capabilities.limitations.length > 0) {
      score -= capabilities.limitations.length * 5;
    }
    
    return Math.max(0, score);
  }

  /**
   * Private scoring methods
   */

  private static calculateBaseScore(
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType,
    factors: ScoreFactor[]
  ): number {
    // Same type = perfect score
    if (JSON.stringify(sourceType) === JSON.stringify(targetType)) {
      factors.push({
        name: 'Identical Types',
        impact: 100,
        reason: 'Source and target types are identical'
      });
      return 100;
    }
    
    // Both primitives
    if ('type' in sourceType && 'type' in targetType) {
      return this.scorePrimitiveToPrimitive(sourceType, targetType, factors);
    }
    
    // Both patterns
    if ('pattern' in sourceType && 'pattern' in targetType) {
      return this.scorePatternToPattern(sourceType, targetType, factors);
    }
    
    // Mixed (primitive <-> pattern)
    if ('type' in sourceType && 'pattern' in targetType) {
      return this.scorePrimitiveToPattern(sourceType, targetType, factors);
    }
    
    if ('pattern' in sourceType && 'type' in targetType) {
      return this.scorePatternToPrimitive(sourceType, targetType, factors);
    }
    
    return 50; // Default uncertain score
  }

  private static scorePrimitiveToPrimitive(
    source: Primitive,
    target: Primitive,
    factors: ScoreFactor[]
  ): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      [PrimitiveType.TEXT]: {
        [PrimitiveType.LONG_TEXT]: 95,
        [PrimitiveType.JSON]: 70
      },
      [PrimitiveType.LONG_TEXT]: {
        [PrimitiveType.TEXT]: 80,
        [PrimitiveType.JSON]: 75
      },
      [PrimitiveType.NUMBER]: {
        [PrimitiveType.DECIMAL]: 95,
        [PrimitiveType.TEXT]: 85
      },
      [PrimitiveType.BOOLEAN]: {
        [PrimitiveType.NUMBER]: 90,
        [PrimitiveType.TEXT]: 85
      },
      [PrimitiveType.DATE]: {
        [PrimitiveType.TEXT]: 90,
        [PrimitiveType.NUMBER]: 80
      },
      [PrimitiveType.JSON]: {
        [PrimitiveType.LONG_TEXT]: 85
      },
      [PrimitiveType.DECIMAL]: {
        [PrimitiveType.NUMBER]: 85,
        [PrimitiveType.TEXT]: 80
      }
    };
    
    const score = compatibilityMap[source.type]?.[target.type] || 60;
    
    factors.push({
      name: 'Primitive Compatibility',
      impact: score - 50,
      reason: `${source.type} to ${target.type} conversion`
    });
    
    return score;
  }

  private static scorePatternToPattern(
    source: CommonPatternType,
    target: CommonPatternType,
    factors: ScoreFactor[]
  ): number {
    if (source.pattern === target.pattern) {
      factors.push({
        name: 'Same Pattern Type',
        impact: 45,
        reason: 'Patterns are of the same type'
      });
      return 95;
    }
    
    const compatibilityMap: Record<string, Record<string, number>> = {
      [CommonPattern.RICH_TEXT]: {
        [CommonPattern.LONG_TEXT]: 75,
        [CommonPattern.COMPONENT]: 60
      },
      [CommonPattern.MEDIA]: {
        [CommonPattern.COMPONENT]: 70
      },
      [CommonPattern.COLLECTION]: {
        [CommonPattern.REPEATER]: 80
      },
      [CommonPattern.COMPONENT]: {
        [CommonPattern.COLLECTION]: 75
      },
      [CommonPattern.SELECT]: {
        [CommonPattern.TAGS]: 70
      },
      [CommonPattern.REPEATER]: {
        [CommonPattern.COLLECTION]: 85
      },
      [CommonPattern.SLUG]: {
        [CommonPattern.TEXT]: 90
      },
      [CommonPattern.TAGS]: {
        [CommonPattern.SELECT]: 75,
        [CommonPattern.COLLECTION]: 80
      }
    };
    
    const score = compatibilityMap[source.pattern]?.[target.pattern] || 50;
    
    factors.push({
      name: 'Pattern Compatibility',
      impact: score - 50,
      reason: `${source.pattern} to ${target.pattern} conversion`
    });
    
    return score;
  }

  private static scorePrimitiveToPattern(
    source: Primitive,
    target: CommonPatternType,
    factors: ScoreFactor[]
  ): number {
    // Upgrading primitive to pattern usually works well
    const upgradeMap: Record<string, Record<string, number>> = {
      [PrimitiveType.TEXT]: {
        [CommonPattern.SLUG]: 95,
        [CommonPattern.SELECT]: 85
      },
      [PrimitiveType.LONG_TEXT]: {
        [CommonPattern.RICH_TEXT]: 90
      },
      [PrimitiveType.JSON]: {
        [CommonPattern.COLLECTION]: 85,
        [CommonPattern.COMPONENT]: 80,
        [CommonPattern.TAGS]: 85,
        [CommonPattern.MEDIA]: 75
      }
    };
    
    const score = upgradeMap[source.type]?.[target.pattern] || 60;
    
    factors.push({
      name: 'Primitive to Pattern Upgrade',
      impact: score - 50,
      reason: `Upgrading ${source.type} to ${target.pattern}`
    });
    
    return score;
  }

  private static scorePatternToPrimitive(
    source: CommonPatternType,
    target: Primitive,
    factors: ScoreFactor[]
  ): number {
    // Downgrading pattern to primitive loses features
    let score = 70;
    
    if (source.fallbackPrimitive === target.type) {
      score = 85;
      factors.push({
        name: 'Fallback Match',
        impact: 15,
        reason: 'Target matches pattern fallback primitive'
      });
    } else {
      factors.push({
        name: 'Pattern Downgrade',
        impact: -20,
        reason: 'Pattern features will be lost'
      });
      score = 50;
    }
    
    return score;
  }

  private static calculateDataLossPenalty(
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType,
    factors: ScoreFactor[]
  ): number {
    let penalty = 0;
    
    // Pattern to primitive always loses data
    if ('pattern' in sourceType && 'type' in targetType) {
      penalty += 15;
      factors.push({
        name: 'Pattern Features Lost',
        impact: -15,
        reason: 'Complex pattern reduced to primitive'
      });
    }
    
    // Specific pattern losses
    if ('pattern' in sourceType) {
      switch (sourceType.pattern) {
        case CommonPattern.RICH_TEXT:
          if (!('pattern' in targetType) || targetType.pattern !== CommonPattern.RICH_TEXT) {
            penalty += 10;
            factors.push({
              name: 'Formatting Loss',
              impact: -10,
              reason: 'Rich text formatting will be lost'
            });
          }
          break;
        case CommonPattern.MEDIA:
          if (!('pattern' in targetType) || targetType.pattern !== CommonPattern.MEDIA) {
            penalty += 5;
            factors.push({
              name: 'Metadata Loss',
              impact: -5,
              reason: 'Media metadata may be lost'
            });
          }
          break;
      }
    }
    
    return penalty;
  }

  private static calculateComplexityPenalty(
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType,
    factors: ScoreFactor[]
  ): number {
    let penalty = 0;
    
    // Complex transformations are less reliable
    const sourceComplexity = this.getTypeComplexity(sourceType);
    const targetComplexity = this.getTypeComplexity(targetType);
    const complexityDiff = Math.abs(sourceComplexity - targetComplexity);
    
    if (complexityDiff > 2) {
      penalty = complexityDiff * 5;
      factors.push({
        name: 'Complexity Mismatch',
        impact: -penalty,
        reason: 'Large complexity difference between types'
      });
    }
    
    return penalty;
  }

  private static calculatePlatformBonus(
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType,
    sourcePlatform?: string,
    targetPlatform?: string,
    factors: ScoreFactor[]
  ): number {
    let bonus = 0;
    
    if (sourcePlatform && targetPlatform) {
      // Same platform = bonus
      if (sourcePlatform === targetPlatform) {
        bonus += 10;
        factors.push({
          name: 'Same Platform',
          impact: 10,
          reason: 'No cross-platform transformation needed'
        });
      } else {
        // Check platform compatibility
        const sourceCapabilities = PLATFORM_CAPABILITIES[sourcePlatform];
        const targetCapabilities = PLATFORM_CAPABILITIES[targetPlatform];
        
        if (sourceCapabilities && targetCapabilities) {
          // Both platforms well-supported
          const commonCapabilities = sourceCapabilities.capabilities.filter(
            cap => targetCapabilities.capabilities.includes(cap)
          );
          
          if (commonCapabilities.length > 5) {
            bonus += 5;
            factors.push({
              name: 'Good Platform Compatibility',
              impact: 5,
              reason: 'Platforms share many capabilities'
            });
          }
        }
      }
    }
    
    return bonus;
  }

  private static calculateDataComplexity(data: any): number {
    if (data === null || data === undefined) return 0;
    if (typeof data === 'string') return 1 + data.length / 1000;
    if (typeof data === 'number') return 1;
    if (typeof data === 'boolean') return 0.5;
    
    if (Array.isArray(data)) {
      return 1 + data.reduce((sum, item) => sum + this.calculateDataComplexity(item), 0);
    }
    
    if (typeof data === 'object') {
      return 1 + Object.values(data).reduce(
        (sum, value) => sum + this.calculateDataComplexity(value), 0
      );
    }
    
    return 1;
  }

  private static getTypeComplexity(type: Primitive | CommonPatternType): number {
    if ('type' in type) {
      // Primitive complexity
      const complexityMap: Record<PrimitiveType, number> = {
        [PrimitiveType.BOOLEAN]: 1,
        [PrimitiveType.NUMBER]: 2,
        [PrimitiveType.TEXT]: 2,
        [PrimitiveType.DATE]: 3,
        [PrimitiveType.LONG_TEXT]: 3,
        [PrimitiveType.DECIMAL]: 3,
        [PrimitiveType.JSON]: 5
      };
      return complexityMap[type.type] || 3;
    }
    
    if ('pattern' in type) {
      // Pattern complexity
      const complexityMap: Record<CommonPattern, number> = {
        [CommonPattern.SLUG]: 2,
        [CommonPattern.SELECT]: 3,
        [CommonPattern.TAGS]: 3,
        [CommonPattern.MEDIA]: 4,
        [CommonPattern.RICH_TEXT]: 5,
        [CommonPattern.COLLECTION]: 5,
        [CommonPattern.REPEATER]: 6,
        [CommonPattern.COMPONENT]: 7
      };
      return complexityMap[type.pattern] || 5;
    }
    
    return 3;
  }

  private static getTypeKey(type: Primitive | CommonPatternType): PrimitiveType | CommonPattern {
    if ('type' in type) {
      return type.type;
    } else if ('pattern' in type) {
      return type.pattern;
    }
    throw new Error('Unknown type structure');
  }

  private static scoreToLevel(score: number): ConfidenceScore['level'] {
    if (score >= 90) return 'very-high';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very-low';
  }

  private static generateRecommendations(
    score: number,
    factors: ScoreFactor[],
    sourceType: Primitive | CommonPatternType,
    targetType: Primitive | CommonPatternType
  ): string[] {
    const recommendations: string[] = [];
    
    if (score < 50) {
      recommendations.push('Consider using a different target type');
      recommendations.push('Manual review of transformed data recommended');
    } else if (score < 70) {
      recommendations.push('Test transformation with sample data');
      recommendations.push('Implement validation for transformed data');
    }
    
    // Factor-based recommendations
    const negativeFactors = factors.filter(f => f.impact < 0);
    negativeFactors.forEach(factor => {
      if (factor.name === 'Pattern Features Lost') {
        recommendations.push('Consider preserving pattern as JSON with metadata');
      } else if (factor.name === 'Formatting Loss') {
        recommendations.push('Export rich text as markdown for better preservation');
      } else if (factor.name === 'Complexity Mismatch') {
        recommendations.push('Use intermediate transformation steps');
      }
    });
    
    return recommendations;
  }
}