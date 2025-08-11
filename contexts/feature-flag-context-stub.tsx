// Temporary stub for gradual migration - remove after Story 2.3
export function useFeatureFlags() {
  return {
    isEnabled: () => true,
    mounted: true,
    toggle: () => {},
    enable: () => {},
    disable: () => {},
    refresh: () => {},
    features: {}
  }
}

export function useFeatureFlag() {
  return {
    enabled: true,
    loading: false
  }
}

export function useMultipleFeatures() {
  return {
    features: {},
    loading: false
  }
}