import { UniversalContentType, UniversalField, ContentTypeClassification } from '../../universal/types';
import { OptimizelyContentType, OptimizelyProperty } from '../types';
import { FieldMapper } from './field-mapper';
import { ValidationMapper } from './validation-mapper';

export class TypeMapper {
  private fieldMapper: FieldMapper;
  private validationMapper: ValidationMapper;

  constructor() {
    this.fieldMapper = new FieldMapper();
    this.validationMapper = new ValidationMapper();
  }

  toUniversal(optimizelyType: OptimizelyContentType): UniversalContentType {
    const fields: UniversalField[] = [];
    
    // Convert Record<string, OptimizelyProperty> to UniversalField[]
    for (const [key, property] of Object.entries(optimizelyType.properties)) {
      fields.push(this.fieldMapper.toUniversal(key, property));
    }
    
    const type = this.mapClassification(optimizelyType.baseType);
    
    return {
      version: '1.0',
      id: optimizelyType.key,
      name: optimizelyType.key,
      type,
      description: optimizelyType.description,
      isRoutable: type === 'page',
      fields,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1',
        platformSpecific: {
          displayName: optimizelyType.displayName,
          sortOrder: optimizelyType.sortOrder,
          mayContainTypes: optimizelyType.mayContainTypes
        }
      },
      validations: []
    };
  }

  fromUniversal(universalType: UniversalContentType): OptimizelyContentType {
    const properties: Record<string, OptimizelyProperty> = {};
    
    // Convert UniversalField[] to Record<string, OptimizelyProperty>
    for (const field of universalType.fields) {
      const property = this.fieldMapper.fromUniversal(field);
      properties[field.name] = property;
    }
    
    const platformSpecific = universalType.metadata?.platformSpecific as any;
    
    return {
      key: universalType.id,
      displayName: platformSpecific?.displayName || universalType.name,
      description: universalType.description || '',
      baseType: this.mapToOptimizelyBaseType(universalType.type),
      source: 'catalyst-studio-sync',
      sortOrder: platformSpecific?.sortOrder || 100,
      mayContainTypes: platformSpecific?.mayContainTypes || [],
      properties
    };
  }

  private mapClassification(baseType: string): ContentTypeClassification {
    if (baseType.includes('page') || baseType.includes('Page') || baseType === '_page') {
      return 'page';
    } else {
      return 'component';
    }
  }

  private mapToOptimizelyBaseType(classification: ContentTypeClassification): string {
    switch (classification) {
      case 'page':
        return '_page';
      case 'component':
      default:
        return '_component';
    }
  }
}