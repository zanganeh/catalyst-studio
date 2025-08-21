import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma Client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    syncState: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn()
    }
  }))
}));

describe('Sync State API', () => {
  let prisma: ReturnType<typeof getPrismaClientMock>;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/sync/state', () => {
    it('should get specific sync state by typeKey', async () => {
      const mockState = {
        typeKey: 'test_type',
        localHash: 'hash123',
        syncStatus: 'in_sync'
      };
      
      prisma.syncState.findUnique.mockResolvedValue(mockState);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state?typeKey=test_type');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.state).toEqual(mockState);
    });

    it('should return 404 for non-existent state', async () => {
      prisma.syncState.findUnique.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state?typeKey=nonexistent');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Sync state not found');
    });

    it('should get types updated since timestamp', async () => {
      const mockStates = [
        { typeKey: 'type1' },
        { typeKey: 'type2' }
      ];
      
      prisma.syncState.findMany.mockResolvedValue(mockStates);
      
      const timestamp = new Date().toISOString();
      const request = new NextRequest(`http://localhost/api/v1/sync/state?since=${timestamp}`);
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.types).toEqual(['type1', 'type2']);
    });

    it('should get interrupted sync types', async () => {
      const mockStates = [
        { typeKey: 'interrupted1' },
        { typeKey: 'interrupted2' }
      ];
      
      prisma.syncState.findMany.mockResolvedValue(mockStates);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state?status=interrupted');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.types).toEqual(['interrupted1', 'interrupted2']);
    });

    it('should get all sync states', async () => {
      const mockStates = [
        { typeKey: 'type1', syncStatus: 'in_sync' },
        { typeKey: 'type2', syncStatus: 'pending' }
      ];
      
      prisma.syncState.findMany.mockResolvedValue(mockStates);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.states).toEqual(mockStates);
    });
  });

  describe('POST /api/v1/sync/state', () => {
    it('should update sync state', async () => {
      const mockState = {
        typeKey: 'test_type',
        localHash: 'new_hash',
        syncStatus: 'modified'
      };
      
      prisma.syncState.upsert.mockResolvedValue(mockState);
      prisma.syncState.findUnique.mockResolvedValue(mockState);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'POST',
        body: JSON.stringify({
          typeKey: 'test_type',
          state: {
            localHash: 'new_hash',
            syncStatus: 'modified'
          }
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.state).toEqual(mockState);
    });

    it('should handle markAsSynced action', async () => {
      const mockState = {
        typeKey: 'test_type',
        localHash: 'hash123',
        remoteHash: 'hash123',
        syncStatus: 'in_sync'
      };
      
      prisma.syncState.upsert.mockResolvedValue(mockState);
      prisma.syncState.findUnique.mockResolvedValue(mockState);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'POST',
        body: JSON.stringify({
          typeKey: 'test_type',
          action: 'markAsSynced',
          state: {
            localHash: 'hash123',
            remoteHash: 'hash123'
          }
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing typeKey', async () => {
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'POST',
        body: JSON.stringify({
          state: { syncStatus: 'pending' }
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('typeKey is required');
    });
  });

  describe('PUT /api/v1/sync/state', () => {
    it('should calculate sync delta', async () => {
      const mockState = {
        typeKey: 'test_type',
        localHash: 'old_local',
        remoteHash: 'old_remote'
      };
      
      prisma.syncState.findUnique.mockResolvedValue(mockState);
      
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'PUT',
        body: JSON.stringify({
          typeKey: 'test_type',
          currentLocalHash: 'new_local',
          currentRemoteHash: 'old_remote'
        })
      });
      
      const response = await PUT(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.delta.action).toBe('PUSH');
      expect(data.recommendation).toBe('Push local changes to remote system');
    });

    it('should return 400 for missing parameters', async () => {
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'PUT',
        body: JSON.stringify({
          typeKey: 'test_type'
        })
      });
      
      const response = await PUT(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('DELETE /api/v1/sync/state', () => {
    it('should clear specific sync state', async () => {
      prisma.syncState.delete.mockResolvedValue({});
      
      const request = new NextRequest('http://localhost/api/v1/sync/state?typeKey=test_type', {
        method: 'DELETE'
      });
      
      const response = await DELETE(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Sync state cleared for test_type');
    });

    it('should reset all sync states', async () => {
      prisma.syncState.updateMany.mockResolvedValue({ count: 5 });
      
      const request = new NextRequest('http://localhost/api/v1/sync/state?resetAll=true', {
        method: 'DELETE'
      });
      
      const response = await DELETE(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('All sync states reset');
    });

    it('should return 400 for missing typeKey', async () => {
      const request = new NextRequest('http://localhost/api/v1/sync/state', {
        method: 'DELETE'
      });
      
      const response = await DELETE(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('typeKey is required');
    });
  });
});