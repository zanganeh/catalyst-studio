/**
 * Number Primitive Type - Integer and floating point numbers
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * Number primitive configuration
 */
export interface NumberConfig extends PrimitiveConfig {
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  precision?: number;
}

/**
 * Number primitive implementation
 */
export class NumberPrimitive extends PrimitiveType<number, NumberConfig> {
  get typeId(): string {
    return 'number';
  }

  get typeName(): string {
    return 'Number';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type check
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        valid: false,
        errors: ['Value must be a valid number']
      };
    }

    // Integer check
    if (this.config.isInteger && !Number.isInteger(value)) {
      errors.push('Value must be an integer');
    }

    // Range validation
    if (this.config.min !== undefined && value < this.config.min) {
      errors.push(`Value must be at least ${this.config.min}`);
    }

    if (this.config.max !== undefined && value > this.config.max) {
      errors.push(`Value cannot exceed ${this.config.max}`);
    }

    // Step validation
    if (this.config.step !== undefined && this.config.min !== undefined) {
      const steps = (value - this.config.min) / this.config.step;
      if (!Number.isInteger(steps)) {
        errors.push(`Value must be a multiple of ${this.config.step} from ${this.config.min}`);
      }
    }

    // Precision warning
    if (this.config.precision !== undefined) {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > this.config.precision) {
        warnings.push(`Value has more than ${this.config.precision} decimal places`);
      }
    }

    // Edge case warnings
    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      warnings.push('Value exceeds safe integer range');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: number;

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

    // Convert to number
    if (typeof value === 'number') {
      transformed = value;
    } else if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        return {
          success: false,
          value: 0,
          warnings: [`Cannot parse "${value}" as number`]
        };
      }
      transformed = parsed;
      warnings.push('Parsed string to number');
    } else if (typeof value === 'boolean') {
      transformed = value ? 1 : 0;
      warnings.push('Converted boolean to number');
    } else {
      return {
        success: false,
        value: 0,
        warnings: ['Cannot convert value to number']
      };
    }

    // Apply integer constraint
    if (this.config.isInteger) {
      const rounded = Math.round(transformed);
      if (rounded !== transformed) {
        transformed = rounded;
        warnings.push('Rounded to integer');
      }
    }

    // Apply precision
    if (this.config.precision !== undefined) {
      const factor = Math.pow(10, this.config.precision);
      transformed = Math.round(transformed * factor) / factor;
    }

    // Apply min/max constraints
    if (this.config.min !== undefined && transformed < this.config.min) {
      transformed = this.config.min;
      warnings.push(`Clamped to minimum value ${this.config.min}`);
    }

    if (this.config.max !== undefined && transformed > this.config.max) {
      transformed = this.config.max;
      warnings.push(`Clamped to maximum value ${this.config.max}`);
    }

    // Apply step
    if (this.config.step !== undefined && this.config.min !== undefined) {
      const steps = Math.round((transformed - this.config.min) / this.config.step);
      transformed = this.config.min + (steps * this.config.step);
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): number {
    if (this.config.defaultValue !== undefined) {
      return this.config.defaultValue;
    }
    if (this.config.min !== undefined && this.config.min > 0) {
      return this.config.min;
    }
    return 0;
  }

  serialize(): object {
    return this.config;
  }

  clone(config?: Partial<NumberConfig>): NumberPrimitive {
    return new NumberPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<NumberConfig> {
    return {
      isInteger: false
    };
  }

  protected validateConfig(): void {
    if (this.config.min !== undefined && this.config.max !== undefined) {
      if (this.config.min > this.config.max) {
        throw new Error('min cannot be greater than max');
      }
    }

    if (this.config.step !== undefined && this.config.step <= 0) {
      throw new Error('step must be positive');
    }

    if (this.config.precision !== undefined) {
      if (this.config.precision < 0 || !Number.isInteger(this.config.precision)) {
        throw new Error('precision must be a non-negative integer');
      }
    }

    if (this.config.defaultValue !== undefined) {
      const validation = this.validate(this.config.defaultValue);
      if (!validation.valid) {
        throw new Error(`Default value is invalid: ${validation.errors.join(', ')}`);
      }
    }
  }

  /**
   * Check if value is within range
   */
  isInRange(value: number): boolean {
    if (this.config.min !== undefined && value < this.config.min) return false;
    if (this.config.max !== undefined && value > this.config.max) return false;
    return true;
  }

  /**
   * Round to configured precision
   */
  roundToPrecision(value: number): number {
    if (this.config.precision === undefined) return value;
    const factor = Math.pow(10, this.config.precision);
    return Math.round(value * factor) / factor;
  }
}

/**
 * Factory function for creating number primitives
 */
export function createNumberPrimitive(config?: NumberConfig): NumberPrimitive {
  return new NumberPrimitive(config);
}