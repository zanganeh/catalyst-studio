/**
 * Feature Flags for Gradual Rollout
 * Allows safe introduction of new features without breaking existing functionality
 * SECURITY: Input validation and sanitization added
 * PERFORMANCE: Caching layer for localStorage reads
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

export type FeatureFlags = typeof defaultFeatures;
export type FeatureName = keyof FeatureFlags;

// Performance: Cache for feature flag values
const featureCache = new Map<FeatureName, boolean>();
let cacheInitialized = false;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000; // 1 second TTL for cache

/**
 * Validate feature flags against expected schema
 * SECURITY: Prevents XSS attacks via localStorage manipulation
 */
function isValidFeatureFlags(data: unknown): data is Partial<FeatureFlags> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const flags = data as Record<string, unknown>;
  const validKeys = Object.keys(defaultFeatures);
  
  // Validate each key and value
  for (const key in flags) {
    // Check if key is valid
    if (!validKeys.includes(key)) {
      console.warn(`[Security] Invalid feature flag key detected: ${key}`);
      return false;
    }
    // Check if value is boolean
    if (typeof flags[key] !== 'boolean') {
      console.warn(`[Security] Invalid feature flag value type for ${key}: ${typeof flags[key]}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Safely parse JSON with validation
 * SECURITY: Prevents code injection via localStorage
 */
function safeParse(data: string): Partial<FeatureFlags> {
  try {
    // Limit string length to prevent DoS
    if (data.length > 10000) {
      console.error('[Security] Feature flags data exceeds maximum length');
      return {};
    }
    
    const parsed = JSON.parse(data);
    
    if (isValidFeatureFlags(parsed)) {
      return parsed;
    }
    
    console.warn('[Security] Invalid feature flags structure detected, using defaults');
    return {};
  } catch (e) {
    console.error('[Security] Failed to parse feature flags:', e);
    return {};
  }
}

/**
 * Initialize cache from localStorage
 * PERFORMANCE: Single read on initialization
 */
function initializeCache(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const stored = localStorage.getItem('featureFlags');
    const parsedFlags = stored ? safeParse(stored) : {};
    const mergedFlags = { ...defaultFeatures, ...parsedFlags };
    
    // Populate cache
    Object.entries(mergedFlags).forEach(([key, value]) => {
      featureCache.set(key as FeatureName, value);
    });
    
    cacheInitialized = true;
    lastCacheUpdate = Date.now();
  } catch (e) {
    console.error('[Cache] Failed to initialize feature cache:', e);
    // Use defaults on error
    Object.entries(defaultFeatures).forEach(([key, value]) => {
      featureCache.set(key as FeatureName, value);
    });
  }
}

/**
 * Refresh cache if stale
 * PERFORMANCE: Prevents excessive localStorage reads
 */
function refreshCacheIfNeeded(): void {
  if (!cacheInitialized || Date.now() - lastCacheUpdate > CACHE_TTL) {
    initializeCache();
  }
}

// Load features from localStorage if available
function loadFeatures() {
  if (typeof window === 'undefined') {
    return { ...defaultFeatures };
  }
  
  try {
    const stored = localStorage.getItem('featureFlags');
    if (stored) {
      const parsed = safeParse(stored);
      return { ...defaultFeatures, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load feature flags from localStorage:', e);
  }
  
  return { ...defaultFeatures };
}

// Initialize features
export const features = loadFeatures();

// Initialize cache on module load
if (typeof window !== 'undefined') {
  initializeCache();
}

/**
 * Check if a feature is enabled
 * PERFORMANCE: Uses cache instead of localStorage reads
 */
export function isFeatureEnabled(featureName: FeatureName): boolean {
  // Use cache for performance
  if (cacheInitialized && featureCache.has(featureName)) {
    refreshCacheIfNeeded();
    return featureCache.get(featureName) ?? false;
  }
  
  // Fallback to localStorage if cache not ready
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const flags = safeParse(stored);
        return flags[featureName] === true;
      }
    } catch (e) {
      console.error('[Features] Error reading feature flag:', e);
    }
  }
  
  return features[featureName] === true;
}

/**
 * Enable features for testing (development only)
 * SECURITY: Restricted to development environment
 */
export function enableFeature(featureName: FeatureName) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[Security] Feature toggling is only allowed in development');
    return;
  }
  
  features[featureName] = true;
  
  // Update cache
  featureCache.set(featureName, true);
  lastCacheUpdate = Date.now();
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = localStorage.getItem('featureFlags');
      const flags = current ? safeParse(current) : {};
      flags[featureName] = true;
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    } catch (e) {
      console.warn('Failed to save feature flags:', e);
    }
  }
  
  console.log(`Feature enabled: ${featureName}`);
}

/**
 * Disable features for testing (development only)
 * SECURITY: Restricted to development environment
 */
export function disableFeature(featureName: FeatureName) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[Security] Feature toggling is only allowed in development');
    return;
  }
  
  features[featureName] = false;
  
  // Update cache
  featureCache.set(featureName, false);
  lastCacheUpdate = Date.now();
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = localStorage.getItem('featureFlags');
      const flags = current ? safeParse(current) : {};
      flags[featureName] = false;
      localStorage.setItem('featureFlags', JSON.stringify(flags));
    } catch (e) {
      console.warn('Failed to save feature flags:', e);
    }
  }
  
  console.log(`Feature disabled: ${featureName}`);
}

/**
 * Clear feature cache (for testing)
 */
export function clearFeatureCache() {
  if (process.env.NODE_ENV === 'development') {
    featureCache.clear();
    cacheInitialized = false;
    lastCacheUpdate = 0;
  }
}