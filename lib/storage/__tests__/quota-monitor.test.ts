import { QuotaMonitor } from '../quota-monitor';
import { QuotaStatus, CleanupSuggestions } from '../types';

describe('QuotaMonitor', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    // Mock navigator.storage.estimate
    (global as any).navigator = {
      storage: {
        estimate: jest.fn()
      }
    };

    // Mock indexedDB
    (global as any).indexedDB = {
      databases: jest.fn(),
      open: jest.fn(),
      deleteDatabase: jest.fn()
    };

    monitor = new QuotaMonitor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    it('should return quota status with no warnings under threshold', async () => {
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 50 * 1024 * 1024, // 50MB
        quota: 1024 * 1024 * 1024 // 1GB
      });

      const status = await monitor.checkQuota();

      expect(status.total.usage).toBe(50 * 1024 * 1024);
      expect(status.total.quota).toBe(1024 * 1024 * 1024);
      expect(status.total.percentUsed).toBeLessThan(0.1);
      expect(status.warning).toBe(false);
      expect(status.critical).toBe(false);
    });

    it('should set warning flag when usage exceeds 80%', async () => {
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 850 * 1024 * 1024, // 850MB
        quota: 1024 * 1024 * 1024 // 1GB
      });

      const status = await monitor.checkQuota();

      expect(status.total.percentUsed).toBeGreaterThan(0.8);
      expect(status.warning).toBe(true);
      expect(status.critical).toBe(false);
    });

    it('should set critical flag when usage exceeds 95%', async () => {
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 980 * 1024 * 1024, // 980MB
        quota: 1024 * 1024 * 1024 // 1GB
      });

      const status = await monitor.checkQuota();

      expect(status.total.percentUsed).toBeGreaterThan(0.95);
      expect(status.warning).toBe(true);
      expect(status.critical).toBe(true);
    });

    it('should handle storage estimate errors gracefully', async () => {
      navigator.storage.estimate = jest.fn().mockRejectedValue(new Error('Storage API not available'));

      await expect(monitor.checkQuota()).rejects.toThrow('Storage API not available');
    });

    it('should handle zero quota gracefully', async () => {
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 0,
        quota: 0
      });

      const status = await monitor.checkQuota();

      expect(status.total.percentUsed).toBe(0);
      expect(status.warning).toBe(false);
      expect(status.critical).toBe(false);
    });
  });

  describe('getUsageByWebsite', () => {
    it('should return usage map for all websites', async () => {
      // Mock databases list
      (indexedDB as any).databases = jest.fn().mockResolvedValue([
        { name: 'website_site1_config' },
        { name: 'website_site1_content' },
        { name: 'website_site2_config' },
        { name: 'other_database' }
      ]);

      // Mock database size estimation
      const mockDB = {
        objectStoreNames: ['data'],
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              result: [{ data: 'test' }]
            })
          })
        }),
        close: jest.fn()
      };

      (indexedDB as any).open = jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB
      }));

      const usageMap = await monitor.getUsageByWebsite();

      expect(usageMap).toBeInstanceOf(Map);
    });

    it('should handle databases API not available', async () => {
      (indexedDB as any).databases = undefined;

      const usageMap = await monitor.getUsageByWebsite();

      expect(usageMap).toBeInstanceOf(Map);
      expect(usageMap.size).toBe(0);
    });
  });

  describe('suggestCleanup', () => {
    it('should suggest AI history cleanup when over 100 entries', async () => {
      const websiteId = 'test_website';
      
      // Mock database with large AI history
      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              result: new Array(150).fill({ message: 'test' })
            })
          })
        }),
        close: jest.fn()
      };

      (indexedDB as any).open = jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB
      }));

      // Simulate the database open
      const openPromise = monitor.suggestCleanup(websiteId);
      const openRequest = (indexedDB as any).open.mock.results[0].value;
      openRequest.onsuccess();

      // Simulate successful data retrieval
      const getAllRequest = mockDB.transaction().objectStore().getAll.mock.results[0].value;
      getAllRequest.onsuccess();

      const suggestions = await openPromise;

      expect(suggestions.websiteId).toBe(websiteId);
      expect(suggestions.suggestions).toContain('Clear old AI conversation history (keep last 50 entries)');
      expect(suggestions.potentialSavings).toBeGreaterThan(0);
    });

    it('should suggest asset cleanup when assets exist', async () => {
      const websiteId = 'test_website';
      
      const mockDB = {
        transaction: jest.fn()
          .mockReturnValueOnce({
            objectStore: jest.fn().mockReturnValue({
              getAll: jest.fn().mockReturnValue({
                onsuccess: null,
                result: [] // No AI history
              })
            })
          })
          .mockReturnValueOnce({
            objectStore: jest.fn().mockReturnValue({
              getAll: jest.fn().mockReturnValue({
                onsuccess: null,
                result: [{ url: 'image1.jpg' }, { url: 'image2.jpg' }]
              })
            })
          }),
        close: jest.fn()
      };

      (indexedDB as any).open = jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB
      }));

      const suggestions = await monitor.suggestCleanup(websiteId);

      expect(suggestions.suggestions).toContain('Remove unreferenced asset files');
    });

    it('should handle database errors gracefully', async () => {
      const websiteId = 'test_website';
      
      (indexedDB as any).open = jest.fn().mockImplementation(() => ({
        onsuccess: null,
        onerror: () => {},
        error: new Error('Database error')
      }));

      const openPromise = monitor.suggestCleanup(websiteId);
      const openRequest = (indexedDB as any).open.mock.results[0].value;
      openRequest.onerror();

      const suggestions = await openPromise;

      expect(suggestions.websiteId).toBe(websiteId);
      expect(suggestions.suggestions).toEqual([]);
      expect(suggestions.potentialSavings).toBe(0);
    });
  });

  describe('onQuotaWarning', () => {
    it('should register and call warning callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      monitor.onQuotaWarning(callback1);
      monitor.onQuotaWarning(callback2);

      // Trigger warning condition
      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 850 * 1024 * 1024, // 850MB
        quota: 1024 * 1024 * 1024 // 1GB
      });

      await monitor.checkQuota();

      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining({
          warning: true
        })
      );
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({
          warning: true
        })
      );
    });

    it('should not call callbacks when under threshold', async () => {
      const callback = jest.fn();
      monitor.onQuotaWarning(callback);

      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 50 * 1024 * 1024, // 50MB
        quota: 1024 * 1024 * 1024 // 1GB
      });

      await monitor.checkQuota();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      monitor.onQuotaWarning(errorCallback);
      monitor.onQuotaWarning(normalCallback);

      navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 850 * 1024 * 1024,
        quota: 1024 * 1024 * 1024
      });

      // Should not throw despite callback error
      await expect(monitor.checkQuota()).resolves.toBeDefined();
      
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });
});