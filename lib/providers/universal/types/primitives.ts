/**
 * Primitive Type Layer - Base types supported across all CMS platforms
 * Part of the three-layer type system (primitives, common patterns, extensions)
 */

/**
 * Enumeration of all primitive types
 * These are the foundational types that all CMS platforms can support
 */
export enum PrimitiveType {
  TEXT = 'text',
  LONG_TEXT = 'longText',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  JSON = 'json',
  DECIMAL = 'decimal'
}

/**
 * Base interface for all primitive types
 */
export interface BasePrimitive {
  type: PrimitiveType;
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

/**
 * Short text primitive - max 255 characters
 * Used for titles, names, short descriptions
 * Platform compatibility: All platforms support short text
 */
export interface TextPrimitive extends BasePrimitive {
  type: PrimitiveType.TEXT;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  defaultValue?: string;
  placeholder?: string;
}

/**
 * Long text primitive - unlimited length
 * Used for body content, descriptions, articles
 * Platform compatibility: All platforms support long text
 */
export interface LongTextPrimitive extends BasePrimitive {
  type: PrimitiveType.LONG_TEXT;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
  placeholder?: string;
}

/**
 * Number primitive - integers and floats
 * Used for quantities, scores, measurements
 * Platform compatibility: All platforms support numbers
 */
export interface NumberPrimitive extends BasePrimitive {
  type: PrimitiveType.NUMBER;
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  defaultValue?: number;
}

/**
 * Boolean primitive - true/false values
 * Used for flags, toggles, binary choices
 * Platform compatibility: All platforms support booleans
 */
export interface BooleanPrimitive extends BasePrimitive {
  type: PrimitiveType.BOOLEAN;
  defaultValue?: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

/**
 * Date primitive - date and datetime values
 * Used for timestamps, scheduling, deadlines
 * Platform compatibility: All platforms support dates
 */
export interface DatePrimitive extends BasePrimitive {
  type: PrimitiveType.DATE;
  includeTime?: boolean;
  includeTimezone?: boolean;
  minDate?: Date | string;
  maxDate?: Date | string;
  defaultValue?: Date | string;
}

/**
 * JSON primitive - arbitrary JSON data
 * Used for complex data structures, configurations
 * Platform compatibility: Most platforms support JSON (may fallback to text)
 */
export interface JsonPrimitive extends BasePrimitive {
  type: PrimitiveType.JSON;
  schema?: object;
  defaultValue?: any;
}

/**
 * Decimal primitive - high-precision decimal numbers
 * Used for currency, percentages, scientific data
 * Platform compatibility: Some platforms may fallback to number
 */
export interface DecimalPrimitive extends BasePrimitive {
  type: PrimitiveType.DECIMAL;
  precision?: number;
  scale?: number;
  min?: string;
  max?: string;
  defaultValue?: string;
}

/**
 * Union type for all primitive types
 */
export type Primitive = 
  | TextPrimitive
  | LongTextPrimitive
  | NumberPrimitive
  | BooleanPrimitive
  | DatePrimitive
  | JsonPrimitive
  | DecimalPrimitive;

/**
 * Type guards for primitive detection
 */
export const isPrimitive = (value: any): value is Primitive => {
  return value && typeof value === 'object' && 
    'type' in value && 
    Object.values(PrimitiveType).includes(value.type);
};

export const isTextPrimitive = (value: any): value is TextPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.TEXT;
};

export const isLongTextPrimitive = (value: any): value is LongTextPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.LONG_TEXT;
};

export const isNumberPrimitive = (value: any): value is NumberPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.NUMBER;
};

export const isBooleanPrimitive = (value: any): value is BooleanPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.BOOLEAN;
};

export const isDatePrimitive = (value: any): value is DatePrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.DATE;
};

export const isJsonPrimitive = (value: any): value is JsonPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.JSON;
};

export const isDecimalPrimitive = (value: any): value is DecimalPrimitive => {
  return isPrimitive(value) && value.type === PrimitiveType.DECIMAL;
};

/**
 * Validation rules for each primitive type
 */
