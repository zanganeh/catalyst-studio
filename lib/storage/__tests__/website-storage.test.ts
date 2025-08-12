import { WebsiteStorageService } from '../website-storage.service';
import { WebsiteMetadata, WebsiteData } from '../types';

// Mock IndexedDB for testing
const mockIndexedDB = {
  databases: jest.fn().mockResolvedValue([]),
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

// Mock navigator.storage
const mockStorage = {
  estimate: jest.fn().mockResolvedValue({
    usage: 50 * 1024 * 1024, // 50MB
    quota: 100 * 1024 * 1024 // 100MB
  })
};

describe('WebsiteStorageService', () => {
  let service: WebsiteStorageService;

  beforeEach(() => {
    // Setup mocks
    (global as any).indexedDB = mockIndexedDB;
    (global as any).navigator = { 
      storage: {
        estimate: jest.fn().mockResolvedValue({
          usage: 50 * 1024 * 1024, // 50MB
          quota: 100 * 1024 * 1024 // 100MB
        })
      }
    };
    
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    (global as any).localStorage = localStorageMock;

    service = new WebsiteStorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDB', () => {
    it('should initialize the database successfully', async () => {
      const mockDB = {
        objectStoreNames: ['websites', 'settings', 'version'],
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              result: []
            })
          })
        }),
        close: jest.fn()
      };

      const mockRequest = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB
      };

      mockIndexedDB.open.mockReturnValue(mockRequest);

      // Simulate successful DB open
      const openPromise = service.initializeDB();
      
      // Execute the onsuccess callback
      setTimeout(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess();
      }, 0);
      
      await expect(openPromise).resolves.toBeUndefined();
    });

    it.skip('should handle migration when legacy data is detected', async () => {
      // Mock legacy data detection
      const getItemMock = jest.fn((key) => {
        if (key === 'catalyst_brand_identity') return '{"test": "data"}';
        return null;
      });
      (global as any).localStorage.getItem = getItemMock;

      const mockDB = {
        objectStoreNames: ['websites', 'settings', 'version'],
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              result: []
            })
          })
        }),
        close: jest.fn()
      };

      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }));

      await service.initializeDB();
      
      // Verify migration was attempted
      expect(localStorage.getItem).toHaveBeenCalledWith('catalyst_brand_identity');
    });
  });

  describe('createWebsite', () => {
    it('should create a new website with unique ID', async () => {
      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockImplementation(() => {
              const request = {
                onsuccess: null as any,
                onerror: null as any
              };
              setTimeout(() => {
                if (request.onsuccess) request.onsuccess();
              }, 0);
              return request;
            })
          })
        })
      };

      (service as any).db = mockDB;
      
      // Mock the initializeWebsiteStores method
      (service as any).initializeWebsiteStores = jest.fn().mockResolvedValue(undefined);

      const metadata = {
        name: 'Test Website',
        storageQuota: 50 * 1024 * 1024
      };

      const websiteId = await service.createWebsite(metadata);
      
      expect(websiteId).toBeTruthy();
      expect(websiteId).toMatch(/^website_/);
    });

    it('should initialize all required stores for new website', async () => {
      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockImplementation(() => {
              const request = {
                onsuccess: null as any,
                onerror: null as any
              };
              setTimeout(() => {
                if (request.onsuccess) request.onsuccess();
              }, 0);
              return request;
            }),
            put: jest.fn().mockReturnValue({
              onsuccess: null,
              onerror: null
            })
          })
        })
      };

      (service as any).db = mockDB;
      (service as any).initializeWebsiteStores = jest.fn().mockResolvedValue(undefined);

      const websiteId = await service.createWebsite({
        name: 'Test Website',
        storageQuota: 50 * 1024 * 1024,
        createdAt: new Date(),
        lastModified: new Date()
      });

      // Verify stores were initialized
      expect(websiteId).toBeTruthy();
      expect((service as any).initializeWebsiteStores).toHaveBeenCalled();
    });
  });

  describe('listWebsites', () => {
    it('should return list of all websites', async () => {
      const mockWebsites: WebsiteMetadata[] = [
        {
          id: 'website_1',
          name: 'Website 1',
          createdAt: new Date(),
          lastModified: new Date(),
          storageQuota: 100 * 1024 * 1024
        },
        {
          id: 'website_2',
          name: 'Website 2',
          createdAt: new Date(),
          lastModified: new Date(),
          storageQuota: 100 * 1024 * 1024
        }
      ];

      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
              result: mockWebsites
            })
          })
        })
      };

      (service as any).db = mockDB;

      const listPromise = service.listWebsites();
      
      // Simulate successful getAll
      const getAllRequest = mockDB.transaction().objectStore().getAll.mock.results[0].value;
      getAllRequest.onsuccess();

      const websites = await listPromise;
      
      expect(websites).toEqual(mockWebsites);
      expect(websites).toHaveLength(2);
    });

    it('should return empty array when no websites exist', async () => {
      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
              result: []
            })
          })
        })
      };

      (service as any).db = mockDB;

      const listPromise = service.listWebsites();
      const getAllRequest = mockDB.transaction().objectStore().getAll.mock.results[0].value;
      getAllRequest.onsuccess();

      const websites = await listPromise;
      
      expect(websites).toEqual([]);
    });
  });

  describe('getWebsiteData', () => {
    it('should retrieve all data for a website', async () => {
      const websiteId = 'test_website';
      
      // Mock the getWebsiteStore method
      (service as any).getWebsiteStore = jest.fn().mockImplementation((id, store) => {
        switch (store) {
          case 'config':
            return Promise.resolve({ id: websiteId, settings: {} });
          case 'content':
            return Promise.resolve({ pages: [], components: [] });
          case 'assets':
            return Promise.resolve({ images: [] });
          case 'ai_context':
            return Promise.resolve({ history: [] });
          default:
            return Promise.resolve(null);
        }
      });

      const data = await service.getWebsiteData(websiteId);
      
      expect(data).toBeDefined();
      expect(data.config.id).toBe(websiteId);
      expect(data.content.pages).toEqual([]);
      expect(data.assets.images).toEqual([]);
      expect(data.aiContext.history).toEqual([]);
    });

    it('should return default values for non-existent website data', async () => {
      const websiteId = 'new_website';
      
      // Mock the getWebsiteStore method to return null
      (service as any).getWebsiteStore = jest.fn().mockResolvedValue(null);

      const data = await service.getWebsiteData(websiteId);
      
      expect(data).toBeDefined();
      expect(data.config.id).toBe(websiteId);
      expect(data.content).toBeDefined();
      expect(data.assets).toBeDefined();
      expect(data.aiContext).toBeDefined();
    });

    it('should validate website ID format', async () => {
      const invalidIds = ['', null, undefined, 'website/123', 'website\\123', 'website;drop'];
      
      for (const invalidId of invalidIds) {
        await expect(service.getWebsiteData(invalidId as any)).rejects.toThrow();
      }
    });
  });

  describe('saveWebsiteData', () => {
    it('should save partial website data', async () => {
      const websiteId = 'test_website';
      const partialData: Partial<WebsiteData> = {
        config: {
          id: websiteId,
          settings: { theme: 'dark' }
        }
      };

      // Mock the saveWebsiteStore and updateWebsiteMetadata methods
      (service as any).saveWebsiteStore = jest.fn().mockResolvedValue(undefined);
      (service as any).updateWebsiteMetadata = jest.fn().mockResolvedValue(undefined);

      await service.saveWebsiteData(websiteId, partialData);
      
      expect((service as any).saveWebsiteStore).toHaveBeenCalledWith(
        websiteId,
        'config',
        partialData.config
      );
      expect((service as any).updateWebsiteMetadata).toHaveBeenCalled();
    });

    it('should update last modified timestamp', async () => {
      const websiteId = 'test_website';
      const data: Partial<WebsiteData> = {
        content: { pages: [] }
      };

      (service as any).saveWebsiteStore = jest.fn().mockResolvedValue(undefined);
      (service as any).updateWebsiteMetadata = jest.fn().mockResolvedValue(undefined);

      await service.saveWebsiteData(websiteId, data);
      
      expect((service as any).updateWebsiteMetadata).toHaveBeenCalledWith(
        websiteId,
        expect.objectContaining({
          lastModified: expect.any(Date)
        })
      );
    });
  });

  describe('deleteWebsiteData', () => {
    it('should delete all website data and metadata', async () => {
      const websiteId = 'test_website';
      
      (service as any).deleteDatabase = jest.fn().mockResolvedValue(undefined);
      (service as any).removeWebsiteFromMetadata = jest.fn().mockResolvedValue(undefined);

      await service.deleteWebsiteData(websiteId);
      
      // Verify all stores were deleted
      expect((service as any).deleteDatabase).toHaveBeenCalledTimes(4);
      expect((service as any).deleteDatabase).toHaveBeenCalledWith(`website_${websiteId}_config`);
      expect((service as any).deleteDatabase).toHaveBeenCalledWith(`website_${websiteId}_content`);
      expect((service as any).deleteDatabase).toHaveBeenCalledWith(`website_${websiteId}_assets`);
      expect((service as any).deleteDatabase).toHaveBeenCalledWith(`website_${websiteId}_ai_context`);
      
      // Verify metadata was removed
      expect((service as any).removeWebsiteFromMetadata).toHaveBeenCalledWith(websiteId);
    });
  });

  describe('checkStorageQuota', () => {
    it('should return current storage quota status', async () => {
      // Create a new service instance with proper mocked quota monitor
      const mockQuotaMonitor = {
        checkQuota: jest.fn().mockResolvedValue({
          total: {
            usage: 50 * 1024 * 1024,
            quota: 100 * 1024 * 1024,
            percentUsed: 0.5
          },
          byWebsite: new Map(),
          warning: false,
          critical: false
        })
      };
      
      (service as any).quotaMonitor = mockQuotaMonitor;
      
      const quota = await service.checkStorageQuota();
      
      expect(quota).toBeDefined();
      expect(quota.usage).toBe(50 * 1024 * 1024);
      expect(quota.quota).toBe(100 * 1024 * 1024);
      expect(quota.percentUsed).toBe(0.5);
    });
  });

  describe('exportWebsite', () => {
    it('should export website data as blob', async () => {
      const websiteId = 'test_website';
      const mockData: WebsiteData = {
        config: { id: websiteId },
        content: { pages: [] },
        assets: { images: [] },
        aiContext: { history: [] }
      };
      
      const mockMetadata: WebsiteMetadata = {
        id: websiteId,
        name: 'Test Website',
        createdAt: new Date(),
        lastModified: new Date(),
        storageQuota: 100 * 1024 * 1024
      };

      (service as any).getWebsiteData = jest.fn().mockResolvedValue(mockData);
      (service as any).getWebsiteMetadata = jest.fn().mockResolvedValue(mockMetadata);

      const blob = await service.exportWebsite(websiteId);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('importWebsite', () => {
    it('should import website from blob', async () => {
      const importData = {
        version: '1.0.0',
        metadata: {
          name: 'Imported Website',
          storageQuota: 100 * 1024 * 1024
        },
        data: {
          config: { id: 'old_id' },
          content: { pages: [] },
          assets: { images: [] },
          aiContext: { history: [] }
        }
      };
      
      const mockBlob = {
        text: jest.fn().mockResolvedValue(JSON.stringify(importData)),
        type: 'application/json'
      } as any;
      
      (service as any).createWebsite = jest.fn().mockResolvedValue('new_website_id');
      (service as any).saveWebsiteData = jest.fn().mockResolvedValue(undefined);

      const newId = await service.importWebsite(mockBlob);
      
      expect(newId).toBe('new_website_id');
      expect((service as any).createWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Imported Website (Imported)'
        })
      );
      expect((service as any).saveWebsiteData).toHaveBeenCalledWith('new_website_id', importData.data);
    });
  });

  describe('cleanupOldData', () => {
    it('should cleanup old data based on suggestions', async () => {
      const websiteId = 'test_website';
      
      // Mock quota monitor suggestions
      (service as any).quotaMonitor.suggestCleanup = jest.fn().mockResolvedValue({
        websiteId,
        suggestions: [
          'Clear old AI conversation history (keep last 50 entries)',
          'Remove unreferenced asset files',
          'Clear old content versions and drafts'
        ],
        potentialSavings: 10 * 1024 * 1024
      });
      
      (service as any).cleanupAIHistory = jest.fn().mockResolvedValue(undefined);
      (service as any).cleanupUnreferencedAssets = jest.fn().mockResolvedValue(undefined);
      (service as any).cleanupOldContentVersions = jest.fn().mockResolvedValue(undefined);

      await service.cleanupOldData(websiteId);
      
      expect((service as any).cleanupAIHistory).toHaveBeenCalledWith(websiteId, 50);
      expect((service as any).cleanupUnreferencedAssets).toHaveBeenCalledWith(websiteId);
      expect((service as any).cleanupOldContentVersions).toHaveBeenCalledWith(websiteId);
    });
  });
});