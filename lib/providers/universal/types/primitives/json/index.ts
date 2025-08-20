/**
 * JSON Primitive Type - Arbitrary JSON data structures
 */

import { PrimitiveType, PrimitiveConfig, ValidationResult, TransformResult } from '../base/primitive-type';

/**
 * JSON primitive configuration
 */
export interface JsonConfig extends PrimitiveConfig {
  schema?: object;
  prettyPrint?: boolean;
  maxDepth?: number;
  maxSize?: number; // Max size in bytes
}

/**
 * JSON primitive implementation
 */
export class JsonPrimitive extends PrimitiveType<any, JsonConfig> {
  get typeId(): string {
    return 'json';
  }

  get typeName(): string {
    return 'JSON';
  }

  validate(value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's valid JSON
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch (e) {
        return {
          valid: false,
          errors: ['Value must be valid JSON string']
        };
      }
    } else if (typeof value === 'object' && value !== null) {
      try {
        JSON.stringify(value);
      } catch (e) {
        return {
          valid: false,
          errors: ['Value must be serializable to JSON']
        };
      }
    } else if (value === null || value === undefined) {
      // null is valid JSON
      return {
        valid: true,
        errors: []
      };
    } else {
      // Primitives are valid JSON
      // Number, boolean, string are all valid
    }

    // Check depth
    if (this.config.maxDepth !== undefined) {
      const depth = this.getDepth(value);
      if (depth > this.config.maxDepth) {
        errors.push(`JSON depth ${depth} exceeds maximum ${this.config.maxDepth}`);
      }
    }

    // Check size
    if (this.config.maxSize !== undefined) {
      const size = this.getSize(value);
      if (size > this.config.maxSize) {
        errors.push(`JSON size ${size} bytes exceeds maximum ${this.config.maxSize}`);
      }
    }

    // Schema validation would go here if schema is provided
    if (this.config.schema) {
      warnings.push('Schema validation not implemented');
    }

    // Warnings for large objects
    const size = this.getSize(value);
    if (size > 1024 * 1024) { // 1MB
      warnings.push(`Large JSON object (${Math.round(size / 1024)}KB)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  transform(value: any): TransformResult {
    const warnings: string[] = [];
    let transformed: any;

    // Handle null/undefined
    if (value === undefined) {
      transformed = this.getDefaultValue();
      warnings.push('Used default value for undefined');
      return {
        success: true,
        value: transformed,
        warnings
      };
    }

    // null is valid JSON
    if (value === null) {
      return {
        success: true,
        value: null,
        warnings: []
      };
    }

    // Parse JSON string
    if (typeof value === 'string') {
      if (value.trim() === '') {
        transformed = this.getDefaultValue();
        warnings.push('Used default value for empty string');
      } else {
        try {
          transformed = JSON.parse(value);
          warnings.push('Parsed JSON string');
        } catch (e) {
          // Try to convert as plain string
          transformed = value;
          warnings.push('Kept as string value');
        }
      }
    } else if (typeof value === 'object') {
      // Clone object to avoid mutations
      try {
        transformed = JSON.parse(JSON.stringify(value));
      } catch (e) {
        return {
          success: false,
          value: {},
          warnings: ['Object is not JSON serializable']
        };
      }
    } else {
      // Keep primitives as-is
      transformed = value;
    }

    // Apply depth constraint
    if (this.config.maxDepth !== undefined) {
      transformed = this.truncateDepth(transformed, this.config.maxDepth);
      if (this.getDepth(value) > this.config.maxDepth) {
        warnings.push(`Truncated to maximum depth ${this.config.maxDepth}`);
      }
    }

    // Apply size constraint
    if (this.config.maxSize !== undefined) {
      const size = this.getSize(transformed);
      if (size > this.config.maxSize) {
        // Simple truncation strategy
        transformed = this.truncateSize(transformed, this.config.maxSize);
        warnings.push(`Truncated to maximum size ${this.config.maxSize} bytes`);
      }
    }

    return {
      success: true,
      value: transformed,
      warnings
    };
  }

  getDefaultValue(): any {
    if (this.config.defaultValue !== undefined) {
      return this.config.defaultValue;
    }
    return {};
  }

  serialize(): object {
    return {
      ...this.config,
      defaultValue: this.config.defaultValue // Keep as-is
    };
  }

  clone(config?: Partial<JsonConfig>): JsonPrimitive {
    return new JsonPrimitive({
      ...this.config,
      ...config
    });
  }

  protected getDefaultConfig(): Partial<JsonConfig> {
    return {
      prettyPrint: false,
      maxDepth: 10,
      maxSize: 1024 * 1024 * 10 // 10MB default
    };
  }

  protected validateConfig(): void {
    if (this.config.maxDepth !== undefined && this.config.maxDepth < 1) {
      throw new Error('maxDepth must be at least 1');
    }

    if (this.config.maxSize !== undefined && this.config.maxSize < 1) {
      throw new Error('maxSize must be at least 1');
    }

    if (this.config.defaultValue !== undefined) {
      const validation = this.validate(this.config.defaultValue);
      if (!validation.valid) {
        throw new Error(`Default value is invalid: ${validation.errors.join(', ')}`);
      }
    }
  }

  /**
   * Get the depth of a JSON structure
   */
  private getDepth(obj: any, currentDepth = 0): number {
    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        maxDepth = Math.max(maxDepth, this.getDepth(item, currentDepth + 1));
      }
    } else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          maxDepth = Math.max(maxDepth, this.getDepth(obj[key], currentDepth + 1));
        }
      }
    }

    return maxDepth;
  }

  /**
   * Get the size of JSON in bytes
   */
  private getSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      // Fallback for environments without Blob
      return JSON.stringify(obj).length * 2; // Rough estimate
    }
  }

  /**
   * Truncate JSON to maximum depth
   */
  private truncateDepth(obj: any, maxDepth: number, currentDepth = 0): any {
    if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
      return typeof obj === 'object' && obj !== null ? '[Truncated]' : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.truncateDepth(item, maxDepth, currentDepth + 1));
    }

    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = this.truncateDepth(obj[key], maxDepth, currentDepth + 1);
      }
    }
    return result;
  }

  /**
   * Truncate JSON to maximum size (simple strategy)
   */
  private truncateSize(obj: any, maxSize: number): any {
    const str = JSON.stringify(obj);
    if (str.length <= maxSize) {
      return obj;
    }

    // Simple truncation - just return a message
    return {
      _truncated: true,
      _message: `Object truncated from ${str.length} to ${maxSize} bytes`,
      _partial: JSON.parse(str.substring(0, maxSize - 100) + '"}')
    };
  }

  /**
   * Stringify JSON with optional pretty printing
   */
  stringify(value: any): string {
    if (this.config.prettyPrint) {
      return JSON.stringify(value, null, 2);
    }
    return JSON.stringify(value);
  }

  /**
   * Parse JSON safely
   */
  parse(value: string): any | null {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

/**
 * Factory function for creating JSON primitives
 */
export function createJsonPrimitive(config?: JsonConfig): JsonPrimitive {
  return new JsonPrimitive(config);
}