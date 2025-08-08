/**
 * Custom Hooks for Feature Management
 * Story 1.1d - Base Component Structure
 */

import { useState, useEffect } from 'react';
import { isFeatureEnabled, enableFeature, disableFeature, type FeatureName } from '@/config/features';

/**
 * Hook to check if a feature is enabled
 * Handles client-side hydration properly
 */
export function useFeature(featureName: FeatureName) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isFeatureEnabled(featureName));
  }, [featureName]);

  return { mounted, enabled };
}

/**
 * Hook to manage multiple features
 * Returns state for all specified features
 */
export function useFeatures(featureNames: FeatureName[]) {
  const [mounted, setMounted] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    const featureStates: Record<string, boolean> = {};
    featureNames.forEach(name => {
      featureStates[name] = isFeatureEnabled(name);
    });
    setFeatures(featureStates);
  }, [featureNames.join(',')]);

  return { mounted, features };
}

/**
 * Hook to toggle a feature
 * Returns current state and toggle function
 */
export function useFeatureToggle(featureName: FeatureName) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isFeatureEnabled(featureName));
  }, [featureName]);

  const toggle = () => {
    if (enabled) {
      disableFeature(featureName);
      setEnabled(false);
    } else {
      enableFeature(featureName);
      setEnabled(true);
    }
  };

  return { mounted, enabled, toggle };
}

/**
 * Hook to check if all layout features are ready
 */
export function useLayoutReady() {
  const { mounted, features } = useFeatures([
    'threeColumnLayout',
    'catalystBranding',
    'glassMorphism',
    'animations'
  ]);

  const isReady = mounted && features.threeColumnLayout;
  const isFullyEnhanced = isReady && 
    features.catalystBranding && 
    features.glassMorphism && 
    features.animations;

  return { mounted, isReady, isFullyEnhanced, features };
}