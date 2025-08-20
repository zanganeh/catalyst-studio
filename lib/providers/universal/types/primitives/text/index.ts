/**
 * Text Primitive Type - Short text strings (max 255 characters by default)
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * Text primitive configuration
 */
export interface TextConfig extends PrimitiveConfig {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  placeholder?: string;
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
}

/**
 * Text primitive implementation
 */
export class TextPrimitive extends PrimitiveType<string, TextConfig> {
  private patternRegex?: RegExp;

  constructor(config?: TextConfig) {
    super(config);
    
    // Compile pattern if provided
    if (this.config.pattern) {
      try {
        this.patternRegex = new RegExp(this.config.pattern);
      } catch (e) {
        throw new Error(`Invalid regex pattern: ${this.config.pattern}`);
      }
    }
  }

  get typeId(): string {
    return 'text';
  }

  get typeName(): string {
    return 'Text';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type check
    if (typeof value !== 'string') {
      return {
        valid: false,
        errors: ['Value must be a string']
      };
    }

    const length = value.length;
    const minLength = this.config.minLength ?? 0;
    const maxLength = this.config.maxLength ?? 255;

    // Length validation
    if (length < minLength) {
      errors.push(`Text must be at least ${minLength} characters`);
    }

    if (length > maxLength) {
      errors.push(`Text cannot exceed ${maxLength} characters`);
    }

    // Pattern validation
    if (this.patternRegex && !this.patternRegex.test(value)) {
      errors.push(`Text does not match required pattern: ${this.config.pattern}`);
    }

    // Warnings for edge cases
    if (length > 200 && maxLength === 255) {
      warnings.push('Consider using LongText for content over 200 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: string;

    // Convert to string
    if (typeof value === 'string') {
      transformed = value;
    } else if (value === null || value === undefined) {
      transformed = '';
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      transformed = String(value);
      warnings.push(`Converted ${typeof value} to string`);
    } else if (typeof value === 'object') {
      transformed = JSON.stringify(value);
      warnings.push('Converted object to JSON string');
    } else {
      return {
        success: false,
        value: '',
        warnings: ['Cannot convert value to string']
      };
    }

    // Apply transformations
    if (this.config.trim) {
      transformed = transformed.trim();
    }

    if (this.config.lowercase) {
      transformed = transformed.toLowerCase();
    } else if (this.config.uppercase) {
      transformed = transformed.toUpperCase();
    }

    // Truncate if too long
    const maxLength = this.config.maxLength ?? 255;
    if (transformed.length > maxLength) {
      transformed = transformed.substring(0, maxLength);
      warnings.push(`Truncated to ${maxLength} characters`);
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): string {
    if (this.config.defaultValue !== undefined) {
      return this.config.defaultValue;
    }
    return '';
  }

  serialize(): object {
    return {
      ...this.config,
      pattern: this.config.pattern // Store as string, not RegExp
    };
  }

  clone(config?: Partial<TextConfig>): TextPrimitive {
    return new TextPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<TextConfig> {
    return {
      maxLength: 255,
      minLength: 0,
      trim: true,
      lowercase: false,
      uppercase: false
    };
  }

  protected validateConfig(): void {
    if (this.config.minLength !== undefined && this.config.minLength < 0) {
      throw new Error('minLength cannot be negative');
    }

    if (this.config.maxLength !== undefined && this.config.maxLength < 1) {
      throw new Error('maxLength must be at least 1');
    }

    if (this.config.minLength !== undefined && 
        this.config.maxLength !== undefined && 
        this.config.minLength > this.config.maxLength) {
      throw new Error('minLength cannot be greater than maxLength');
    }

    if (this.config.lowercase && this.config.uppercase) {
      throw new Error('Cannot set both lowercase and uppercase');
    }
  }

  /**
   * Check if value matches pattern
   */
  matchesPattern(value: string): boolean {
    if (!this.patternRegex) return true;
    return this.patternRegex.test(value);
  }

  /**
   * Get the maximum length
   */
  getMaxLength(): number {
    return this.config.maxLength ?? 255;
  }

  /**
   * Get the minimum length
   */
  getMinLength(): number {
    return this.config.minLength ?? 0;
  }
}

/**
 * Factory function for creating text primitives
 */
export function createTextPrimitive(config?: TextConfig): TextPrimitive {
  return new TextPrimitive(config);
}