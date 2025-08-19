// Universal Type System Definitions

/**
 * Type metadata for AI tracking and generation history
 */
export interface TypeMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  aiGenerated?: boolean;
  aiModel?: string;
  aiPrompt?: string;
  version?: string;
  tags?: string[];
}

/**
 * Content type classification
 */
export type ContentTypeClassification = 'page' | 'component';

/**
 * Field layer classification in the three-layer system
 */
export type FieldLayer = 'primitive' | 'common' | 'extension';

/**
 * Field types across all layers
 */
export type FieldType = 
  // Layer 1: Primitives
  | 'text' 
  | 'longText' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'json' 
  | 'decimal'
  // Layer 2: Common Patterns
  | 'richText' 
  | 'media' 
  | 'collection' 
  | 'component' 
  | 'select' 
  | 'repeater' 
  | 'slug' 
  | 'tags'
  // Layer 3: Extensions (platform-specific, added dynamically)
  | string;

/**
 * Field validation rules
 */
export interface UniversalValidation {
  type: 'required' | 'min' | 'max' | 'pattern' | 'unique' | 'custom';
  value?: any;
  message?: string;
  code?: string;
}

/**
 * Fallback strategy for missing field support
 */
export type FallbackStrategy = 
  | 'ignore'           // Skip the field
  | 'text'            // Convert to text
  | 'json'            // Store as JSON
  | 'custom';         // Platform-specific handling

/**
 * Universal field definition
 */
export interface UniversalField {
  id: string;
  name: string;
  layer: FieldLayer;
  type: FieldType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  validations?: UniversalValidation[];
  fallbackStrategy?: FallbackStrategy;
  platformSpecific?: Record<string, any>;
  metadata?: TypeMetadata;
}

/**
 * Universal content type definition
 */
export interface UniversalContentType {
  version: string;
  id: string;
  name: string;
  type: ContentTypeClassification;
  description?: string;
  isRoutable: boolean;
  fields: UniversalField[];
  metadata: TypeMetadata;
  validations?: UniversalValidation[];
  platformSpecific?: Record<string, any>;
}