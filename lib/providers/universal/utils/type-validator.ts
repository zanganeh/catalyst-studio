/**
 * Type Validator - Validate universal type definitions
 * Ensures type consistency and platform compatibility
 */

import { Primitive, PrimitiveType, PrimitiveValidator } from '../types/primitives';
import { CommonPatternType, CommonPattern, PatternValidator } from '../types/common-patterns';
import { PlatformExtension, ExtensionValidator } from '../types/extensions';
import { CompatibilityScorer } from '../compatibility/compatibility-scorer';
import { getTypeRegistry } from '../registry/type-system-registry';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'info';
}

/**
 * Type validator class
 */
export class TypeValidator {
  /**
   * Validate universal type definition
   */
  static validateType(
    type: Primitive | CommonPatternType | PlatformExtension,
    options?: ValidationOptions
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Determine type category and validate
    if (this.isPrimitive(type)) {
      this.validatePrimitive(type as Primitive, errors, warnings, suggestions);
    } else if (this.isPattern(type)) {
      this.validatePattern(type as CommonPatternType, errors, warnings, suggestions);
    } else if (this.isExtension(type)) {
      this.validateExtension(type as PlatformExtension, errors, warnings, suggestions);
    } else {
      errors.push({
        field: 'type',
        message: 'Unknown type structure',
        severity: 'critical'
      });
    }

    // Platform compatibility check if specified
    if (options?.platform) {
      this.checkPlatformCompatibility(type, options.platform, warnings, suggestions);
    }

    // Check consistency if strict mode
    if (options?.strictMode) {
      this.checkConsistency(type, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Check type consistency
   */
  static checkConsistency(
    type: Primitive | CommonPatternType | PlatformExtension,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for conflicting properties
    if ('required' in type && 'defaultValue' in type) {
      if (type.required && type.defaultValue === null) {
        warnings.push({
          field: 'defaultValue',
          message: 'Required field has null default value',
          severity: 'warning'
        });
      }
    }

    // Check pattern consistency
    if ('pattern' in type && 'fallbackPrimitive' in type) {
      const pattern = type as CommonPatternType;
      if (!pattern.fallbackPrimitive) {
        errors.push({
          field: 'fallbackPrimitive',
          message: 'Pattern must define fallback primitive',
          severity: 'error'
        });
      }
    }

    // Check extension consistency
    if ('extendsType' in type) {
      const extension = type as PlatformExtension;
      if (!extension.extendsType) {
        errors.push({
          field: 'extendsType',
          message: 'Extension must extend a base type',
          severity: 'critical'
        });
      }
    }
  }

  /**
   * Ensure platform compatibility
   */
  static ensureCompatibility(
    type: Primitive | CommonPatternType,
    targetPlatform: string
  ): {
    compatible: boolean;
    adjustments: TypeAdjustment[];
    alternativeType?: Primitive | CommonPatternType;
  } {
    const typeKey = this.getTypeKey(type);
    const scorer = new CompatibilityScorer();
    const compatibility = scorer.calculateScore(typeKey, targetPlatform);
    
    const adjustments: TypeAdjustment[] = [];
    let alternativeType: Primitive | CommonPatternType | undefined;

    if (compatibility.confidence === 'low') {
      // Suggest alternative type
      alternativeType = this.suggestAlternative(type, targetPlatform);
      
      if (!alternativeType) {
        adjustments.push({
          field: 'type',
          action: 'fallback',
          reason: 'Low platform compatibility',
          suggestion: 'Use JSON primitive as fallback'
        });
      }
    } else if (compatibility.confidence === 'medium') {
      // Suggest adjustments
      compatibility.recommendations.forEach(rec => {
        adjustments.push({
          field: 'configuration',
          action: 'adjust',
          reason: rec,
          suggestion: 'Review and adjust configuration'
        });
      });
    }

    return {
      compatible: compatibility.confidence !== 'low',
      adjustments,
      alternativeType
    };
  }

  /**
   * Private validation methods
   */

  private static validatePrimitive(
    primitive: Primitive,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Check required fields
    if (!primitive.type) {
      errors.push({
        field: 'type',
        message: 'Primitive type is required',
        severity: 'critical'
      });
      return;
    }

    // Validate type-specific constraints
    switch (primitive.type) {
      case PrimitiveType.TEXT:
        if ('maxLength' in primitive && primitive.maxLength) {
          if (primitive.maxLength > 255) {
            warnings.push({
              field: 'maxLength',
              message: 'Text primitive typically limited to 255 characters',
              severity: 'warning'
            });
            suggestions.push('Consider using LONG_TEXT for longer content');
          }
        }
        break;

      case PrimitiveType.NUMBER:
        if ('min' in primitive && 'max' in primitive) {
          if (primitive.min !== undefined && primitive.max !== undefined && primitive.min > primitive.max) {
            errors.push({
              field: 'min/max',
              message: 'Minimum value cannot be greater than maximum',
              severity: 'error'
            });
          }
        }
        break;

      case PrimitiveType.DECIMAL:
        if ('precision' in primitive && 'scale' in primitive) {
          if (primitive.scale !== undefined && primitive.precision !== undefined) {
            if (primitive.scale > primitive.precision) {
              errors.push({
                field: 'scale',
                message: 'Scale cannot exceed precision',
                severity: 'error'
              });
            }
          }
        }
        break;

      case PrimitiveType.DATE:
        if ('minDate' in primitive && 'maxDate' in primitive) {
          if (primitive.minDate && primitive.maxDate) {
            const min = new Date(primitive.minDate);
            const max = new Date(primitive.maxDate);
            if (min > max) {
              errors.push({
                field: 'minDate/maxDate',
                message: 'Minimum date cannot be after maximum date',
                severity: 'error'
              });
            }
          }
        }
        break;
    }

    // Validate default value if provided
    if ('defaultValue' in primitive && primitive.defaultValue !== undefined) {
      if (!PrimitiveValidator.validate(primitive.defaultValue, primitive)) {
        warnings.push({
          field: 'defaultValue',
          message: 'Default value does not match type constraints',
          severity: 'warning'
        });
      }
    }
  }

  private static validatePattern(
    pattern: CommonPatternType,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Check required fields
    if (!pattern.pattern) {
      errors.push({
        field: 'pattern',
        message: 'Pattern type is required',
        severity: 'critical'
      });
      return;
    }

    // Validate pattern-specific constraints
    switch (pattern.pattern) {
      case CommonPattern.COLLECTION:
        if ('minItems' in pattern && 'maxItems' in pattern) {
          if (pattern.minItems !== undefined && pattern.maxItems !== undefined) {
            if (pattern.minItems > pattern.maxItems) {
              errors.push({
                field: 'minItems/maxItems',
                message: 'Minimum items cannot be greater than maximum',
                severity: 'error'
              });
            }
          }
        }
        if (!pattern.itemType) {
          errors.push({
            field: 'itemType',
            message: 'Collection must specify item type',
            severity: 'error'
          });
        }
        break;

      case CommonPattern.SELECT:
        if (!pattern.options || pattern.options.length === 0) {
          warnings.push({
            field: 'options',
            message: 'Select pattern has no options defined',
            severity: 'warning'
          });
          suggestions.push('Add options or use text primitive instead');
        }
        break;

      case CommonPattern.REPEATER:
        if (!pattern.fields || pattern.fields.length === 0) {
          errors.push({
            field: 'fields',
            message: 'Repeater must define fields',
            severity: 'error'
          });
        }
        break;

      case CommonPattern.TAGS:
        if (pattern.minTags !== undefined && pattern.maxTags !== undefined) {
          if (pattern.minTags > pattern.maxTags) {
            errors.push({
              field: 'minTags/maxTags',
              message: 'Minimum tags cannot be greater than maximum',
              severity: 'error'
            });
          }
        }
        break;
    }

    // Check fallback primitive
    if (!pattern.fallbackPrimitive) {
      warnings.push({
        field: 'fallbackPrimitive',
        message: 'No fallback primitive defined',
        severity: 'warning'
      });
      suggestions.push('Define fallback primitive for compatibility');
    }
  }

  private static validateExtension(
    extension: PlatformExtension,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    // Use extension validator
    if (!ExtensionValidator.validate(extension)) {
      errors.push({
        field: 'extension',
        message: 'Invalid extension structure',
        severity: 'critical'
      });
      return;
    }

    // Check transformation confidence
    if (extension.transformationConfidence < 50) {
      warnings.push({
        field: 'transformationConfidence',
        message: 'Low transformation confidence',
        severity: 'warning'
      });
      suggestions.push('Consider using a different base type');
    }

    // Check features
    if (extension.features.length === 0) {
      warnings.push({
        field: 'features',
        message: 'Extension defines no features',
        severity: 'info'
      });
    }

    // Check migration strategy
    if (extension.migrationStrategy) {
      if (extension.migrationStrategy.dataLossWarnings.length > 0) {
        warnings.push({
          field: 'migrationStrategy',
          message: `Migration may cause data loss: ${extension.migrationStrategy.dataLossWarnings.join(', ')}`,
          severity: 'warning'
        });
      }
    }
  }

  private static checkPlatformCompatibility(
    type: Primitive | CommonPatternType | PlatformExtension,
    platform: string,
    warnings: ValidationWarning[],
    suggestions: string[]
  ): void {
    if ('id' in type && 'platform' in type) {
      // Extension - check if platform matches
      if (type.platform !== platform) {
        warnings.push({
          field: 'platform',
          message: `Extension is for ${type.platform}, not ${platform}`,
          severity: 'warning'
        });
      }
      return;
    }

    const typeKey = this.getTypeKey(type as Primitive | CommonPatternType);
    const scorer = new CompatibilityScorer();
    const compatibility = scorer.calculateScore(typeKey, platform);
    
    if (compatibility.confidence === 'low') {
      warnings.push({
        field: 'compatibility',
        message: `Low compatibility with ${platform}`,
        severity: 'warning'
      });
      suggestions.push(...compatibility.recommendations);
    }
    
    compatibility.warnings.forEach(warning => {
      warnings.push({
        field: 'compatibility',
        message: warning,
        severity: 'info'
      });
    });
  }

  /**
   * Helper methods
   */

  private static isPrimitive(type: any): boolean {
    return type && typeof type === 'object' && 'type' in type && 
      Object.values(PrimitiveType).includes(type.type);
  }

  private static isPattern(type: any): boolean {
    return type && typeof type === 'object' && 'pattern' in type && 
      Object.values(CommonPattern).includes(type.pattern);
  }

  private static isExtension(type: any): boolean {
    return type && typeof type === 'object' && 'id' in type && 
      'platform' in type && 'extendsType' in type;
  }

  private static getTypeKey(type: Primitive | CommonPatternType): PrimitiveType | CommonPattern {
    if ('type' in type) {
      return type.type;
    } else if ('pattern' in type) {
      return type.pattern;
    }
    throw new Error('Unknown type structure');
  }

  private static suggestAlternative(
    type: Primitive | CommonPatternType,
    platform: string
  ): Primitive | CommonPatternType | undefined {
    // Suggest simpler alternatives
    if ('pattern' in type) {
      switch (type.pattern) {
        case CommonPattern.RICH_TEXT:
          return { type: PrimitiveType.LONG_TEXT };
        case CommonPattern.MEDIA:
          return { type: PrimitiveType.JSON };
        case CommonPattern.COMPONENT:
          return { type: PrimitiveType.JSON };
        case CommonPattern.COLLECTION:
          return { type: PrimitiveType.JSON };
        default:
          return { type: PrimitiveType.JSON };
      }
    }
    
    return undefined;
  }
}

/**
 * Validation options
 */
export interface ValidationOptions {
  platform?: string;
  strictMode?: boolean;
  checkDefaults?: boolean;
  checkConstraints?: boolean;
}

/**
 * Type adjustment
 */
export interface TypeAdjustment {
  field: string;
  action: 'adjust' | 'remove' | 'fallback';
  reason: string;
  suggestion: string;
}