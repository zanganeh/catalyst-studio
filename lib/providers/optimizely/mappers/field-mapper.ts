import { UniversalField, FieldLayer, UniversalValidation } from '../../universal/types';
import { OptimizelyProperty } from '../types';
import { ValidationMapper } from './validation-mapper';

export class FieldMapper {
  private validationMapper: ValidationMapper;

  constructor() {
    this.validationMapper = new ValidationMapper();
  }

  toUniversal(propertyKey: string, optimizelyProperty: OptimizelyProperty): UniversalField {
    const layer = this.classifyFieldLayer(optimizelyProperty.type);
    
    const validations: UniversalValidation[] = [];
    if (optimizelyProperty.required) {
      validations.push({
        type: 'required',
        message: `${propertyKey} is required`
      });
    }
    
    return {
      id: `field_${propertyKey}`,
      name: propertyKey,
      layer,
      type: this.mapFieldType(optimizelyProperty.type) as any,
      description: optimizelyProperty.description,
      required: optimizelyProperty.required,
      defaultValue: undefined,
      validations,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      },
      platformSpecific: {
        displayName: optimizelyProperty.displayName,
        originalType: optimizelyProperty.type
      }
    };
  }

  fromUniversal(universalField: UniversalField): OptimizelyProperty {
    const optimizelyType = this.mapToOptimizelyType(universalField.type);
    const displayName = universalField.platformSpecific?.displayName || universalField.name;
    const required = universalField.required || false;
    
    return {
      type: optimizelyType,
      displayName,
      required,
      description: universalField.description
    };
  }

  private classifyFieldLayer(optimizelyType: string): FieldLayer {
    const primitiveTypes = ['String', 'Number', 'Boolean', 'Integer', 'Float'];
    const commonTypes = ['DateTime', 'Url', 'XhtmlString', 'ContentReference', 'ContentArea'];
    
    if (primitiveTypes.includes(optimizelyType)) {
      return 'primitive';
    } else if (commonTypes.includes(optimizelyType)) {
      return 'common';
    } else {
      return 'extension';
    }
  }

  private mapFieldType(optimizelyType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Number': 'number',
      'Integer': 'number',
      'Float': 'number',
      'Boolean': 'boolean',
      'DateTime': 'date',
      'Url': 'url',
      'XhtmlString': 'richText',
      'ContentReference': 'reference',
      'ContentArea': 'array',
      'Image': 'media',
      'Media': 'media',
      'SelectOne': 'select',
      'SelectMany': 'multiselect'
    };
    
    return typeMap[optimizelyType] || 'string';
  }

  private mapToOptimizelyType(universalType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'url': 'Url',
      'richText': 'XhtmlString',
      'reference': 'ContentReference',
      'array': 'ContentArea',
      'media': 'Media',
      'select': 'SelectOne',
      'multiselect': 'SelectMany',
      'object': 'PropertyBlock'
    };
    
    return typeMap[universalType] || 'String';
  }

}