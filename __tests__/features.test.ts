/**
 * Feature Flag System Tests
 * Tests security, performance, and functionality
 */

import { 
  isFeatureEnabled, 
  enableFeature, 
  disableFeature,
  clearFeatureCache,
  type FeatureName 
} from '@/config/features';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Feature Flag System', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearFeatureCache();
    jest.clearAllMocks();
  });

  describe('Security Tests', () => {
    it('should reject invalid JSON in localStorage', () => {
      localStorageMock.setItem('featureFlags', 'invalid json{');
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should reject XSS attempts in feature flags', () => {
      const xssPayload = JSON.stringify({
        '<script>alert("xss")</script>': true,
        'threeColumnLayout': '<img src=x onerror=alert(1)>'
      });
      localStorageMock.setItem('featureFlags', xssPayload);
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should reject non-boolean values', () => {
      const invalidPayload = JSON.stringify({
        'threeColumnLayout': 'true', // String instead of boolean
        'catalystBranding': 123, // Number instead of boolean
        'glassMorphism': null // Null instead of boolean
      });
      localStorageMock.setItem('featureFlags', invalidPayload);
      
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
      expect(isFeatureEnabled('catalystBranding')).toBe(false);
      expect(isFeatureEnabled('glassMorphism')).toBe(false);
    });

    it('should reject unknown feature flag keys', () => {
      const invalidPayload = JSON.stringify({
        'unknownFeature': true,
        'maliciousFlag': true,
        'threeColumnLayout': true
      });
      localStorageMock.setItem('featureFlags', invalidPayload);
      
      // Valid flag should still be false due to validation failure
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should handle oversized localStorage data', () => {
      const oversizedData = 'x'.repeat(11000); // Over 10KB limit
      localStorageMock.setItem('featureFlags', oversizedData);
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should only allow feature toggling in development', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in production
      process.env.NODE_ENV = 'production';
      enableFeature('threeColumnLayout');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Test in development
      process.env.NODE_ENV = 'development';
      enableFeature('threeColumnLayout');
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Tests', () => {
    it('should cache feature flag values', () => {
      // Set initial value
      localStorageMock.setItem('featureFlags', JSON.stringify({
        threeColumnLayout: true
      }));
      
      // First call should read from localStorage
      isFeatureEnabled('threeColumnLayout');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
      
      // Subsequent calls should use cache
      isFeatureEnabled('threeColumnLayout');
      isFeatureEnabled('threeColumnLayout');
      isFeatureEnabled('threeColumnLayout');
      
      // Should still only have called getItem once due to caching
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', (done) => {
      localStorageMock.setItem('featureFlags', JSON.stringify({
        threeColumnLayout: true
      }));
      
      isFeatureEnabled('threeColumnLayout');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
      
      // Wait for cache TTL to expire (1 second)
      setTimeout(() => {
        isFeatureEnabled('threeColumnLayout');
        expect(localStorageMock.getItem).toHaveBeenCalledTimes(2);
        done();
      }, 1100);
    });
  });

  describe('Functionality Tests', () => {
    it('should return default values when localStorage is empty', () => {
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
      expect(isFeatureEnabled('catalystBranding')).toBe(false);
      expect(isFeatureEnabled('glassMorphism')).toBe(false);
      expect(isFeatureEnabled('animations')).toBe(false);
    });

    it('should enable features correctly', () => {
      process.env.NODE_ENV = 'development';
      
      enableFeature('threeColumnLayout');
      expect(isFeatureEnabled('threeColumnLayout')).toBe(true);
      
      // Check localStorage was updated
      const stored = JSON.parse(localStorageMock.getItem('featureFlags') || '{}');
      expect(stored.threeColumnLayout).toBe(true);
    });

    it('should disable features correctly', () => {
      process.env.NODE_ENV = 'development';
      
      // Enable first
      enableFeature('threeColumnLayout');
      expect(isFeatureEnabled('threeColumnLayout')).toBe(true);
      
      // Then disable
      disableFeature('threeColumnLayout');
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
      
      // Check localStorage was updated
      const stored = JSON.parse(localStorageMock.getItem('featureFlags') || '{}');
      expect(stored.threeColumnLayout).toBe(false);
    });

    it('should handle multiple features independently', () => {
      process.env.NODE_ENV = 'development';
      
      enableFeature('threeColumnLayout');
      enableFeature('catalystBranding');
      disableFeature('glassMorphism');
      
      expect(isFeatureEnabled('threeColumnLayout')).toBe(true);
      expect(isFeatureEnabled('catalystBranding')).toBe(true);
      expect(isFeatureEnabled('glassMorphism')).toBe(false);
      expect(isFeatureEnabled('animations')).toBe(false);
    });

    it('should persist features across reloads', () => {
      process.env.NODE_ENV = 'development';
      
      // Enable features
      enableFeature('threeColumnLayout');
      enableFeature('catalystBranding');
      
      // Clear cache to simulate reload
      clearFeatureCache();
      
      // Should still be enabled from localStorage
      expect(isFeatureEnabled('threeColumnLayout')).toBe(true);
      expect(isFeatureEnabled('catalystBranding')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('featureFlags', '{"threeColumnLayout": true'); // Missing closing brace
      expect(isFeatureEnabled('threeColumnLayout')).toBe(false);
    });

    it('should handle partial feature flag data', () => {
      localStorageMock.setItem('featureFlags', JSON.stringify({
        threeColumnLayout: true
        // Missing other flags
      }));
      
      expect(isFeatureEnabled('threeColumnLayout')).toBe(true);
      expect(isFeatureEnabled('catalystBranding')).toBe(false); // Should use default
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid feature names', () => {
      const validFeatures: FeatureName[] = [
        'threeColumnLayout',
        'catalystBranding',
        'glassMorphism',
        'animations'
      ];
      
      validFeatures.forEach(feature => {
        // Should compile and run without errors
        expect(() => isFeatureEnabled(feature)).not.toThrow();
      });
    });

    it('should validate feature name types at runtime', () => {
      // TypeScript would prevent this, but testing runtime validation
      const invalidFeature = 'invalidFeature' as FeatureName;
      expect(isFeatureEnabled(invalidFeature)).toBe(false);
    });
  });
});