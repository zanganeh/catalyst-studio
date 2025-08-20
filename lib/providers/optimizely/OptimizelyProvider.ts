import { 
  ICMSProvider, 
  UniversalContentType, 
  ValidationResult,
  ProviderCapabilities 
} from '../types';
import { OptimizelyClient } from './client';
import { TypeMapper } from './mappers/type-mapper';
import { 
  OptimizelyContentType,
  OptimizelyConnectionError,
  OptimizelyValidationError,
  OptimizelyTransformationError
} from './types';

export class OptimizelyProvider implements ICMSProvider {
  private client: OptimizelyClient;
  private typeMapper: TypeMapper;
  private dryRun: boolean = false;

  constructor() {
    this.client = new OptimizelyClient();
    this.typeMapper = new TypeMapper();
  }

  setDryRun(enabled: boolean): void {
    this.dryRun = enabled;
    this.client.setDryRun(enabled);
  }

  async getContentTypes(): Promise<UniversalContentType[]> {
    try {
      const optimizelyTypes = await this.client.getContentTypes();
      return optimizelyTypes.map(type => this.mapToUniversal(type));
    } catch (error) {
      throw new OptimizelyConnectionError(
        `Failed to fetch content types: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getContentType(id: string): Promise<UniversalContentType | null> {
    try {
      const optimizelyType = await this.client.getContentType(id);
      if (!optimizelyType) {
        return null;
      }
      return this.mapToUniversal(optimizelyType);
    } catch (error) {
      throw new OptimizelyConnectionError(
        `Failed to fetch content type ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createContentType(type: UniversalContentType): Promise<UniversalContentType> {
    try {
      const optimizelyType = this.mapFromUniversal(type);
      const createdType = await this.client.createContentType(optimizelyType);
      return this.mapToUniversal(createdType);
    } catch (error) {
      throw new OptimizelyConnectionError(
        `Failed to create content type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async updateContentType(id: string, type: UniversalContentType): Promise<UniversalContentType> {
    try {
      const optimizelyType = this.mapFromUniversal(type);
      const updatedType = await this.client.updateContentType(id, optimizelyType);
      return this.mapToUniversal(updatedType);
    } catch (error) {
      throw new OptimizelyConnectionError(
        `Failed to update content type ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deleteContentType(id: string): Promise<boolean> {
    try {
      return await this.client.deleteContentType(id);
    } catch (error) {
      throw new OptimizelyConnectionError(
        `Failed to delete content type ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async validateContentType(type: UniversalContentType): Promise<ValidationResult> {
    try {
      const optimizelyType = this.mapFromUniversal(type);
      const validationResult = await this.client.validateContentType(optimizelyType);
      
      const errors = validationResult.errors?.map(err => ({
        field: 'general',
        message: err,
        code: 'VALIDATION_ERROR'
      })) || [];
      
      const warnings = validationResult.warnings?.map(warn => ({
        field: 'general',
        message: warn
      })) || [];
      
      return {
        valid: validationResult.isValid,
        errors,
        warnings
      };
    } catch (error) {
      throw new OptimizelyValidationError(
        `Failed to validate content type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getProviderCapabilities(): ProviderCapabilities {
    return {
      supportsComponents: true,
      supportsPages: true,
      supportsRichText: true,
      supportsMedia: true,
      supportsReferences: true,
      supportsLocalizations: true,
      supportsVersioning: true,
      supportsScheduling: true,
      supportsWebhooks: false,
      customCapabilities: {
        supportsContentVersioning: true,
        supportsScheduledPublishing: true,
        supportsContentApproval: true,
        supportsPreview: true
      }
    };
  }

  mapToUniversal(nativeType: OptimizelyContentType): UniversalContentType {
    try {
      return this.typeMapper.toUniversal(nativeType);
    } catch (error) {
      throw new OptimizelyTransformationError(
        `Failed to map Optimizely type to universal format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  mapFromUniversal(universalType: UniversalContentType): OptimizelyContentType {
    try {
      return this.typeMapper.fromUniversal(universalType);
    } catch (error) {
      throw new OptimizelyTransformationError(
        `Failed to map universal type to Optimizely format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}