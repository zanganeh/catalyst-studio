import { UniversalValidation } from '../../universal/types';
import { OptimizelyValidation } from '../types';

export class ValidationMapper {
  toUniversal(optimizelyValidation?: OptimizelyValidation): UniversalValidation[] {
    if (!optimizelyValidation) {
      return [];
    }

    const validations: UniversalValidation[] = [];
    
    if (optimizelyValidation.required) {
      validations.push({
        type: 'required',
        value: true,
        message: optimizelyValidation.errorMessage
      });
    }
    
    if (optimizelyValidation.pattern) {
      validations.push({
        type: 'pattern',
        value: optimizelyValidation.pattern,
        message: optimizelyValidation.errorMessage
      });
    }
    
    if (optimizelyValidation.minLength !== undefined) {
      validations.push({
        type: 'min',
        value: optimizelyValidation.minLength,
        message: `Minimum length is ${optimizelyValidation.minLength}`
      });
    }
    
    if (optimizelyValidation.maxLength !== undefined) {
      validations.push({
        type: 'max',
        value: optimizelyValidation.maxLength,
        message: `Maximum length is ${optimizelyValidation.maxLength}`
      });
    }
    
    if (optimizelyValidation.minValue !== undefined) {
      validations.push({
        type: 'min',
        value: optimizelyValidation.minValue,
        message: `Minimum value is ${optimizelyValidation.minValue}`
      });
    }
    
    if (optimizelyValidation.maxValue !== undefined) {
      validations.push({
        type: 'max',
        value: optimizelyValidation.maxValue,
        message: `Maximum value is ${optimizelyValidation.maxValue}`
      });
    }
    
    return validations;
  }

  fromUniversal(universalValidations?: UniversalValidation[]): OptimizelyValidation {
    if (!universalValidations || universalValidations.length === 0) {
      return {};
    }

    const validation: OptimizelyValidation = {};
    
    for (const v of universalValidations) {
      switch (v.type) {
        case 'required':
          validation.required = true;
          if (v.message) validation.errorMessage = v.message;
          break;
        case 'pattern':
          validation.pattern = v.value;
          if (v.message) validation.errorMessage = v.message;
          break;
        case 'min':
          if (typeof v.value === 'number') {
            validation.minValue = v.value;
          } else if (typeof v.value === 'string') {
            validation.minLength = parseInt(v.value, 10);
          }
          break;
        case 'max':
          if (typeof v.value === 'number') {
            validation.maxValue = v.value;
          } else if (typeof v.value === 'string') {
            validation.maxLength = parseInt(v.value, 10);
          }
          break;
      }
    }
    
    return validation;
  }
}