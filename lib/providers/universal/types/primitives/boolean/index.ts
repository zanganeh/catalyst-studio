/**
 * Boolean Primitive Type - True/false values
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * Boolean primitive configuration
 */
export interface BooleanConfig extends PrimitiveConfig {
  trueLabel?: string;
  falseLabel?: string;
  strictValidation?: boolean;
}

/**
 * Boolean primitive implementation
 */
export class BooleanPrimitive extends PrimitiveType<boolean, BooleanConfig> {
  get typeId(): string {
    return 'boolean';
  }

  get typeName(): string {
    return 'Boolean';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];

    if (this.config.strictValidation) {
      // Strict mode - only true/false allowed
      if (typeof value !== 'boolean') {
        errors.push('Value must be a boolean (true or false)');
      }
    } else {
      // Loose mode - accept truthy/falsy values
      if (value === null || value === undefined) {
        if (this.isRequired()) {
          errors.push('Boolean value is required');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: boolean;

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

    // Direct boolean
    if (typeof value === 'boolean') {
      transformed = value;
    } 
    // String conversions
    else if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      
      // Check against labels
      if (this.config.trueLabel && lower === this.config.trueLabel.toLowerCase()) {
        transformed = true;
        warnings.push(`Converted "${value}" to true using label`);
      } else if (this.config.falseLabel && lower === this.config.falseLabel.toLowerCase()) {
        transformed = false;
        warnings.push(`Converted "${value}" to false using label`);
      }
      // Common string values
      else if (['true', 'yes', '1', 'on', 'enabled'].includes(lower)) {
        transformed = true;
        warnings.push(`Converted string "${value}" to true`);
      } else if (['false', 'no', '0', 'off', 'disabled'].includes(lower)) {
        transformed = false;
        warnings.push(`Converted string "${value}" to false`);
      } else {
        // Any non-empty string is truthy
        transformed = true;
        warnings.push(`Non-empty string "${value}" converted to true`);
      }
    }
    // Number conversions
    else if (typeof value === 'number') {
      transformed = value !== 0;
      warnings.push(`Converted number ${value} to ${transformed}`);
    }
    // Object/Array conversions
    else if (typeof value === 'object') {
      transformed = true; // Objects are truthy
      warnings.push('Object converted to true');
    }
    else {
      // Default to boolean coercion
      transformed = Boolean(value);
      warnings.push(`Converted ${typeof value} to boolean`);
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): boolean {
    if (this.config.defaultValue !== undefined) {
      return this.config.defaultValue;
    }
    return false;
  }

  serialize(): object {
    return this.config;
  }

  clone(config?: Partial<BooleanConfig>): BooleanPrimitive {
    return new BooleanPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<BooleanConfig> {
    return {
      strictValidation: false,
      trueLabel: 'Yes',
      falseLabel: 'No'
    };
  }

  protected validateConfig(): void {
    if (this.config.defaultValue !== undefined) {
      if (typeof this.config.defaultValue !== 'boolean') {
        throw new Error('Default value must be a boolean');
      }
    }

    if (this.config.trueLabel === this.config.falseLabel) {
      throw new Error('True and false labels must be different');
    }
  }

  /**
   * Get display label for a value
   */
  getLabel(value: boolean): string {
    if (value) {
      return this.config.trueLabel ?? 'Yes';
    } else {
      return this.config.falseLabel ?? 'No';
    }
  }

  /**
   * Parse label to boolean
   */
  parseLabel(label: string): boolean | undefined {
    const lower = label.toLowerCase().trim();
    
    if (this.config.trueLabel && lower === this.config.trueLabel.toLowerCase()) {
      return true;
    }
    
    if (this.config.falseLabel && lower === this.config.falseLabel.toLowerCase()) {
      return false;
    }
    
    return undefined;
  }

  /**
   * Toggle a boolean value
   */
  toggle(value: boolean): boolean {
    return !value;
  }
}

/**
 * Factory function for creating boolean primitives
 */
export function createBooleanPrimitive(config?: BooleanConfig): BooleanPrimitive {
  return new BooleanPrimitive(config);
}