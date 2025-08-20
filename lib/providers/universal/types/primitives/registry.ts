/**
 * Primitive Type Registry - Central registry for all primitive types
 * Provides factory methods and type discovery
 */

import { PrimitiveType, PrimitiveConfig } from './base/primitive-type';
import { TextPrimitive, TextConfig } from './text';
import { NumberPrimitive, NumberConfig } from './number';
import { BooleanPrimitive, BooleanConfig } from './boolean';
import { DatePrimitive, DateConfig } from './date';
import { JsonPrimitive, JsonConfig } from './json';
import { DecimalPrimitive, DecimalConfig } from './decimal';
import { LongTextPrimitive, LongTextConfig } from './long-text';

/**
 * Primitive type identifiers
 */
export enum PrimitiveTypeId {
  TEXT = 'text',
  LONG_TEXT = 'longText',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  DECIMAL = 'decimal'
}

/**
 * Map of primitive type classes
 */
const PRIMITIVE_CLASSES = {
  [PrimitiveTypeId.TEXT]: TextPrimitive,
  [PrimitiveTypeId.LONG_TEXT]: LongTextPrimitive,
  [PrimitiveTypeId.NUMBER]: NumberPrimitive,
  [PrimitiveTypeId.BOOLEAN]: BooleanPrimitive,
  [PrimitiveTypeId.DATE]: DatePrimitive,
  [PrimitiveTypeId.JSON]: JsonPrimitive,
  [PrimitiveTypeId.DECIMAL]: DecimalPrimitive
};

/**
 * Union type for all primitive configurations
 */
export type AnyPrimitiveConfig = 
  | TextConfig
  | LongTextConfig
  | NumberConfig
  | BooleanConfig
  | DateConfig
  | JsonConfig
  | DecimalConfig;

/**
 * Union type for all primitive instances
 */
export type AnyPrimitive = 
  | TextPrimitive
  | LongTextPrimitive
  | NumberPrimitive
  | BooleanPrimitive
  | DatePrimitive
  | JsonPrimitive
  | DecimalPrimitive;

/**
 * Primitive type registry
 */
export class PrimitiveRegistry {
  private static instance: PrimitiveRegistry;
  private customTypes: Map<string, typeof PrimitiveType> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PrimitiveRegistry {
    if (!PrimitiveRegistry.instance) {
      PrimitiveRegistry.instance = new PrimitiveRegistry();
    }
    return PrimitiveRegistry.instance;
  }

  /**
   * Create a primitive by type ID
   */
  create(typeId: string, config?: AnyPrimitiveConfig): PrimitiveType {
    // Check custom types first
    if (this.customTypes.has(typeId)) {
      const TypeClass = this.customTypes.get(typeId)!;
      return new (TypeClass as any)(config);
    }

    // Check built-in types
    const TypeClass = PRIMITIVE_CLASSES[typeId as PrimitiveTypeId];
    if (!TypeClass) {
      throw new Error(`Unknown primitive type: ${typeId}`);
    }

    return new (TypeClass as any)(config);
  }

  /**
   * Create a text primitive
   */
  createText(config?: TextConfig): TextPrimitive {
    return new TextPrimitive(config);
  }

  /**
   * Create a long text primitive
   */
  createLongText(config?: LongTextConfig): LongTextPrimitive {
    return new LongTextPrimitive(config);
  }

  /**
   * Create a number primitive
   */
  createNumber(config?: NumberConfig): NumberPrimitive {
    return new NumberPrimitive(config);
  }

  /**
   * Create a boolean primitive
   */
  createBoolean(config?: BooleanConfig): BooleanPrimitive {
    return new BooleanPrimitive(config);
  }

  /**
   * Create a date primitive
   */
  createDate(config?: DateConfig): DatePrimitive {
    return new DatePrimitive(config);
  }

  /**
   * Create a JSON primitive
   */
  createJson(config?: JsonConfig): JsonPrimitive {
    return new JsonPrimitive(config);
  }

  /**
   * Create a decimal primitive
   */
  createDecimal(config?: DecimalConfig): DecimalPrimitive {
    return new DecimalPrimitive(config);
  }

  /**
   * Register a custom primitive type
   */
  registerCustomType(typeId: string, TypeClass: typeof PrimitiveType): void {
    if (PRIMITIVE_CLASSES[typeId as PrimitiveTypeId]) {
      throw new Error(`Cannot override built-in type: ${typeId}`);
    }
    this.customTypes.set(typeId, TypeClass);
  }

  /**
   * Unregister a custom primitive type
   */
  unregisterCustomType(typeId: string): boolean {
    return this.customTypes.delete(typeId);
  }

  /**
   * Get all registered type IDs
   */
  getTypeIds(): string[] {
    return [
      ...Object.values(PrimitiveTypeId),
      ...this.customTypes.keys()
    ];
  }

