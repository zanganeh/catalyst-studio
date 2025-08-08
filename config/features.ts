/**
 * Feature Flags for Gradual Rollout
 * Allows safe introduction of new features without breaking existing functionality
 */

export const features = {
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

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName] === true;
}

/**
 * Enable features for testing (development only)
 */
export function enableFeature(featureName: keyof typeof features) {
  if (process.env.NODE_ENV === 'development') {
    features[featureName] = true;
    console.log(`Feature enabled: ${featureName}`);
  }
}

/**
 * Disable features for testing (development only)
 */
export function disableFeature(featureName: keyof typeof features) {
  if (process.env.NODE_ENV === 'development') {
    features[featureName] = false;
    console.log(`Feature disabled: ${featureName}`);
  }
}