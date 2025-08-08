'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isFeatureEnabled, enableFeature, disableFeature, type FeatureName, type FeatureFlags } from '@/config/features';

/**
 * Feature Flag Context
 * Centralizes feature flag management to eliminate duplication
 * PERFORMANCE: Single source of truth for all components
 */

interface FeatureFlagContextType {
  features: Partial<FeatureFlags>;
  mounted: boolean;
  isEnabled: (featureName: FeatureName) => boolean;
  toggle: (featureName: FeatureName) => void;
  enable: (featureName: FeatureName) => void;
  disable: (featureName: FeatureName) => void;
  refresh: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

/**
 * Feature Flag Provider Component
 * Provides centralized feature flag state to entire app
 */
export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [features, setFeatures] = useState<Partial<FeatureFlags>>({});

  // Load initial state
  const loadFeatures = () => {
    const featureState: Partial<FeatureFlags> = {};
    const featureNames: FeatureName[] = [
      'threeColumnLayout',
      'catalystBranding', 
      'glassMorphism',
      'animations',
      'enhancedChat',
      'contentBuilder',
      'previewSystem',
      'projectPersistence',
      'cmsIntegration',
      'analyticsDisplay',
      'sourceCodeView',
      'debugMode',
      'performanceLogging',
      'errorReporting'
    ];

    featureNames.forEach(name => {
      featureState[name] = isFeatureEnabled(name);
    });

    setFeatures(featureState);
  };

  useEffect(() => {
    setMounted(true);
    loadFeatures();

    // Listen for storage events (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'featureFlags') {
        loadFeatures();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isEnabled = (featureName: FeatureName): boolean => {
    return features[featureName] ?? false;
  };

  const toggle = (featureName: FeatureName) => {
    if (features[featureName]) {
      disable(featureName);
    } else {
      enable(featureName);
    }
  };

  const enable = (featureName: FeatureName) => {
    enableFeature(featureName);
    setFeatures(prev => ({ ...prev, [featureName]: true }));
  };

  const disable = (featureName: FeatureName) => {
    disableFeature(featureName);
    setFeatures(prev => ({ ...prev, [featureName]: false }));
  };

  const refresh = () => {
    loadFeatures();
  };

  return (
    <FeatureFlagContext.Provider value={{
      features,
      mounted,
      isEnabled,
      toggle,
      enable,
      disable,
      refresh
    }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to use feature flag context
 * Throws if used outside provider
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
}

/**
 * Hook to check single feature
 * Returns loading state and enabled status
 */
export function useFeatureFlag(featureName: FeatureName) {
  const { mounted, isEnabled } = useFeatureFlags();
  return {
    loading: !mounted,
    enabled: mounted && isEnabled(featureName)
  };
}

/**
 * Hook to check multiple features at once
 * Returns loading state and feature states
 */
export function useMultipleFeatures(featureNames: FeatureName[]) {
  const { mounted, isEnabled } = useFeatureFlags();
  
  const featureStates = featureNames.reduce((acc, name) => {
    acc[name] = mounted && isEnabled(name);
    return acc;
  }, {} as Record<FeatureName, boolean>);

  return {
    loading: !mounted,
    features: featureStates
  };
}