export class PrimitiveValidator {
  static validateText(value: any, primitive: TextPrimitive): boolean {
    if (typeof value !== 'string') return false;
    
    const length = value.length;
    const maxLength = primitive.maxLength ?? 255;
    const minLength = primitive.minLength ?? 0;
    
    if (length > maxLength || length < minLength) return false;
    
    if (primitive.pattern) {
      const regex = new RegExp(primitive.pattern);
      if (!regex.test(value)) return false;
    }
    
    return true;
  }

  static validateLongText(value: any, primitive: LongTextPrimitive): boolean {
    if (typeof value !== 'string') return false;
    
    const length = value.length;
    if (primitive.maxLength && length > primitive.maxLength) return false;
    if (primitive.minLength && length < primitive.minLength) return false;
    
    return true;
  }

  static validateNumber(value: any, primitive: NumberPrimitive): boolean {
    if (typeof value !== 'number' || isNaN(value)) return false;
    
    if (primitive.isInteger && !Number.isInteger(value)) return false;
    if (primitive.min !== undefined && value < primitive.min) return false;
    if (primitive.max !== undefined && value > primitive.max) return false;
    
    return true;
  }

  static validateBoolean(value: any, primitive: BooleanPrimitive): boolean {
    return typeof value === 'boolean';
  }

  static validateDate(value: any, primitive: DatePrimitive): boolean {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return false;
    
    if (primitive.minDate) {
      const minDate = new Date(primitive.minDate);
      if (date < minDate) return false;
    }
    
    if (primitive.maxDate) {
      const maxDate = new Date(primitive.maxDate);
      if (date > maxDate) return false;
    }
    
    return true;
  }

  static validateJson(value: any, primitive: JsonPrimitive): boolean {
    try {
      if (typeof value === 'string') {
        JSON.parse(value);
      } else if (typeof value === 'object' && value !== null) {
        JSON.stringify(value);
      } else {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  static validateDecimal(value: any, primitive: DecimalPrimitive): boolean {
    const strValue = String(value);
    const decimalRegex = /^-?\d+(\.\d+)?$/;
    
    if (!decimalRegex.test(strValue)) return false;
    
    if (primitive.precision !== undefined || primitive.scale !== undefined) {
      const parts = strValue.split('.');
      const integerPart = parts[0].replace('-', '');
      const decimalPart = parts[1] || '';
      
      if (primitive.precision !== undefined) {
        const totalDigits = integerPart.length + decimalPart.length;
        if (totalDigits > primitive.precision) return false;
      }
      
      if (primitive.scale !== undefined && decimalPart.length > primitive.scale) {
        return false;
      }
    }
    
    if (primitive.min !== undefined && parseFloat(strValue) < parseFloat(primitive.min)) {
      return false;
    }
    
    if (primitive.max !== undefined && parseFloat(strValue) > parseFloat(primitive.max)) {
      return false;
    }
    
    return true;
  }

  static validate(value: any, primitive: Primitive): boolean {
    if (primitive.required && (value === null || value === undefined || value === '')) {
      return false;
    }
    
    if (!primitive.required && (value === null || value === undefined)) {
      return true;
    }
    
    switch (primitive.type) {
      case PrimitiveType.TEXT:
        return this.validateText(value, primitive);
      case PrimitiveType.LONG_TEXT:
        return this.validateLongText(value, primitive);
      case PrimitiveType.NUMBER:
        return this.validateNumber(value, primitive);
      case PrimitiveType.BOOLEAN:
        return this.validateBoolean(value, primitive);
      case PrimitiveType.DATE:
        return this.validateDate(value, primitive);
      case PrimitiveType.JSON:
        return this.validateJson(value, primitive);
      case PrimitiveType.DECIMAL:
        return this.validateDecimal(value, primitive);
      default:
        return false;
    }
  }
}

/**
 * Default values for primitives
 */
export const getDefaultValue = (primitive: Primitive): any => {
  if (primitive.defaultValue !== undefined) {
    return primitive.defaultValue;
  }
  
  switch (primitive.type) {
    case PrimitiveType.TEXT:
    case PrimitiveType.LONG_TEXT:
      return '';
    case PrimitiveType.NUMBER:
      return 0;
    case PrimitiveType.BOOLEAN:
      return false;
    case PrimitiveType.DATE:
      return new Date().toISOString();
    case PrimitiveType.JSON:
      return {};
    case PrimitiveType.DECIMAL:
      return '0.00';
    default:
      return null;
  }
};