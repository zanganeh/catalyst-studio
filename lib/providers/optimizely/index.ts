// Original Optimizely Provider exports
export { OptimizelyProvider } from './OptimizelyProvider';
export type { 
  OptimizelyContentType,
  OptimizelyContentTypeResponse,
  OptimizelyProperty,
  OptimizelyValidation,
  OptimizelyResponse,
  OptimizelyError
} from './types';

// New Type System exports
export {
  OptimizelyTypeProvider,
  createOptimizelyProvider
} from './type-provider';

// Re-export extensions for convenience
export { default as optimizelyExtensions } from './type-extensions';