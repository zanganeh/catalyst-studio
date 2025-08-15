import { DatabaseExtractor, ExtractedContentType } from '../database-extractor';
import sqlite3 from 'sqlite3';

jest.mock('sqlite3');

describe('DatabaseExtractor', () => {
  let extractor: DatabaseExtractor;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      all: jest.fn(),
      close: jest.fn()
    };

    (sqlite3.Database as jest.Mock) = jest.fn((path, callback) => {
      callback(null);
      return mockDb;
    });

    extractor = new DatabaseExtractor('/test/path/db.sqlite');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to the database successfully', async () => {
      await extractor.connect();
      expect(sqlite3.Database).toHaveBeenCalledWith('/test/path/db.sqlite', expect.any(Function));
    });

    it('should reject if connection fails', async () => {
      (sqlite3.Database as jest.Mock) = jest.fn((path, callback) => {
        callback(new Error('Connection failed'));
        return mockDb;
      });

      extractor = new DatabaseExtractor('/test/path/db.sqlite');
      await expect(extractor.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('close', () => {
    it('should close the database connection', async () => {
      await extractor.connect();
      mockDb.close.mockImplementation((callback: Function) => callback(null));
      
      await extractor.close();
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      await extractor.connect();
      mockDb.close.mockImplementation((callback: Function) => callback(new Error('Close failed')));
      
      await expect(extractor.close()).rejects.toThrow('Close failed');
    });
  });

  describe('extractContentTypes', () => {
    const mockRows = [
      {
        id: '1',
        websiteId: 'web1',
        name: 'BlogPost',
        fields: '{"fields":[{"name":"title","type":"text"}]}',
        settings: '{"visible":true}',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        websiteName: 'Test Website'
      },
      {
        id: '2',
        websiteId: 'web1',
        name: 'Article',
        fields: 'invalid json',
        settings: null,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-04',
        websiteName: 'Test Website'
      }
    ];

    beforeEach(async () => {
      await extractor.connect();
    });

    it('should extract and transform content types', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockRows);
      });

      const result = await extractor.extractContentTypes();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        websiteId: 'web1',
        name: 'BlogPost',
        fields: { fields: [{ name: 'title', type: 'text' }] },
        settings: { visible: true },
        websiteName: 'Test Website'
      });
      expect(result[0].metadata.source).toBe('catalyst-studio');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockRows);
      });

      const result = await extractor.extractContentTypes();

      expect(result[1].fields).toEqual({});
      expect(result[1].settings).toEqual({});
    });

    it('should filter by websiteId when provided', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        expect(params).toEqual(['web1']);
        expect(query).toContain('WHERE ct.websiteId = ?');
        callback(null, []);
      });

      await extractor.extractContentTypes('web1');
      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(new Error('Database error'), null);
      });

      await expect(extractor.extractContentTypes()).rejects.toThrow('Database error');
    });
  });

  describe('getWebsites', () => {
    beforeEach(async () => {
      await extractor.connect();
    });

    it('should fetch all websites', async () => {
      const mockWebsites = [
        { id: '1', name: 'Website 1', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
        { id: '2', name: 'Website 2', createdAt: '2024-01-03', updatedAt: '2024-01-04' }
      ];

      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockWebsites);
      });

      const result = await extractor.getWebsites();
      expect(result).toEqual(mockWebsites);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('FROM Website'),
        [],
        expect.any(Function)
      );
    });

    it('should handle errors when fetching websites', async () => {
      mockDb.all.mockImplementation((query: string, params: any[], callback: Function) => {
        callback(new Error('Fetch failed'), null);
      });

      await expect(extractor.getWebsites()).rejects.toThrow('Fetch failed');
    });
  });
});