  /**
   * Check if a type ID is registered
   */
  hasType(typeId: string): boolean {
    return typeId in PRIMITIVE_CLASSES || this.customTypes.has(typeId);
  }

  /**
   * Create primitive from JSON
   */
  fromJSON(json: any): PrimitiveType {
    if (!json || typeof json !== 'object' || !json.type) {
      throw new Error('Invalid primitive JSON: missing type field');
    }

    return this.create(json.type, json);
  }

  /**
   * Detect primitive type from value
   */
  detectType(value: any): PrimitiveTypeId | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return PrimitiveTypeId.BOOLEAN;
    }

    if (typeof value === 'number') {
      // Check if it's a decimal
      if (!Number.isInteger(value) && value.toString().includes('.')) {
        const decimalPlaces = value.toString().split('.')[1].length;
        if (decimalPlaces > 2) {
          return PrimitiveTypeId.DECIMAL;
        }
      }
      return PrimitiveTypeId.NUMBER;
    }

    if (typeof value === 'string') {
      // Try to detect date
      const date = new Date(value);
      if (!isNaN(date.getTime()) && value.includes('-')) {
        return PrimitiveTypeId.DATE;
      }

      // Check length for text vs long text
      if (value.length > 255) {
        return PrimitiveTypeId.LONG_TEXT;
      }

      return PrimitiveTypeId.TEXT;
    }

    if (value instanceof Date) {
      return PrimitiveTypeId.DATE;
    }

    if (typeof value === 'object') {
      return PrimitiveTypeId.JSON;
    }

    return null;
  }

  /**
   * Create primitive by detecting type from value
   */
  createFromValue(value: any, config?: Partial<PrimitiveConfig>): PrimitiveType | null {
    const typeId = this.detectType(value);
    if (!typeId) {
      return null;
    }

    const primitive = this.create(typeId, config as any);
    
    // Set default value to the provided value if valid
    const validation = primitive.validate(value);
    if (validation.valid) {
      return primitive.clone({ ...config, defaultValue: value } as any);
    }

    return primitive;
  }

  /**
   * Get primitive type metadata
   */
  getTypeMetadata(typeId: string): {
    id: string;
    name: string;
    description: string;
    category: 'text' | 'numeric' | 'temporal' | 'boolean' | 'structured';
  } | null {
    const metadata: Record<PrimitiveTypeId, any> = {
      [PrimitiveTypeId.TEXT]: {
        id: PrimitiveTypeId.TEXT,
        name: 'Text',
        description: 'Short text (max 255 characters)',
        category: 'text'
      },
      [PrimitiveTypeId.LONG_TEXT]: {
        id: PrimitiveTypeId.LONG_TEXT,
        name: 'Long Text',
        description: 'Long text content',
        category: 'text'
      },
      [PrimitiveTypeId.NUMBER]: {
        id: PrimitiveTypeId.NUMBER,
        name: 'Number',
        description: 'Integer or decimal number',
        category: 'numeric'
      },
      [PrimitiveTypeId.BOOLEAN]: {
        id: PrimitiveTypeId.BOOLEAN,
        name: 'Boolean',
        description: 'True/false value',
        category: 'boolean'
      },
      [PrimitiveTypeId.DATE]: {
        id: PrimitiveTypeId.DATE,
        name: 'Date',
        description: 'Date and time',
        category: 'temporal'
      },
      [PrimitiveTypeId.JSON]: {
        id: PrimitiveTypeId.JSON,
        name: 'JSON',
        description: 'Structured JSON data',
        category: 'structured'
      },
      [PrimitiveTypeId.DECIMAL]: {
        id: PrimitiveTypeId.DECIMAL,
        name: 'Decimal',
        description: 'High-precision decimal number',
        category: 'numeric'
      }
    };

    return metadata[typeId as PrimitiveTypeId] || null;
  }
}

/**
 * Global registry instance
 */
export const primitiveRegistry = PrimitiveRegistry.getInstance();

/**
 * Factory functions for convenience
 */
export const createPrimitive = (typeId: string, config?: AnyPrimitiveConfig) => 
  primitiveRegistry.create(typeId, config);

export const createTextPrimitive = (config?: TextConfig) => 
  primitiveRegistry.createText(config);

export const createNumberPrimitive = (config?: NumberConfig) => 
  primitiveRegistry.createNumber(config);

export const createBooleanPrimitive = (config?: BooleanConfig) => 
  primitiveRegistry.createBoolean(config);

export const createDatePrimitive = (config?: DateConfig) => 
  primitiveRegistry.createDate(config);

export const createJsonPrimitive = (config?: JsonConfig) => 
  primitiveRegistry.createJson(config);

export const createDecimalPrimitive = (config?: DecimalConfig) => 
  primitiveRegistry.createDecimal(config);