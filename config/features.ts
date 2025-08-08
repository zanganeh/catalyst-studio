/**
 * Feature Flags for Gradual Rollout
 * Allows safe introduction of new features without breaking existing functionality
 */

// Default feature states
const defaultFeatures = {
  // Core feature flags
  enhancedChat: false,        // Enhanced chat with structured prompts
  contentBuilder: false,       // Content type builder UI
  previewSystem: false,        // Multi-device preview
  projectPersistence: false,   // Save/load projects
  
  // UI enhancement flags
  catalystBranding: false,     // Catalyst X visual identity
  glassMorphism: false,        // Glass morphism effects
  animations: false,           // Framer Motion animations
  threeColumnLayout: false,    // New layout structure
  
  // Integration flags
  cmsIntegration: false,       // CMS deployment features
  analyticsDisplay: false,     // Analytics dashboard
  sourceCodeView: false,       // Code editor view
  
  // Development flags
  debugMode: process.env.NODE_ENV === 'development',
  performanceLogging: false,
  errorReporting: true,
};

// Load features from localStorage if available
function loadFeatures() {
  if (typeof window === 'undefined') {
    return { ...defaultFeatures };
  }
  
  try {
    const stored = localStorage.getItem('featureFlags');
    if (stored) {
      return { ...defaultFeatures, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load feature flags from localStorage:', e);
  }
  
  return { ...defaultFeatures };
}

// Initialize features
export const features = loadFeatures();

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  // Reload from localStorage to get latest state
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const flags = JSON.parse(stored);
        return flags[featureName] === true;
      }
    } catch (e) {
      // Fall back to in-memory state
    }
  }
  return features[featureName] === true;
}

/**
 * Enable features for testing (development only)
 */
export function enableFeature(featureName: keyof typeof features) {
  if (process.env.NODE_ENV === 'development') {
    features[featureName] = true;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('featureFlags', JSON.stringify(features));
      } catch (e) {
        console.warn('Failed to save feature flags:', e);
      }
    }
    
    console.log(`Feature enabled: ${featureName}`);
  }
}

/**
 * Disable features for testing (development only)
 */
export function disableFeature(featureName: keyof typeof features) {
  if (process.env.NODE_ENV === 'development') {
    features[featureName] = false;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('featureFlags', JSON.stringify(features));
      } catch (e) {
        console.warn('Failed to save feature flags:', e);
      }
    }
    
    console.log(`Feature disabled: ${featureName}`);
  }
}