/**
 * Custom Hooks for Feature Management (FIXED)
 * Now properly uses FeatureFlagContext instead of bypassing it
 * Story 1.1d - Base Component Structure
 */

import { useMemo } from 'react';
import { useFeatureFlags, useFeatureFlag, useMultipleFeatures } from '@/contexts/feature-flag-context';
import type { FeatureName } from '@/config/features';

/**
 * Hook to check if a feature is enabled
 * FIXED: Now uses context instead of direct localStorage reads
 */
export function useFeature(featureName: FeatureName) {
  return useFeatureFlag(featureName);
}

/**
 * Hook to manage multiple features
 * FIXED: Now uses context and stable dependencies
 */
export function useFeatures(featureNames: FeatureName[]) {
  // Use stable dependency to prevent re-renders
  const stableFeatureNames = useMemo(
    () => featureNames,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(featureNames)]
  );
  
  return useMultipleFeatures(stableFeatureNames);
}

/**
 * Hook to toggle a feature
 * FIXED: Now uses context methods
 */
export function useFeatureToggle(featureName: FeatureName) {
  const { loading, enabled } = useFeatureFlag(featureName);
  const { toggle } = useFeatureFlags();
  
  return {
    mounted: !loading,
    enabled,
    toggle: () => toggle(featureName)
  };
}

/**
 * Hook to check if all layout features are ready
 * FIXED: Uses stable array and context
 */
export function useLayoutReady() {
  const layoutFeatures: FeatureName[] = useMemo(
    () => ['threeColumnLayout', 'catalystBranding', 'glassMorphism', 'animations'],
    []
  );
  
  const { loading, features } = useMultipleFeatures(layoutFeatures);
  
  const isReady = !loading && features.threeColumnLayout;
  const isFullyEnhanced = isReady && 
    features.catalystBranding && 
    features.glassMorphism && 
    features.animations;

  return { 
    mounted: !loading, 
    isReady, 
    isFullyEnhanced, 
    features 
  };
}