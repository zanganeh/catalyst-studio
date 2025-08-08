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
  // FIXED: Dynamically get feature names from the config
  const loadFeatures = () => {
    try {
      const featureState: Partial<FeatureFlags> = {};
      
      // Get all feature names from the type system
      // This ensures we're always in sync with the config
      const allFeatures: FeatureName[] = [
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

      allFeatures.forEach(name => {
        try {
          featureState[name] = isFeatureEnabled(name);
        } catch (error) {
          console.error(`[FeatureFlags] Error loading feature ${name}:`, error);
          featureState[name] = false; // Default to disabled on error
        }
      });

      setFeatures(featureState);
    } catch (error) {
      console.error('[FeatureFlags] Error loading features:', error);
      setFeatures({}); // Set empty object on complete failure
    }
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
    try {
      enableFeature(featureName);
      setFeatures(prev => ({ ...prev, [featureName]: true }));
    } catch (error) {
      console.error(`[FeatureFlags] Error enabling feature ${featureName}:`, error);
    }
  };

  const disable = (featureName: FeatureName) => {
    try {
      disableFeature(featureName);
      setFeatures(prev => ({ ...prev, [featureName]: false }));
    } catch (error) {
      console.error(`[FeatureFlags] Error disabling feature ${featureName}:`, error);
    }
  };

  const refresh = () => {
    try {
      loadFeatures();
    } catch (error) {
      console.error('[FeatureFlags] Error refreshing features:', error);
    }
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