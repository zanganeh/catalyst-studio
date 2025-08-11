/**
 * Tests for Feature Flag Cleanup Utility
 * Story 2.7: Validates localStorage cleanup functionality
 */

import {
  cleanupFeatureFlagData,
  isFeatureFlagMigrationComplete,
  initializeFeatureFlagCleanup
} from '@/lib/utils/feature-flag-cleanup'

describe('Feature Flag Cleanup', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
      get length() { return Object.keys(store).length },
      key: (index: number) => Object.keys(store)[index] || null
    }
  })()

  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorageMock.clear()
    // Set up global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })

  describe('cleanupFeatureFlagData', () => {
    it('should remove featureFlags from localStorage', () => {
      // Setup: Add feature flags to localStorage
      localStorage.setItem('featureFlags', JSON.stringify({
        enhancedChat: true,
        previewSystem: false
      }))
      
      // Execute
      const result = cleanupFeatureFlagData()
      
      // Verify
      expect(result).toBe(true)
      expect(localStorage.getItem('featureFlags')).toBeNull()
      expect(localStorage.getItem('featureFlagsMigrated')).toBe('true')
    })

    it('should return false if no feature flags exist', () => {
      // Execute
      const result = cleanupFeatureFlagData()
      
      // Verify
      expect(result).toBe(false)
      expect(localStorage.getItem('featureFlagsMigrated')).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      // Setup: Make localStorage throw an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('Access denied') }
        },
        writable: true
      })
      
      // Execute
      const result = cleanupFeatureFlagData()
      
      // Verify
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('isFeatureFlagMigrationComplete', () => {
    it('should return true if migration flag is set', () => {
      // Setup
      localStorage.setItem('featureFlagsMigrated', 'true')
      
      // Execute & Verify
      expect(isFeatureFlagMigrationComplete()).toBe(true)
    })

    it('should return false if migration flag is not set', () => {
      // Execute & Verify
      expect(isFeatureFlagMigrationComplete()).toBe(false)
    })

    it('should return true if localStorage is unavailable', () => {
      // Setup: Remove localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      })
      
      // Execute & Verify
      expect(isFeatureFlagMigrationComplete()).toBe(true)
    })
  })

  describe('initializeFeatureFlagCleanup', () => {
    it('should perform cleanup if not already done', () => {
      // Setup
      localStorage.setItem('featureFlags', JSON.stringify({ test: true }))
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Execute
      initializeFeatureFlagCleanup()
      
      // Verify
      expect(localStorage.getItem('featureFlags')).toBeNull()
      expect(localStorage.getItem('featureFlagsMigrated')).toBe('true')
      expect(consoleSpy).toHaveBeenCalledWith('[App] Feature flag data cleanup completed')
      
      // Cleanup
      consoleSpy.mockRestore()
    })

    it('should not perform cleanup if already done', () => {
      // Setup
      localStorage.setItem('featureFlagsMigrated', 'true')
      localStorage.setItem('featureFlags', JSON.stringify({ test: true }))
      
      // Execute
      initializeFeatureFlagCleanup()
      
      // Verify - featureFlags should still exist since migration was already done
      expect(localStorage.getItem('featureFlags')).toBe(JSON.stringify({ test: true }))
    })

    it('should handle server-side execution gracefully', () => {
      // Setup: Simulate server-side (no window)
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      // Execute - should not throw
      expect(() => initializeFeatureFlagCleanup()).not.toThrow()
      
      // Cleanup
      global.window = originalWindow
    })
  })

  describe('Integration', () => {
    it('should handle complete cleanup flow', () => {
      // Setup: Simulate existing user with feature flags
      localStorage.setItem('featureFlags', JSON.stringify({
        enhancedChat: true,
        previewSystem: true,
        contentBuilder: false
      }))
      localStorage.setItem('other-data', 'should-remain')
      
      // Execute: First app load
      initializeFeatureFlagCleanup()
      
      // Verify: Feature flags removed, other data remains
      expect(localStorage.getItem('featureFlags')).toBeNull()
      expect(localStorage.getItem('other-data')).toBe('should-remain')
      expect(localStorage.getItem('featureFlagsMigrated')).toBe('true')
      
      // Execute: Second app load
      initializeFeatureFlagCleanup()
      
      // Verify: No additional changes
      expect(localStorage.getItem('featureFlags')).toBeNull()
      expect(localStorage.getItem('featureFlagsMigrated')).toBe('true')
    })
  })
})