/**
 * Feature Flag Cleanup Utility
 * Story 2.7: Removes legacy feature flag data from localStorage
 * 
 * This utility is for one-time cleanup of feature flag data
 * after Epic 2 completion (feature flag removal).
 */

/**
 * Cleans up legacy feature flag data from localStorage
 * @returns boolean indicating if cleanup was performed
 */
export function cleanupFeatureFlagData(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }

  try {
    // Check if feature flags exist
    const hasFeatureFlags = localStorage.getItem('featureFlags') !== null
    
    if (hasFeatureFlags) {
      // Remove old feature flags data
      localStorage.removeItem('featureFlags')
      
      // Set migration flag
      localStorage.setItem('featureFlagsMigrated', 'true')
      
      console.log('[Cleanup] Removed legacy feature flag data from localStorage')
      return true
    }
    
    // Already cleaned or never had feature flags
    return false
  } catch (error) {
    console.error('[Cleanup] Error cleaning feature flag data:', error)
    return false
  }
}

/**
 * Checks if feature flag cleanup has already been performed
 * @returns boolean indicating if migration was completed
 */
export function isFeatureFlagMigrationComplete(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return true // Consider complete if no localStorage
  }

  try {
    return localStorage.getItem('featureFlagsMigrated') === 'true'
  } catch {
    return true // Consider complete if error accessing localStorage
  }
}

/**
 * One-time initialization to be called on app startup
 * Performs cleanup only if not already done
 */
export function initializeFeatureFlagCleanup(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Only run cleanup if not already performed
  if (!isFeatureFlagMigrationComplete()) {
    const cleaned = cleanupFeatureFlagData()
    if (cleaned) {
      console.log('[App] Feature flag data cleanup completed')
    }
  }
}