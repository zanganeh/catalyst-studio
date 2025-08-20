/**
 * Primitive Type Loader
 * Dynamically discovers and loads all primitive types from the universal type system
 */

import * as fs from 'fs';
import * as path from 'path';
import { UniversalPrimitiveType } from '@/lib/providers/universal/types';

export interface LoadedPrimitiveType {
  name: string;
  category: string;
  description: string;
  validationRules?: Record<string, any>;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  capabilities: string[];
}

export class PrimitiveTypeLoader {
  private primitiveTypesPath: string;
  private loadedTypes: Map<string, LoadedPrimitiveType> = new Map();

  constructor() {
    // Path to primitive types directory
    this.primitiveTypesPath = path.join(
      process.cwd(),
      'lib/providers/universal/types/primitives'
    );
  }

  /**
   * Load all primitive types using reflection/introspection
   */
  async loadAllPrimitiveTypes(): Promise<LoadedPrimitiveType[]> {
    this.loadedTypes.clear();
    
    try {
      // Get all subdirectories in primitives folder
      const typeDirs = await this.getTypeDirectories();
      
      for (const typeDir of typeDirs) {
        await this.loadTypeFromDirectory(typeDir);
      }
      
      return Array.from(this.loadedTypes.values());
    } catch (error) {
      console.error('Error loading primitive types:', error);
      return [];
    }
  }

  /**
   * Get all type directories
   */
  private async getTypeDirectories(): Promise<string[]> {
    const dirs: string[] = [];
    
    try {
      const entries = await fs.promises.readdir(this.primitiveTypesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'base') {
          dirs.push(entry.name);
        }
      }
    } catch (error) {
      console.error('Error reading primitive types directory:', error);
    }
    
    return dirs;
  }

  /**
   * Load a specific type from its directory
   */
  private async loadTypeFromDirectory(typeName: string): Promise<void> {
    const typePath = path.join(this.primitiveTypesPath, typeName, 'index.ts');
    
    try {
      // Check if index.ts exists
      if (!fs.existsSync(typePath)) {
        return;
      }

      // Import the type module dynamically
      const typeModule = await import(typePath);
      
      // Extract type information
      const typeClass = this.findTypeClass(typeModule);
      if (typeClass) {
        const typeInfo = this.extractTypeInfo(typeName, typeClass);
        this.loadedTypes.set(typeName, typeInfo);
      }
    } catch (error) {
      console.error(`Error loading type ${typeName}:`, error);
    }
  }

  /**
   * Find the main type class in the module
   */
  private findTypeClass(module: any): any {
    // Look for exports that extend UniversalPrimitiveType or have type characteristics
    for (const key in module) {
      const exported = module[key];
      if (typeof exported === 'function' && exported.prototype) {
        // Check if it has type-like properties
        if (this.isTypeClass(exported)) {
          return exported;
        }
      }
    }
    return null;
  }

  /**
   * Check if a class looks like a type class
   */
  private isTypeClass(cls: any): boolean {
    const instance = new cls();
    return instance && (
      typeof instance.validate === 'function' ||
      typeof instance.getName === 'function' ||
      instance.type !== undefined
    );
  }

  /**
   * Extract type information from a type class
   */
  private extractTypeInfo(name: string, typeClass: any): LoadedPrimitiveType {
    const instance = new typeClass();
    
    return {
      name: this.formatTypeName(name),
      category: 'primitive',
      description: this.getTypeDescription(name, instance),
      validationRules: this.extractValidationRules(instance),
      constraints: this.extractConstraints(instance),
      capabilities: this.extractCapabilities(name, instance)
    };
  }

  /**
   * Format type name for display
   */
  private formatTypeName(name: string): string {
    // Convert kebab-case to PascalCase
    return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Get type description
   */
  private getTypeDescription(name: string, instance: any): string {
    const descriptions: Record<string, string> = {
      'text': 'Short text field for titles, names, and brief content',
      'long-text': 'Long text field for rich content and descriptions',
      'number': 'Numeric field for integers and counts',
      'decimal': 'Decimal field for precise numeric values',
      'boolean': 'Boolean field for true/false values',
      'date': 'Date and time field',
      'json': 'JSON field for structured data',
    };
    
    return instance.description || descriptions[name] || `${this.formatTypeName(name)} field`;
  }

  /**
   * Extract validation rules from type instance
   */
  private extractValidationRules(instance: any): Record<string, any> {
    const rules: Record<string, any> = {};
    
    if (instance.validationRules) {
      return instance.validationRules;
    }
    
    // Extract from common patterns
    if (instance.minLength !== undefined) rules.minLength = instance.minLength;
    if (instance.maxLength !== undefined) rules.maxLength = instance.maxLength;
    if (instance.min !== undefined) rules.min = instance.min;
    if (instance.max !== undefined) rules.max = instance.max;
    if (instance.pattern !== undefined) rules.pattern = instance.pattern;
    if (instance.required !== undefined) rules.required = instance.required;
    
    return rules;
  }

  /**
   * Extract constraints from type instance
   */
  private extractConstraints(instance: any): LoadedPrimitiveType['constraints'] {
    return {
      minLength: instance.minLength,
      maxLength: instance.maxLength,
      min: instance.min,
      max: instance.max,
      pattern: instance.pattern
    };
  }

  /**
   * Extract capabilities from type
   */
  private extractCapabilities(name: string, instance: any): string[] {
    const capabilities: string[] = [];
    
    // Add basic capability based on type
    capabilities.push(`stores-${name}`);
    
    // Check for specific capabilities
    if (instance.searchable) capabilities.push('searchable');
    if (instance.sortable) capabilities.push('sortable');
    if (instance.localized) capabilities.push('localized');
    if (instance.multivalue) capabilities.push('multivalue');
    if (instance.richText) capabilities.push('rich-text');
    
    return capabilities;
  }

  /**
   * Format types for prompt injection
   */
  formatForPrompt(): string {
    const types = Array.from(this.loadedTypes.values());
    
    return types.map(type => {
      let formatted = `- ${type.name}: ${type.description}`;
      
      if (type.constraints) {
        const constraints = [];
        if (type.constraints.minLength) constraints.push(`min length: ${type.constraints.minLength}`);
        if (type.constraints.maxLength) constraints.push(`max length: ${type.constraints.maxLength}`);
        if (type.constraints.min) constraints.push(`min: ${type.constraints.min}`);
        if (type.constraints.max) constraints.push(`max: ${type.constraints.max}`);
        
        if (constraints.length > 0) {
          formatted += ` (${constraints.join(', ')})`;
        }
      }
      
      return formatted;
    }).join('\n');
  }

  /**
   * Get types as JSON for structured prompts
   */
  getTypesAsJson(): Record<string, any> {
    const result: Record<string, any> = {};
    
    this.loadedTypes.forEach((type, key) => {
      result[type.name] = {
        description: type.description,
        constraints: type.constraints,
        capabilities: type.capabilities
      };
    });
    
    return result;
  }
}

// Export singleton instance
export const primitiveTypeLoader = new PrimitiveTypeLoader();