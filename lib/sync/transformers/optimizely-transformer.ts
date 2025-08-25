import { ExtractedContentType } from '../extractors/database-extractor';
import { 
  OptimizelyContentType, 
  OptimizelyProperty 
} from '../../providers/optimizely/types';

export interface FieldMapping {
  catalystName: string;
  catalystType: string;
  label: string;
  required: boolean;
}

export interface TransformationResult {
  original: ExtractedContentType;
  transformed: OptimizelyContentType;
  mapping: {
    catalystId: string;
    optimizelyKey: string;
    fieldMappings: FieldMapping[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class OptimizelyTransformer {
  private readonly typeMapping: Record<string, string> = {
    'text': 'String',
    'textarea': 'String', 
    'richtext': 'String',
    'number': 'String',
    'boolean': 'Boolean',
    'date': 'DateTime',
    'datetime': 'DateTime',
    'select': 'String',
    'multiselect': 'String',
    'image': 'String',
    'media': 'String',
    'reference': 'String',
    'relation': 'String',
    'tags': 'String',
    'json': 'String'
  };

  private determineBaseType(category?: 'page' | 'component' | 'folder'): string {
    switch (category) {
      case 'page':
        return '_page';
      case 'component':
        return '_component';
      case 'folder':
        return '_folder';
      default:
        // Default to component if category is not specified (backwards compatibility)
        return '_component';
    }
  }

  transformContentType(catalystContentType: ExtractedContentType): TransformationResult {
    const optimizelyKey = this.generateOptimizelyKey(catalystContentType.name);
    
    const optimizelyContentType: OptimizelyContentType = {
      key: optimizelyKey,
      displayName: catalystContentType.fields?.name || catalystContentType.name || 'Untitled',
      description: catalystContentType.fields?.description || 
                   `Content type imported from Catalyst Studio - ${catalystContentType.id}`,
      baseType: this.determineBaseType(catalystContentType.category),
      source: 'catalyst-studio-sync',
      sortOrder: 100,
      mayContainTypes: [],
      properties: this.transformProperties(catalystContentType.fields?.fields || [])
    };

    return {
      original: catalystContentType,
      transformed: optimizelyContentType,
      mapping: {
        catalystId: catalystContentType.id,
        optimizelyKey: optimizelyKey,
        fieldMappings: this.createFieldMappings(catalystContentType.fields?.fields || [])
      }
    };
  }

  private generateOptimizelyKey(name: string): string {
    if (!name) return 'UntitledType';
    
    let key = name
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^[0-9]/, 'Type$&');
    
    if (!/^[A-Za-z]/.test(key)) {
      key = 'Type' + key;
    }
    
    if (key.length < 2) {
      key = 'Type' + key;
    }
    
    return key.substring(0, 255);
  }

  private transformProperties(fields: any[]): Record<string, OptimizelyProperty> {
    const properties: Record<string, OptimizelyProperty> = {};
    
    fields.forEach((field) => {
      const propKey = this.generatePropertyKey(field.name || field.id);
      const fieldType = field.type || 'text';
      const optimizelyType = this.typeMapping[fieldType] || 'String';
      
      properties[propKey] = {
        type: optimizelyType,
        displayName: field.label || field.name || propKey,
        required: field.required || false
      };
      
      if (field.description || field.help) {
        properties[propKey].description = field.description || field.help;
      }
    });
    
    if (Object.keys(properties).length === 0) {
      properties['title'] = {
        type: 'String',
        displayName: 'Title',
        required: false
      };
    }
    
    return properties;
  }
  
  private generatePropertyKey(name: string): string {
    if (!name) return 'field';
    
    let key = name
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^[0-9]/, 'field$&');
    
    if (key && /^[A-Z]/.test(key)) {
      key = key.charAt(0).toLowerCase() + key.slice(1);
    }
    
    return key || 'field';
  }

  private getFieldMapping(fields?: any[]): FieldMapping[] {
    const mapping: FieldMapping[] = [];
    fields?.forEach(field => {
      mapping.push({
        catalystName: field.name || field.id,
        catalystType: field.type,
        label: field.label || field.name,
        required: field.required || false
      });
    });
    return mapping;
  }

  private createFieldMappings(fields: any[]): FieldMapping[] {
    return this.getFieldMapping(fields);
  }

  transformBatch(catalystContentTypes: ExtractedContentType[]): TransformationResult[] {
    return catalystContentTypes.map(ct => this.transformContentType(ct));
  }

  validateTransformation(transformedType: TransformationResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!transformedType.transformed.key) {
      errors.push('Missing required field: key');
    }
    
    if (!transformedType.transformed.displayName) {
      errors.push('Missing required field: displayName');
    }
    
    if (!transformedType.transformed.baseType) {
      errors.push('Missing required field: baseType');
    }
    
    const keyPattern = /^[A-Za-z][_0-9A-Za-z]*$/;
    if (!keyPattern.test(transformedType.transformed.key)) {
      errors.push(`Invalid key format: ${transformedType.transformed.key}`);
    }
    
    if (!transformedType.transformed.properties || Object.keys(transformedType.transformed.properties).length === 0) {
      warnings.push('No properties defined for content type');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}