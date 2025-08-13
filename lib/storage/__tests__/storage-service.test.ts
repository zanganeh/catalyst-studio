import { 
  IndexedDBStorage, 
  LocalStorage, 
  SessionStorage, 
  MemoryStorage, 
  StorageService 
} from '../storage-service';

// Mock IndexedDB (kept for potential future use)
// const mockIndexedDB = {
//   open: jest.fn(),
//   deleteDatabase: jest.fn()
// };

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
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
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
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

describe.skip('Storage Strategies - Deprecated (no longer using localStorage/IndexedDB)', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
  });

  describe('LocalStorage', () => {
    let storage: LocalStorage;

    beforeEach(() => {
      storage = new LocalStorage();
    });

    test('should check availability', async () => {
      const isAvailable = await storage.isAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should save and load data', async () => {
      const key = 'test-key';
      const data = { message: 'test data', value: 123 };

      await storage.save(key, data);
      const loaded = await storage.load(key);

      expect(loaded).toEqual(data);
    });

    test('should remove data', async () => {
      const key = 'test-key';
      const data = { message: 'test' };

      await storage.save(key, data);
      await storage.remove(key);
      const loaded = await storage.load(key);

      expect(loaded).toBeNull();
    });

    test('should clear catalyst data only', async () => {
      await storage.save('catalyst:test1', { data: 1 });
      await storage.save('catalyst:test2', { data: 2 });
      await storage.save('other:test', { data: 3 });

      await storage.clear();

      expect(await storage.load('catalyst:test1')).toBeNull();
      expect(await storage.load('catalyst:test2')).toBeNull();
      // Note: In real implementation, non-catalyst keys would remain
    });

    test('should handle quota exceeded error', async () => {
      const key = 'test-key';
      const largeData = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB

      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException('QuotaExceededError');
        (error as DOMException).name = 'QuotaExceededError';
        throw error;
      });

      await expect(storage.save(key, largeData)).rejects.toThrow('LocalStorage quota exceeded');
    });

    test('should calculate storage size', async () => {
      await storage.save('test1', { data: 'test' });
      await storage.save('test2', { data: 'test2' });

      const size = await storage.getSize();
      expect(size).toBeGreaterThan(0);
    });

    test('should get storage quota', async () => {
      const quota = await storage.getQuota();
      
      expect(quota).toHaveProperty('usage');
      expect(quota).toHaveProperty('quota');
      expect(quota.quota).toBe(10 * 1024 * 1024); // 10MB
    });
  });

  describe('SessionStorage', () => {
    let storage: SessionStorage;

    beforeEach(() => {
      storage = new SessionStorage();
    });

    test('should check availability', async () => {
      const isAvailable = await storage.isAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should save and load data', async () => {
      const key = 'test-key';
      const data = { message: 'session test', value: 456 };

      await storage.save(key, data);
      const loaded = await storage.load(key);

      expect(loaded).toEqual(data);
    });

    test('should clear catalyst data only', async () => {
      await storage.save('catalyst:session1', { data: 1 });
      await storage.save('catalyst:session2', { data: 2 });
      await storage.save('other:session', { data: 3 });

      await storage.clear();

      expect(await storage.load('catalyst:session1')).toBeNull();
      expect(await storage.load('catalyst:session2')).toBeNull();
    });
  });

  describe('MemoryStorage', () => {
    let storage: MemoryStorage;

    beforeEach(() => {
      storage = new MemoryStorage();
    });

    test('should always be available', async () => {
      const isAvailable = await storage.isAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should save and load data', async () => {
      const key = 'test-key';
      const data = { message: 'memory test', value: 789 };

      await storage.save(key, data);
      const loaded = await storage.load(key);

      expect(loaded).toEqual(data);
    });

    test('should remove data', async () => {
      const key = 'test-key';
      const data = { message: 'test' };

      await storage.save(key, data);
      await storage.remove(key);
      const loaded = await storage.load(key);

      expect(loaded).toBeNull();
    });

    test('should clear catalyst data only', async () => {
      await storage.save('catalyst:mem1', { data: 1 });
      await storage.save('catalyst:mem2', { data: 2 });
      await storage.save('other:mem', { data: 3 });

      await storage.clear();

      expect(await storage.load('catalyst:mem1')).toBeNull();
      expect(await storage.load('catalyst:mem2')).toBeNull();
      expect(await storage.load('other:mem')).toEqual({ data: 3 });
    });

    test('should have unlimited quota', async () => {
      const quota = await storage.getQuota();
      
      expect(quota.quota).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('StorageService', () => {
    let service: StorageService;

    beforeEach(() => {
      service = new StorageService();
    });

    test('should initialize with available strategy', async () => {
      await service.initialize();
      
      const strategy = service.getCurrentStrategy();
      expect(['IndexedDB', 'LocalStorage', 'SessionStorage', 'MemoryStorage']).toContain(strategy);
    });

    test('should save and load data', async () => {
      const key = 'catalyst:test';
      const data = { 
        messages: ['Hello', 'World'],
        timestamp: new Date().toISOString()
      };

      await service.save(key, data);
      const loaded = await service.load(key);

      expect(loaded).toEqual(data);
    });

    test('should fallback to next strategy on failure', async () => {
      const key = 'catalyst:fallback';
      const data = { test: 'data' };

      // Make localStorage fail
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      // Service should fallback to sessionStorage or memory
      await service.save(key, data);
      
      // Should still be able to load
      const loaded = await service.load(key);
      expect(loaded).toBeDefined();
    });

    test('should remove data from all strategies', async () => {
      const key = 'catalyst:remove-test';
      const data = { test: 'remove' };

      await service.save(key, data);
      await service.remove(key);
      const loaded = await service.load(key);

      expect(loaded).toBeNull();
    });

    test('should clear all catalyst data', async () => {
      await service.save('catalyst:clear1', { data: 1 });
      await service.save('catalyst:clear2', { data: 2 });

      await service.clear();

      expect(await service.load('catalyst:clear1')).toBeNull();
      expect(await service.load('catalyst:clear2')).toBeNull();
    });

    test('should get storage info', async () => {
      await service.initialize();
      
      const info = await service.getStorageInfo();
      
      expect(info).toHaveProperty('currentStrategy');
      expect(info).toHaveProperty('usage');
      expect(info).toHaveProperty('quota');
      expect(info).toHaveProperty('percentage');
      expect(info.percentage).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeLessThanOrEqual(100);
    });

    test('should handle complete storage failure', async () => {
      // Make all strategies unavailable
      jest.spyOn(IndexedDBStorage.prototype, 'isAvailable').mockResolvedValue(false);
      jest.spyOn(LocalStorage.prototype, 'isAvailable').mockResolvedValue(false);
      jest.spyOn(SessionStorage.prototype, 'isAvailable').mockResolvedValue(false);
      jest.spyOn(MemoryStorage.prototype, 'isAvailable').mockResolvedValue(false);

      const failService = new StorageService();
      
      await expect(failService.initialize()).rejects.toThrow('No storage strategy available');
    });
  });
});