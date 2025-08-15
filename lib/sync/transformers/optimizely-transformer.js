export class OptimizelyTransformer {
  constructor() {
    this.baseType = '_component'; // Valid base type for Optimizely
    
    // Type mapping from Catalyst to Optimizely
    this.typeMapping = {
      'text': 'String',
      'textarea': 'String', 
      'richtext': 'String',
      'number': 'String', // No number type in Optimizely, use String
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
  }

  transformContentType(catalystContentType) {
    const optimizelyKey = this.generateOptimizelyKey(catalystContentType.name);
    
    const optimizelyContentType = {
      key: optimizelyKey,
      displayName: catalystContentType.fields?.name || catalystContentType.name || 'Untitled',
      description: catalystContentType.fields?.description || 
                   `Content type imported from Catalyst Studio - ${catalystContentType.id}`,
      baseType: this.baseType,
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

  generateOptimizelyKey(name) {
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

  transformProperties(fields) {
    const properties = {};
    
    fields.forEach((field) => {
      const propKey = this.generatePropertyKey(field.name || field.id);
      const fieldType = field.type || 'text';
      const optimizelyType = this.typeMapping[fieldType] || 'String';
      
      properties[propKey] = {
        type: optimizelyType,
        displayName: field.label || field.name || propKey,
        required: field.required || false
      };
      
      // Add description if available
      if (field.description || field.help) {
        properties[propKey].description = field.description || field.help;
      }
    });
    
    // Ensure at least one property exists
    if (Object.keys(properties).length === 0) {
      properties['title'] = {
        type: 'String',
        displayName: 'Title',
        required: false
      };
    }
    
    return properties;
  }
  
  generatePropertyKey(name) {
    if (!name) return 'field';
    
    // Convert to camelCase and remove invalid characters
    let key = name
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^[0-9]/, 'field$&');
    
    // Ensure it starts with lowercase
    if (key && /^[A-Z]/.test(key)) {
      key = key.charAt(0).toLowerCase() + key.slice(1);
    }
    
    return key || 'field';
  }

  // Field mapping for future use when properties can be added
  getFieldMapping(fields) {
    const mapping = [];
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

  createFieldMappings(fields) {
    // Store field mappings for future property creation
    return this.getFieldMapping(fields);
  }

  transformBatch(catalystContentTypes) {
    return catalystContentTypes.map(ct => this.transformContentType(ct));
  }

  validateTransformation(transformedType) {
    const errors = [];
    const warnings = [];
    
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
    
    // Check if properties are defined
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