import { OptimizelyApiClient } from '../optimizely-api-client';
import { OptimizelyContentType, OptimizelyContentTypeResponse } from '@/types/optimizely';
import { SyncHistoryManager } from '../../tracking/SyncHistoryManager';
import { SyncSnapshot } from '../../snapshot/sync-snapshot';

// Mock fetch globally
global.fetch = jest.fn();

describe('OptimizelyApiClient', () => {
  let client: OptimizelyApiClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
    
    client = new OptimizelyApiClient({
      url: 'https://api.optimizely.com',
      appKey: 'test-app-key',
      secret: 'test-secret'
    });
  });

  describe('updateContentType', () => {
    const mockContentType: OptimizelyContentType = {
      key: 'TestType',
      displayName: 'Test Type',
      description: 'Test Description',
      properties: [
        {
          name: 'title',
          type: 'string',
          required: true
        }
      ]
    };

    const mockResponse: OptimizelyContentTypeResponse = {
      ...mockContentType,
      etag: '"new-etag"'
    };

    beforeEach(() => {
      // Mock authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: 3600 })
      });
    });

    it('should update content type with full update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'etag': '"new-etag"' }),
        json: async () => mockResponse
      });

      const result = await client.updateContentType('TestType', mockContentType, '"old-etag"');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/contenttypes/TestType'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json-patch+json',
            'If-Match': '"old-etag"'
          }),
          body: expect.stringContaining('displayName')
        })
      );
    });

    it('should support partial updates', async () => {
      const partialUpdate = {
        description: 'Updated Description Only'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'etag': '"new-etag"' }),
        json: async () => ({ ...mockContentType, ...partialUpdate, etag: '"new-etag"' })
      });

      const result = await client.updateContentType(
        'TestType', 
        partialUpdate, 
        '"old-etag"',
        { partialUpdate: true }
      );

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      
      expect(body).toEqual([
        { op: 'replace', path: '/description', value: 'Updated Description Only' }
      ]);
    });

    it('should retry on transient errors', async () => {
      // First call fails with 503
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Service Unavailable'), { status: 503 }));
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await client.updateContentType('TestType', mockContentType);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Auth + 2 update attempts
    });

    it('should handle concurrent modification (412) by fetching latest', async () => {
      // First update fails with 412
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Precondition Failed'), { status: 412 }));
      
      // Fetch latest version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockContentType, etag: '"latest-etag"' })
      });
      
      // Retry update with latest etag succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await client.updateContentType('TestType', mockContentType, '"old-etag"');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(4); // Auth + failed update + get latest + retry
    });

    it('should apply exponential backoff for retries', async () => {
      jest.useFakeTimers();
      
      // Fail twice with 429, then succeed
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Rate Limited'), { status: 429 }));
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Rate Limited'), { status: 429 }));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const updatePromise = client.updateContentType('TestType', mockContentType);
      
      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(15000);
      
      const result = await updatePromise;
      expect(result).toEqual(mockResponse);
      
      jest.useRealTimers();
    });

    it('should throw after max retry attempts', async () => {
      mockFetch.mockRejectedValue(Object.assign(new Error('Service Unavailable'), { status: 503 }));

      await expect(
        client.updateContentType('TestType', mockContentType, undefined, { retryAttempts: 2 })
      ).rejects.toThrow('Failed to update content type TestType after 2 attempts');
    });

    it('should handle 415 Unsupported Media Type', async () => {
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Unsupported Media Type'), { status: 415 }));

      await expect(
        client.updateContentType('TestType', mockContentType)
      ).rejects.toThrow('Invalid media type for TestType');
    });

    it('should work in dry-run mode', async () => {
      const dryRunClient = new OptimizelyApiClient({
        url: 'https://api.optimizely.com',
        appKey: 'test-app-key',
        secret: 'test-secret',
        dryRun: true
      });

      const result = await dryRunClient.updateContentType('TestType', mockContentType);

      expect(result).toEqual(expect.objectContaining({
        ...mockContentType,
        etag: null
      }));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should track update in sync history when manager is provided', async () => {
      const mockSyncHistoryManager = {
        getVersionHash: jest.fn().mockResolvedValue('hash123'),
        recordSyncAttempt: jest.fn().mockResolvedValue('sync-id-123'),
        updateSyncStatus: jest.fn()
      };
      
      const mockSyncSnapshot = {
        captureSnapshot: jest.fn().mockResolvedValue({ snapshot: 'data' })
      };

      client['syncHistoryManager'] = mockSyncHistoryManager as any;
      client['syncSnapshot'] = mockSyncSnapshot as any;
      client['deploymentId'] = 'deploy-123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      await client.updateContentType('TestType', mockContentType);

      expect(mockSyncHistoryManager.recordSyncAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          typeKey: 'TestType',
          versionHash: 'hash123',
          targetPlatform: 'optimizely',
          syncDirection: 'PUSH',
          deploymentId: 'deploy-123',
          metadata: expect.objectContaining({
            operation: 'UPDATE'
          })
        })
      );

      expect(mockSyncHistoryManager.updateSyncStatus).toHaveBeenCalledWith(
        'sync-id-123',
        'SUCCESS',
        expect.objectContaining(mockResponse)
      );
    });
  });

  describe('deleteContentType', () => {
    beforeEach(() => {
      // Mock authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token', expires_in: 3600 })
      });
    });

    it('should delete content type successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await client.deleteContentType('TestType');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/contenttypes/TestType'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should check dependencies before deletion', async () => {
      const mockTypes = [
        {
          key: 'DependentType',
          displayName: 'Dependent Type',
          properties: [
            {
              name: 'reference',
              type: 'contentReference',
              settings: { allowedTypes: ['TestType'] }
            }
          ]
        }
      ];

      // Mock getContentTypes for dependency check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTypes
      });

      await expect(
        client.deleteContentType('TestType', { checkDependencies: true })
      ).rejects.toThrow('Cannot delete TestType: has dependent types [DependentType]');
    });

    it('should support cascade delete', async () => {
      const mockTypes = [
        {
          key: 'DependentType',
          displayName: 'Dependent Type',
          baseType: 'TestType'
        }
      ];

      // Mock getContentTypes for dependency check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTypes
      });

      // Mock delete for dependent type
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      // Mock delete for main type
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await client.deleteContentType('TestType', { cascadeDelete: true });

      // Should have deleted both types
      const deleteCalls = mockFetch.mock.calls.filter(call => 
        call[1]?.method === 'DELETE'
      );
      expect(deleteCalls).toHaveLength(2);
    });

    it('should support soft delete', async () => {
      const mockContentType = {
        key: 'TestType',
        displayName: 'Test Type',
        description: 'Test Description',
        etag: '"test-etag"'
      };

      // Mock getContentType for soft delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContentType
      });

      // Mock updateContentType for marking as deleted
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockContentType,
          displayName: '[DELETED] Test Type'
        })
      });

      await client.deleteContentType('TestType', { softDelete: true });

      // Should have called update instead of delete
      const updateCall = mockFetch.mock.calls.find(call => 
        call[1]?.method === 'PATCH'
      );
      expect(updateCall).toBeDefined();
      
      const deleteCall = mockFetch.mock.calls.find(call => 
        call[1]?.method === 'DELETE'
      );
      expect(deleteCall).toBeUndefined();
    });

    it('should handle 404 gracefully', async () => {
      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('Not Found'), { status: 404 })
      );

      // Should not throw on 404
      await expect(
        client.deleteContentType('NonExistentType')
      ).resolves.toBeUndefined();
    });

    it('should work in dry-run mode', async () => {
      const dryRunClient = new OptimizelyApiClient({
        url: 'https://api.optimizely.com',
        appKey: 'test-app-key',
        secret: 'test-secret',
        dryRun: true
      });

      await dryRunClient.deleteContentType('TestType');

      // Should not make any API calls
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should restore soft-deleted content type', async () => {
      const deletedType = {
        key: 'TestType',
        displayName: '[DELETED] Test Type',
        description: 'Soft deleted on 2025-01-18. Original: Test Description',
        etag: '"test-etag"'
      };

      // Mock getContentType
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deletedType
      });

      // Mock updateContentType for restoration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          key: 'TestType',
          displayName: 'Test Type',
          description: 'Test Description',
          etag: '"new-etag"'
        })
      });

      const result = await client.restoreDeletedContentType('TestType');

      expect(result.displayName).toBe('Test Type');
      expect(result.description).toBe('Test Description');
    });

    it('should prevent mass deletion', async () => {
      const keys = ['Type1', 'Type2', 'Type3', 'Type4', 'Type5', 'Type6'];
      
      const result = await client.massDeleteProtection(keys);
      
      expect(result).toBe(false);
    });

    it('should track delete in sync history when manager is provided', async () => {
      const mockSyncHistoryManager = {
        getVersionHash: jest.fn().mockResolvedValue('hash123'),
        recordSyncAttempt: jest.fn().mockResolvedValue('sync-id-123'),
        updateSyncStatus: jest.fn()
      };
      
      const mockSyncSnapshot = {
        captureSnapshot: jest.fn().mockResolvedValue({ snapshot: 'data' })
      };

      const mockContentType = {
        key: 'TestType',
        displayName: 'Test Type'
      };

      client['syncHistoryManager'] = mockSyncHistoryManager as any;
      client['syncSnapshot'] = mockSyncSnapshot as any;
      client['deploymentId'] = 'deploy-123';

      // Mock getContentType for sync tracking
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContentType
      });

      // Mock actual delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await client.deleteContentType('TestType');

      expect(mockSyncHistoryManager.recordSyncAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          typeKey: 'TestType',
          versionHash: 'hash123',
          targetPlatform: 'optimizely',
          syncDirection: 'PUSH',
          deploymentId: 'deploy-123',
          metadata: expect.objectContaining({
            operation: 'DELETE'
          })
        })
      );

      expect(mockSyncHistoryManager.updateSyncStatus).toHaveBeenCalledWith(
        'sync-id-123',
        'SUCCESS',
        expect.objectContaining({ deleted: true })
      );
    });
  });
});