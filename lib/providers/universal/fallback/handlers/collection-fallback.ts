/**
 * Collection Fallback Handler
 * Handles conversion of collection types to fallback formats
 */

import { PrimitiveType, JsonPrimitive } from '../../types/primitives';
import { CollectionPattern } from '../../types/common-patterns';

/**
 * Collection fallback result
 */
export interface CollectionFallbackResult {
  data: any;
  format: 'array' | 'json' | 'flattened';
  metadata: {
    itemCount: number;
    itemType?: string;
    preservedConstraints: string[];
    lostConstraints: string[];
    truncated: boolean;
  };
  confidence: number;
}

/**
 * Collection fallback handler
 */
export class CollectionFallbackHandler {
  /**
   * Convert collection to JSON array
   */
  static toJsonArray(value: any, pattern: CollectionPattern): CollectionFallbackResult {
    let array: any[] = [];
    const preservedConstraints: string[] = [];
    const lostConstraints: string[] = [];
    let truncated = false;

    // Normalize to array
    if (Array.isArray(value)) {
      array = value;
    } else if (value && typeof value === 'object') {
      // Try to extract array from object
      if (value.items) array = value.items;
      else if (value.data) array = value.data;
      else if (value.values) array = value.values;
      else array = [value]; // Single item collection
    } else if (value !== null && value !== undefined) {
      array = [value];
    }

    // Apply constraints
    if (pattern.minItems && array.length < pattern.minItems) {
      lostConstraints.push(`Minimum items (${pattern.minItems}) not met`);
    } else if (pattern.minItems) {
      preservedConstraints.push('minItems');
    }

    if (pattern.maxItems && array.length > pattern.maxItems) {
      array = array.slice(0, pattern.maxItems);
      truncated = true;
      preservedConstraints.push('maxItems');
    } else if (pattern.maxItems) {
      preservedConstraints.push('maxItems');
    }

    if (pattern.uniqueItems) {
      const unique = this.makeUnique(array);
      if (unique.length < array.length) {
        lostConstraints.push('Duplicate items removed');
        array = unique;
      }
      preservedConstraints.push('uniqueItems');
    }

    if (pattern.sortable) {
      lostConstraints.push('Sortable UI feature');
    }

    return {
      data: array,
      format: 'array',
      metadata: {
        itemCount: array.length,
        itemType: this.getItemTypeName(pattern.itemType),
        preservedConstraints,
        lostConstraints,
        truncated
      },
      confidence: lostConstraints.length === 0 ? 95 : 80
    };
  }

  /**
   * Preserve item type preservation
   */
  static preserveItemTypes(value: any, pattern: CollectionPattern): CollectionFallbackResult {
    const result = this.toJsonArray(value, pattern);
    
    // Add type information to each item
    const typedArray = result.data.map((item: any) => {
      if (typeof item === 'object' && item !== null && !item._type) {
        return {
          ...item,
          _type: this.getItemTypeName(pattern.itemType),
          _index: result.data.indexOf(item)
        };
      }
      return item;
    });

    return {
      ...result,
      data: {
        _collection: true,
        _itemType: this.getItemTypeName(pattern.itemType),
        _constraints: {
          minItems: pattern.minItems,
          maxItems: pattern.maxItems,
          uniqueItems: pattern.uniqueItems
        },
        items: typedArray
      },
      format: 'json',
      confidence: 90
    };
  }

  /**
   * Flatten collection to simple array
   */
  static flatten(value: any, pattern: CollectionPattern): CollectionFallbackResult {
    const result = this.toJsonArray(value, pattern);
    
    // Flatten complex items
    const flattened = result.data.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        // Convert objects to string representation
        return JSON.stringify(item);
      }
      return item;
    });

    return {
      data: flattened,
      format: 'flattened',
      metadata: {
        ...result.metadata,
        lostConstraints: [
          ...result.metadata.lostConstraints,
          'Complex item structure'
        ]
      },
      confidence: 60
    };
  }

  /**
   * Handle ordering maintenance
   */
  static preserveOrdering(value: any, pattern: CollectionPattern): any {
    const result = this.toJsonArray(value, pattern);
    
    // Add order metadata
    const orderedData = result.data.map((item: any, index: number) => {
      if (typeof item === 'object' && item !== null) {
        return {
          ...item,
          _order: index,
          _originalIndex: index
        };
      }
      return {
        _value: item,
        _order: index,
        _originalIndex: index
      };
    });

    return {
      _type: 'ordered_collection',
      _sortable: pattern.sortable || false,
      items: orderedData
    };
  }

  /**
   * Private helper methods
   */

  private static makeUnique(array: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    array.forEach(item => {
      const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    return unique;
  }

  private static getItemTypeName(itemType: any): string {
    if (!itemType) return 'unknown';
    
    if (typeof itemType === 'object') {
      if ('type' in itemType) {
        return itemType.type;
      } else if ('pattern' in itemType) {
        return itemType.pattern;
      }
    }
    
    return String(itemType);
  }

  /**
   * Validate collection constraints
   */
  static validateConstraints(
    array: any[],
    pattern: CollectionPattern
  ): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (pattern.minItems && array.length < pattern.minItems) {
      violations.push(`Array has ${array.length} items, minimum is ${pattern.minItems}`);
    }

    if (pattern.maxItems && array.length > pattern.maxItems) {
      violations.push(`Array has ${array.length} items, maximum is ${pattern.maxItems}`);
    }

    if (pattern.uniqueItems) {
      const unique = this.makeUnique(array);
      if (unique.length < array.length) {
        violations.push(`Array contains ${array.length - unique.length} duplicate items`);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Transform collection items
   */
  static transformItems(
    array: any[],
    transformer: (item: any) => any
  ): any[] {
    return array.map(transformer);
  }

  /**
   * Group collection items by type
   */
  static groupByType(array: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    array.forEach(item => {
      let type = 'unknown';
      
      if (item === null) {
        type = 'null';
      } else if (item === undefined) {
        type = 'undefined';
      } else if (typeof item === 'object') {
        type = item.type || item._type || 'object';
      } else {
        type = typeof item;
      }

      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
    });

    return groups;
  }
}