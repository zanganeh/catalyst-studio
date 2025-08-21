/**
 * Primitive Type Loader
 * Loads all primitive types from the universal type system
 */
import { TypeLoadingError, ErrorLogger } from './utils/errors';

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
  private loadedTypes: Map<string, LoadedPrimitiveType> = new Map();

  constructor() {
    // No filesystem paths needed - using static imports
  }

  /**
   * Load all primitive types using reflection/introspection
   */
  async loadAllPrimitiveTypes(): Promise<LoadedPrimitiveType[]> {
    this.loadedTypes.clear();
    
    try {
      // Get all subdirectories in primitives folder
      const typeDirs = await this.getTypeDirectories();
      
      // Load all types in parallel for better performance
      const loadPromises = typeDirs.map(typeDir => this.loadTypeFromDirectory(typeDir));
      await Promise.all(loadPromises);
      
      return Array.from(this.loadedTypes.values());
    } catch (error) {
      ErrorLogger.log(error as Error, { 
        context: 'loadAllPrimitiveTypes'
      });
      // Return cached types if available
      if (this.loadedTypes.size > 0) {
        return Array.from(this.loadedTypes.values());
      }
      throw new TypeLoadingError('Failed to load primitive types', error as Error);
    }
  }

  /**
   * Get all type directories (using a static list for Next.js compatibility)
   */
  private async getTypeDirectories(): Promise<string[]> {
    // Return a static list of known primitive types
    // This avoids filesystem operations which don't work in Next.js runtime
    return [
      'text',
      'long-text', 
      'number',
      'decimal',
      'boolean',
      'date',
      'json'
    ];
  }

  /**
   * Load a specific type from its directory
   */
  private async loadTypeFromDirectory(typeName: string): Promise<void> {
    try {
      // Use static imports with a switch statement for known types
      let typeModule: { [key: string]: any };
      
      switch(typeName) {
        case 'text':
          typeModule = await import('@/lib/providers/universal/types/primitives/text');
          break;
        case 'long-text':
          typeModule = await import('@/lib/providers/universal/types/primitives/long-text');
          break;
        case 'number':
          typeModule = await import('@/lib/providers/universal/types/primitives/number');
          break;
        case 'decimal':
          typeModule = await import('@/lib/providers/universal/types/primitives/decimal');
          break;
        case 'boolean':
          typeModule = await import('@/lib/providers/universal/types/primitives/boolean');
          break;
        case 'date':
          typeModule = await import('@/lib/providers/universal/types/primitives/date');
          break;
        case 'json':
          typeModule = await import('@/lib/providers/universal/types/primitives/json');
          break;
        default:
          return;
      }
      
      // Extract type information
      const typeClass = this.findTypeClass(typeModule);
      if (typeClass) {
        const typeInfo = this.extractTypeInfo(typeName, typeClass);
        this.loadedTypes.set(typeName, typeInfo);
      }
    } catch (error) {
      ErrorLogger.log(error as Error, { 
        context: 'loadTypeFromDirectory',
        typeName 
      });
      // Don't throw here to allow other types to load
    }
  }

  /**
   * Find the main type class in the module
   */
  private findTypeClass(module: { [key: string]: any }): any {
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
  private isTypeClass(cls: new () => any): boolean {
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
  private extractTypeInfo(name: string, typeClass: new () => any): LoadedPrimitiveType {
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
  private getTypeDescription(name: string, instance: { description?: string }): string {
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
  private extractValidationRules(instance: {
    validationRules?: Record<string, any>;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  }): Record<string, any> {
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
  private extractConstraints(instance: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  }): LoadedPrimitiveType['constraints'] {
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
  private extractCapabilities(name: string, instance: {
    searchable?: boolean;
    sortable?: boolean;
    localized?: boolean;
    multivalue?: boolean;
    richText?: boolean;
  }): string[] {
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