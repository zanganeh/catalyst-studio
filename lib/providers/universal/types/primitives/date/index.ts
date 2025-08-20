/**
 * Date Primitive Type - Date and datetime values
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * Date primitive configuration
 */
export interface DateConfig extends PrimitiveConfig {
  includeTime?: boolean;
  includeTimezone?: boolean;
  minDate?: Date | string;
  maxDate?: Date | string;
  format?: 'iso' | 'timestamp' | 'date-only';
}

/**
 * Date primitive implementation
 */
export class DatePrimitive extends PrimitiveType<Date, DateConfig> {
  private minDateParsed?: Date;
  private maxDateParsed?: Date;

  constructor(config?: DateConfig) {
    super(config);
    
    // Parse min/max dates
    if (this.config.minDate) {
      this.minDateParsed = this.parseDate(this.config.minDate);
      if (!this.minDateParsed) {
        throw new Error(`Invalid minDate: ${this.config.minDate}`);
      }
    }
    
    if (this.config.maxDate) {
      this.maxDateParsed = this.parseDate(this.config.maxDate);
      if (!this.maxDateParsed) {
        throw new Error(`Invalid maxDate: ${this.config.maxDate}`);
      }
    }
  }

  get typeId(): string {
    return 'date';
  }

  get typeName(): string {
    return 'Date';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse the date
    const date = this.parseDate(value);
    
    if (!date) {
      return {
        valid: false,
        errors: ['Value must be a valid date']
      };
    }

    // Check min date
    if (this.minDateParsed && date < this.minDateParsed) {
      errors.push(`Date must be after ${this.formatDate(this.minDateParsed)}`);
    }

    // Check max date
    if (this.maxDateParsed && date > this.maxDateParsed) {
      errors.push(`Date must be before ${this.formatDate(this.maxDateParsed)}`);
    }

    // Warnings for edge cases
    const now = new Date();
    const yearDiff = Math.abs(date.getFullYear() - now.getFullYear());
    if (yearDiff > 100) {
      warnings.push('Date is more than 100 years from current date');
    }

    if (date.getFullYear() < 1900) {
      warnings.push('Date is before 1900, may have compatibility issues');
    }

    if (date.getFullYear() > 2100) {
      warnings.push('Date is after 2100, may have compatibility issues');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: Date;

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

    // Parse the date
    const parsed = this.parseDate(value);
    
    if (!parsed) {
      return {
        success: false,
        value: new Date(),
        warnings: [`Cannot parse "${value}" as date`]
      };
    }

    transformed = parsed;

    // Apply time constraints
    if (!this.config.includeTime) {
      // Reset to start of day
      transformed = new Date(transformed.getFullYear(), transformed.getMonth(), transformed.getDate());
      if (parsed.getHours() !== 0 || parsed.getMinutes() !== 0) {
        warnings.push('Time component removed (date only)');
      }
    }

    // Apply min/max constraints
    if (this.minDateParsed && transformed < this.minDateParsed) {
      transformed = new Date(this.minDateParsed);
      warnings.push(`Clamped to minimum date ${this.formatDate(this.minDateParsed)}`);
    }

    if (this.maxDateParsed && transformed > this.maxDateParsed) {
      transformed = new Date(this.maxDateParsed);
      warnings.push(`Clamped to maximum date ${this.formatDate(this.maxDateParsed)}`);
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): Date {
    if (this.config.defaultValue !== undefined) {
      const parsed = this.parseDate(this.config.defaultValue);
      if (parsed) return parsed;
    }
    
    // Default to current date/time
    const now = new Date();
    
    if (!this.config.includeTime) {
      // Return start of today
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    return now;
  }

  serialize(): object {
    return {
      ...this.config,
      minDate: this.config.minDate ? this.formatDate(this.parseDate(this.config.minDate)!) : undefined,
      maxDate: this.config.maxDate ? this.formatDate(this.parseDate(this.config.maxDate)!) : undefined,
      defaultValue: this.config.defaultValue ? this.formatDate(this.parseDate(this.config.defaultValue)!) : undefined
    };
  }

  clone(config?: Partial<DateConfig>): DatePrimitive {
    return new DatePrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<DateConfig> {
    return {
      includeTime: true,
      includeTimezone: false,
      format: 'iso'
    };
  }

  protected validateConfig(): void {
    if (this.minDateParsed && this.maxDateParsed) {
      if (this.minDateParsed > this.maxDateParsed) {
        throw new Error('minDate cannot be after maxDate');
      }
    }

    if (this.config.defaultValue !== undefined) {
      const parsed = this.parseDate(this.config.defaultValue);
      if (!parsed) {
        throw new Error(`Invalid default date: ${this.config.defaultValue}`);
      }
      
      const validation = this.validate(parsed);
      if (!validation.valid) {
        throw new Error(`Default date is invalid: ${validation.errors.join(', ')}`);
      }
    }
  }

  /**
   * Parse various date formats
   */
  private parseDate(value: any): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value === 'number') {
      // Assume timestamp
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    switch (this.config.format) {
      case 'timestamp':
        return date.getTime().toString();
      
      case 'date-only':
        return date.toISOString().split('T')[0];
      
      case 'iso':
      default:
        if (!this.config.includeTime) {
          return date.toISOString().split('T')[0];
        }
        return date.toISOString();
    }
  }

  /**
   * Check if date is in range
   */
  isInRange(date: Date): boolean {
    if (this.minDateParsed && date < this.minDateParsed) return false;
    if (this.maxDateParsed && date > this.maxDateParsed) return false;
    return true;
  }

  /**
   * Get age in years from date
   */
  getAge(date: Date): number {
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
      age--;
    }
    
    return age;
  }
}

/**
 * Factory function for creating date primitives
 */
export function createDatePrimitive(config?: DateConfig): DatePrimitive {
  return new DatePrimitive(config);
}