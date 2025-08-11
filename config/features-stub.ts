// Temporary stub for gradual migration - remove after Story 2.3
export function isFeatureEnabled(): boolean {
  return true; // All features permanently enabled
}

export function enableFeature(): void {}

export function disableFeature(): void {}

export function clearFeatureCache(): void {}

// Stub types to prevent compilation errors
export type FeatureFlags = Record<string, boolean>;
export type FeatureName = string;