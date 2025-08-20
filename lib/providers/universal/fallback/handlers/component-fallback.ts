/**
 * Component Fallback Handler
 * Handles conversion of component types to fallback formats
 */

import { PrimitiveType, JsonPrimitive } from '../../types/primitives';
import { ComponentPattern } from '../../types/common-patterns';

/**
 * Component fallback result
 */
export interface ComponentFallbackResult {
  data: any;
  format: 'json' | 'flattened' | 'reference';
  metadata: {
    componentType?: string;
    nestedDepth: number;
    preservedStructure: boolean;
    lostFeatures: string[];
  };
  confidence: number;
}

/**
 * Component structure
 */
export interface ComponentStructure {
  type: string;
  id?: string;
  fields: Record<string, any>;
  children?: ComponentStructure[];
  metadata?: Record<string, any>;
}

/**
 * Component fallback handler
 */
export class ComponentFallbackHandler {
  /**
   * Convert component to JSON structure
   */
  static toJson(value: any, pattern: ComponentPattern): ComponentFallbackResult {
    const structure = this.normalizeComponent(value, pattern);
    const depth = this.calculateDepth(structure);
    const lostFeatures: string[] = [];

    // Check for lost features based on pattern
    if (pattern.allowedComponents && pattern.allowedComponents.length > 0) {
      lostFeatures.push('component type validation');
    }
    
    if (!pattern.inline) {
      lostFeatures.push('component referencing');
    }

    return {
      data: structure,
      format: 'json',
      metadata: {
        componentType: pattern.componentType || structure.type,
        nestedDepth: depth,
        preservedStructure: true,
        lostFeatures
      },
      confidence: 90
    };
  }

  /**
   * Flatten nested component structure
   */
  static flatten(value: any, pattern: ComponentPattern): ComponentFallbackResult {
    const flattened = this.flattenComponent(value);
    const originalDepth = this.calculateDepth(this.normalizeComponent(value, pattern));
    
    return {
      data: flattened,
      format: 'flattened',
      metadata: {
        componentType: pattern.componentType,
        nestedDepth: 1,
        preservedStructure: false,
        lostFeatures: [
          'nested structure',
          'component hierarchy',
          'parent-child relationships'
        ]
      },
      confidence: 60
    };
  }

  /**
   * Convert to reference format
   */
  static toReference(value: any, pattern: ComponentPattern): ComponentFallbackResult {
    const references = this.extractReferences(value, pattern);
    
    return {
      data: {
        _type: 'component_reference',
        _refs: references,
        _inline: pattern.inline ? this.normalizeComponent(value, pattern) : null
      },
      format: 'reference',
      metadata: {
        componentType: pattern.componentType,
        nestedDepth: 0,
        preservedStructure: false,
        lostFeatures: pattern.inline ? [] : ['inline content']
      },
      confidence: 75
    };
  }

  /**
   * Private helper methods
   */

  private static normalizeComponent(value: any, pattern: ComponentPattern): ComponentStructure {
    if (!value || typeof value !== 'object') {
      return {
        type: pattern.componentType || 'unknown',
        fields: {}
      };
    }

    const structure: ComponentStructure = {
      type: value.type || value._type || value.componentType || pattern.componentType || 'component',
      fields: {}
    };

    // Extract ID if present
    if (value.id || value._id || value.uuid) {
      structure.id = value.id || value._id || value.uuid;
    }

    // Extract fields
    const reservedKeys = new Set(['type', '_type', 'componentType', 'id', '_id', 'uuid', 
                                  'children', '_children', 'components', 'metadata', '_metadata']);
    
    Object.keys(value).forEach(key => {
      if (!reservedKeys.has(key)) {
        structure.fields[key] = value[key];
      }
    });

    // Handle children/nested components
    const children = value.children || value._children || value.components;
    if (children) {
      if (Array.isArray(children)) {
        structure.children = children.map(child => 
          this.normalizeComponent(child, pattern)
        );
      } else {
        structure.children = [this.normalizeComponent(children, pattern)];
      }
    }

    // Preserve metadata
    if (value.metadata || value._metadata) {
      structure.metadata = value.metadata || value._metadata;
    }

    // Apply schema if provided
    if (pattern.componentSchema) {
      structure.metadata = {
        ...structure.metadata,
        schema: pattern.componentSchema
      };
    }

    return structure;
  }

  private static flattenComponent(value: any): any {
    const flattened: any = {
      _type: 'flattened_component',
      _fields: []
    };

    const flatten = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') {
        if (prefix) {
          flattened._fields.push({
            path: prefix,
            value: obj
          });
        }
        return;
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          flatten(item, prefix ? `${prefix}[${index}]` : `[${index}]`);
        });
      } else {
        Object.keys(obj).forEach(key => {
          const path = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];
          
          if (typeof value === 'object' && value !== null) {
            flatten(value, path);
          } else {
            flattened._fields.push({ path, value });
          }
        });
      }
    };

    flatten(value);
    return flattened;
  }

  private static calculateDepth(structure: ComponentStructure): number {
    if (!structure.children || structure.children.length === 0) {
      return 1;
    }

    const childDepths = structure.children.map(child => this.calculateDepth(child));
    return 1 + Math.max(...childDepths);
  }

  private static extractReferences(value: any, pattern: ComponentPattern): any[] {
    const references: any[] = [];
    const seen = new Set<string>();

    const extract = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      // Check for reference patterns
      const id = obj.id || obj._id || obj.ref || obj._ref || obj.uuid;
      if (id && !seen.has(id)) {
        seen.add(id);
        references.push({
          id,
          type: obj.type || obj._type || pattern.componentType,
          path: obj.path || obj._path
        });
      }

      // Recursively extract from children
      if (Array.isArray(obj)) {
        obj.forEach(extract);
      } else {
        Object.values(obj).forEach(val => {
          if (typeof val === 'object') {
            extract(val);
          }
        });
      }
    };

    extract(value);
    return references;
  }

  /**
   * Validate component against schema
   */
  static validateAgainstSchema(
    component: ComponentStructure,
    schema: object
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // This would implement JSON Schema validation
    // For now, returning a simple check
    if (!component.type) {
      errors.push('Component type is required');
    }
    
    if (!component.fields || Object.keys(component.fields).length === 0) {
      errors.push('Component must have fields');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge component metadata
   */
  static mergeMetadata(
    component: ComponentStructure,
    additionalMetadata: Record<string, any>
  ): ComponentStructure {
    return {
      ...component,
      metadata: {
        ...component.metadata,
        ...additionalMetadata,
        mergedAt: new Date().toISOString()
      }
    };
  }
}