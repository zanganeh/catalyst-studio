/**
 * Base Primitive Type - Abstract class for all primitive types
 * Provides common functionality and enforces consistent interface
 */

/**
 * Primitive configuration base
 */
export interface PrimitiveConfig {
  required?: boolean;
  defaultValue?: any;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Transformation result
 */
export interface TransformResult {
  success: boolean;
  value: any;
  warnings?: string[];
}

/**
 * Abstract base class for primitive types
 */
export abstract class PrimitiveType<TValue = any, TConfig extends PrimitiveConfig = PrimitiveConfig> {
  protected config: TConfig;

  constructor(config?: TConfig) {
    this.config = this.mergeWithDefaults(config);
    this.validateConfig();
  }

  /**
   * Get the primitive type identifier
   */
  abstract get typeId(): string;

  /**
   * Get human-readable type name
   */
  abstract get typeName(): string;

  /**
   * Validate a value against this primitive type
   */
  abstract validate(value: any): ValidationResult;

  /**
   * Transform a value to this primitive type
   */
  abstract transform(value: any): TransformResult;

  /**
   * Get the default value for this primitive
   */
  abstract getDefaultValue(): TValue;

  /**
   * Serialize the primitive configuration
   */
  abstract serialize(): object;

  /**
   * Clone this primitive with new configuration
   */
  abstract clone(config?: Partial<TConfig>): PrimitiveType<TValue, TConfig>;

  /**
   * Check if a value is empty/null/undefined
   */
  isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Check if this field is required
   */
  isRequired(): boolean {
    return this.config.required ?? false;
  }

  /**
   * Get the description
   */
  getDescription(): string | undefined {
    return this.config.description;
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, any> | undefined {
    return this.config.metadata;
  }

  /**
   * Validate the value with required check
   */
  validateWithRequired(value: any): ValidationResult {
    // Check required
    if (this.isRequired() && this.isEmpty(value)) {
      return {
        valid: false,
        errors: [`${this.typeName} is required`]
      };
    }

    // Allow empty if not required
    if (!this.isRequired() && this.isEmpty(value)) {
      return {
        valid: true,
        errors: []
      };
    }

    // Validate the actual value
    return this.validate(value);
  }

  /**
   * Compare two values for equality
   */
  equals(value1: TValue, value2: TValue): boolean {
    return value1 === value2;
  }

  /**
   * Get configuration
   */
  getConfig(): TConfig {
    return { ...this.config };
  }

  /**
   * Merge configuration with defaults
   */
  protected mergeWithDefaults(config?: TConfig): TConfig {
    return {
      required: false,
      ...this.getDefaultConfig(),
      ...config
    } as TConfig;
  }

  /**
   * Get default configuration for this type
   */
  protected abstract getDefaultConfig(): Partial<TConfig>;

  /**
   * Validate the configuration
   */
  protected abstract validateConfig(): void;

  /**
   * Convert to JSON representation
   */
  toJSON(): object {
    return {
      type: this.typeId,
      ...this.serialize()
    };
  }

  /**
   * Create from JSON representation
   */
  static fromJSON<T extends PrimitiveType>(json: any, TypeClass: new (config?: any) => T): T {
    const { type, ...config } = json;
    return new TypeClass(config);
  }
}