/**
 * Decimal Primitive Type - High-precision decimal numbers
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * Decimal primitive configuration
 */
export interface DecimalConfig extends PrimitiveConfig {
  precision?: number; // Total number of digits
  scale?: number; // Number of decimal places
  min?: string;
  max?: string;
}

/**
 * Decimal primitive implementation
 */
export class DecimalPrimitive extends PrimitiveType<string, DecimalConfig> {
  private decimalRegex = /^-?\d+(\.\d+)?$/;

  get typeId(): string {
    return 'decimal';
  }

  get typeName(): string {
    return 'Decimal';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const strValue = String(value);

    // Check format
    if (!this.decimalRegex.test(strValue)) {
      return {
        valid: false,
        errors: ['Value must be a valid decimal number']
      };
    }

    // Calculate digits for validation
    const parts = strValue.replace('-', '').split('.');
    const integerDigits = parts[0].length;
    const decimalDigits = parts[1] ? parts[1].length : 0;
    const totalDigits = integerDigits + decimalDigits;

    // Check precision and scale
    if (this.config.precision !== undefined || this.config.scale !== undefined) {
      if (this.config.precision !== undefined && totalDigits > this.config.precision) {
        errors.push(`Total digits (${totalDigits}) exceeds precision (${this.config.precision})`);
      }

      if (this.config.scale !== undefined && decimalDigits > this.config.scale) {
        errors.push(`Decimal places (${decimalDigits}) exceeds scale (${this.config.scale})`);
      }

      if (this.config.precision !== undefined && this.config.scale !== undefined) {
        const maxIntegerDigits = this.config.precision - this.config.scale;
        if (integerDigits > maxIntegerDigits) {
          errors.push(`Integer digits (${integerDigits}) exceeds maximum (${maxIntegerDigits})`);
        }
      }
    }

    // Check min/max
    if (this.config.min !== undefined) {
      if (this.compareDecimals(strValue, this.config.min) < 0) {
        errors.push(`Value must be at least ${this.config.min}`);
      }
    }

    if (this.config.max !== undefined) {
      if (this.compareDecimals(strValue, this.config.max) > 0) {
        errors.push(`Value cannot exceed ${this.config.max}`);
      }
    }

    // Warning for very large numbers
    if (totalDigits > 20) {
      warnings.push('Very large decimal value may have precision issues');
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

    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      transformed = this.getDefaultValue();
      warnings.push('Used default value for empty input');
      return {
        success: true,
        value: transformed,
        warnings
      };
    }

    // Convert to string
    if (typeof value === 'string') {
      transformed = value.trim();
    } else if (typeof value === 'number') {
      // Convert number to string, preserving precision
      transformed = value.toString();
      warnings.push('Converted number to decimal string');
    } else if (typeof value === 'boolean') {
      transformed = value ? '1.0' : '0.0';
      warnings.push('Converted boolean to decimal');
    } else {
      return {
        success: false,
        value: '0.0',
        warnings: ['Cannot convert value to decimal']
      };
    }

    // Validate format
    if (!this.decimalRegex.test(transformed)) {
      return {
        success: false,
        value: '0.0',
        warnings: [`Invalid decimal format: ${transformed}`]
      };
    }

    // Apply scale (rounding)
    if (this.config.scale !== undefined) {
      transformed = this.roundToScale(transformed, this.config.scale);
      warnings.push(`Rounded to ${this.config.scale} decimal places`);
    }

    // Apply min/max constraints
    if (this.config.min !== undefined && this.compareDecimals(transformed, this.config.min) < 0) {
      transformed = this.config.min;
      warnings.push(`Clamped to minimum value ${this.config.min}`);
    }

    if (this.config.max !== undefined && this.compareDecimals(transformed, this.config.max) > 0) {
      transformed = this.config.max;
      warnings.push(`Clamped to maximum value ${this.config.max}`);
    }

    // Normalize format (remove unnecessary zeros)
    transformed = this.normalizeDecimal(transformed);

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): string {
    if (this.config.defaultValue !== undefined) {
      return String(this.config.defaultValue);
    }
    if (this.config.min !== undefined && this.compareDecimals(this.config.min, '0') > 0) {
      return this.config.min;
    }
    if (this.config.scale !== undefined) {
      return '0.' + '0'.repeat(this.config.scale);
    }
    return '0.00';
  }

  serialize(): object {
    return this.config;
  }

  clone(config?: Partial<DecimalConfig>): DecimalPrimitive {
    return new DecimalPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<DecimalConfig> {
    return {
      precision: 18,
      scale: 2
    };
  }

  protected validateConfig(): void {
    if (this.config.precision !== undefined) {
      if (this.config.precision < 1 || !Number.isInteger(this.config.precision)) {
        throw new Error('precision must be a positive integer');
      }
    }

    if (this.config.scale !== undefined) {
      if (this.config.scale < 0 || !Number.isInteger(this.config.scale)) {
        throw new Error('scale must be a non-negative integer');
      }
    }

    if (this.config.precision !== undefined && this.config.scale !== undefined) {
      if (this.config.scale > this.config.precision) {
        throw new Error('scale cannot exceed precision');
      }
    }

    if (this.config.min !== undefined && !this.decimalRegex.test(this.config.min)) {
      throw new Error(`Invalid min decimal: ${this.config.min}`);
    }

    if (this.config.max !== undefined && !this.decimalRegex.test(this.config.max)) {
      throw new Error(`Invalid max decimal: ${this.config.max}`);
    }

    if (this.config.min !== undefined && this.config.max !== undefined) {
      if (this.compareDecimals(this.config.min, this.config.max) > 0) {
        throw new Error('min cannot be greater than max');
      }
    }
  }

  /**
   * Compare two decimal strings
   */
  private compareDecimals(a: string, b: string): number {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  /**
   * Round decimal to specific scale
   */
  private roundToScale(value: string, scale: number): string {
    const num = parseFloat(value);
    const factor = Math.pow(10, scale);
    const rounded = Math.round(num * factor) / factor;
    return rounded.toFixed(scale);
  }

  /**
   * Normalize decimal format
   */
  private normalizeDecimal(value: string): string {
    const num = parseFloat(value);
    
    // Preserve scale if configured
    if (this.config.scale !== undefined) {
      return num.toFixed(this.config.scale);
    }
    
    // Otherwise remove trailing zeros
    const str = num.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  }

  /**
   * Add two decimals
   */
  add(a: string, b: string): string {
    const result = (parseFloat(a) + parseFloat(b)).toString();
    return this.normalizeDecimal(result);
  }

  /**
   * Subtract two decimals
   */
  subtract(a: string, b: string): string {
    const result = (parseFloat(a) - parseFloat(b)).toString();
    return this.normalizeDecimal(result);
  }

  /**
   * Multiply two decimals
   */
  multiply(a: string, b: string): string {
    const result = (parseFloat(a) * parseFloat(b)).toString();
    return this.normalizeDecimal(result);
  }

  /**
   * Divide two decimals
   */
  divide(a: string, b: string): string | null {
    const divisor = parseFloat(b);
    if (divisor === 0) return null;
    
    const result = (parseFloat(a) / divisor).toString();
    return this.normalizeDecimal(result);
  }
}

/**
 * Factory function for creating decimal primitives
 */
export function createDecimalPrimitive(config?: DecimalConfig): DecimalPrimitive {
  return new DecimalPrimitive(config);
}