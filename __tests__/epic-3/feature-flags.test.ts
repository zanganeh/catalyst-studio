import { FeatureFlagService, FeatureFlag } from '@/lib/features/feature-flags';

describe('FeatureFlagService', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Reset singleton instance
    (FeatureFlagService as any).instance = undefined;
  });
  
  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  describe('Feature Flag Initialization', () => {
    test('should initialize with environment variables', () => {
      process.env.NEXT_PUBLIC_MULTI_WEBSITE = 'true';
      process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE = '50';
      process.env.NEXT_PUBLIC_BETA_USERS = 'user1@test.com,user2@test.com';
      
      const service = FeatureFlagService.getInstance();
      const flags = service.getAllFlags();
      
      expect(flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT)?.enabled).toBe(true);
      expect(flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT)?.rolloutPercentage).toBe(50);
      expect(flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT)?.allowedUsers).toEqual([
        'user1@test.com',
        'user2@test.com'
      ]);
    });
    
    test('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_MULTI_WEBSITE;
      delete process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE;
      
      const service = FeatureFlagService.getInstance();
      const flags = service.getAllFlags();
      
      expect(flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT)?.enabled).toBe(false);
      expect(flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT)?.rolloutPercentage).toBe(0);
    });
  });
  
  describe('Feature Flag Evaluation', () => {
    let service: FeatureFlagService;
    
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MULTI_WEBSITE = 'true';
      process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE = '100';
      service = FeatureFlagService.getInstance();
    });
    
    test('should return true when flag is enabled', () => {
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT)).toBe(true);
    });
    
    test('should return false when flag is disabled', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, { enabled: false });
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT)).toBe(false);
    });
    
    test('should respect date ranges', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Flag with future start date
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        startDate: tomorrow
      });
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT)).toBe(false);
      
      // Flag with past end date
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        startDate: undefined,
        endDate: yesterday
      });
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT)).toBe(false);
      
      // Flag within date range
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        startDate: yesterday,
        endDate: tomorrow
      });
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT)).toBe(true);
    });
    
    test('should handle user allowlist', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        allowedUsers: ['allowed@test.com'],
        rolloutPercentage: 0 // Disabled for everyone else
      });
      
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, 'allowed@test.com')).toBe(true);
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, 'other@test.com')).toBe(false);
    });
    
    test('should handle user blocklist', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        blockedUsers: ['blocked@test.com'],
        rolloutPercentage: 100
      });
      
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, 'blocked@test.com')).toBe(false);
      expect(service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, 'other@test.com')).toBe(true);
    });
    
    test('should handle rollout percentage consistently', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        rolloutPercentage: 50
      });
      
      // Same user should always get same result
      const userId = 'test@example.com';
      const result1 = service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, userId);
      const result2 = service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, userId);
      
      expect(result1).toBe(result2);
    });
    
    test('should distribute users across rollout percentage', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: true,
        rolloutPercentage: 50
      });
      
      let enabledCount = 0;
      const totalUsers = 1000;
      
      for (let i = 0; i < totalUsers; i++) {
        if (service.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT, `user${i}@test.com`)) {
          enabledCount++;
        }
      }
      
      // Should be roughly 50% (with some margin for randomness)
      const percentage = (enabledCount / totalUsers) * 100;
      expect(percentage).toBeGreaterThan(40);
      expect(percentage).toBeLessThan(60);
    });
  });
  
  describe('Admin Functions', () => {
    let service: FeatureFlagService;
    
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MULTI_WEBSITE = 'true';
      service = FeatureFlagService.getInstance();
    });
    
    test('should update flag configuration', () => {
      service.setFlag(FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        rolloutPercentage: 75,
        description: 'Updated description'
      });
      
      const flags = service.getAllFlags();
      const flag = flags.get(FeatureFlag.MULTI_WEBSITE_SUPPORT);
      
      expect(flag?.rolloutPercentage).toBe(75);
      expect(flag?.description).toBe('Updated description');
      expect(flag?.enabled).toBe(true); // Should preserve other properties
    });
    
    test('should not create new flags', () => {
      const initialFlags = service.getAllFlags();
      const initialSize = initialFlags.size;
      
      // Try to set a non-existent flag
      service.setFlag('non_existent' as FeatureFlag, { enabled: true });
      
      const updatedFlags = service.getAllFlags();
      expect(updatedFlags.size).toBe(initialSize);
    });
  });
  
  describe('Hash Function', () => {
    let service: FeatureFlagService;
    
    beforeEach(() => {
      service = FeatureFlagService.getInstance();
    });
    
    test('should produce consistent hash for same user', () => {
      const userId = 'test@example.com';
      const hash1 = (service as any).hashUserId(userId);
      const hash2 = (service as any).hashUserId(userId);
      
      expect(hash1).toBe(hash2);
    });
    
    test('should produce different hashes for different users', () => {
      const hash1 = (service as any).hashUserId('user1@example.com');
      const hash2 = (service as any).hashUserId('user2@example.com');
      
      expect(hash1).not.toBe(hash2);
    });
    
    test('should produce positive hash values', () => {
      const testUsers = [
        'test@example.com',
        'user@domain.org',
        'admin@company.net',
        'very.long.email.address@subdomain.example.com'
      ];
      
      testUsers.forEach(userId => {
        const hash = (service as any).hashUserId(userId);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(100);
      });
    });
  });
});