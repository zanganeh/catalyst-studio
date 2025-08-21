import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { DeploymentService } from '@/lib/services/deployment-service';

// Mock dependencies
jest.mock('@/lib/services/deployment-service');
jest.mock('@/lib/prisma', () => ({
  prisma: {}
}));

describe('/api/v1/sync/changes', () => {
  let mockDeploymentService: jest.Mocked<DeploymentService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock deployment service
    mockDeploymentService = {
      getChangeSummary: jest.fn(),
      detectChanges: jest.fn()
    } as unknown as DeploymentService;
    
    (DeploymentService as jest.MockedClass<typeof DeploymentService>).mockImplementation(() => mockDeploymentService);
  });
  
  describe('GET /api/v1/sync/changes', () => {
    it('should return change summary for all content types', async () => {
      const mockChanges = {
        summary: {
          total: 5,
          created: 2,
          updated: 2,
          deleted: 1,
          unchanged: 10
        },
        details: {
          created: ['type1', 'type2'],
          updated: ['type3', 'type4'],
          deleted: ['type5']
        }
      };
      
      mockDeploymentService.getChangeSummary.mockResolvedValue(mockChanges);
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.provider).toBe('optimizely');
      expect(data.summary).toEqual(mockChanges.summary);
      expect(data.estimatedSyncTime).toBe(10); // 5 changes * 2 seconds
      expect(data.details).toBeUndefined(); // Not requested
    });
    
    it('should return detailed changes when includeDetails=true', async () => {
      const mockChanges = {
        summary: {
          total: 2,
          created: 1,
          updated: 1,
          deleted: 0,
          unchanged: 0
        },
        details: {
          created: [{ key: 'new_type', fieldsCount: 5 }],
          updated: [{ key: 'modified_type', fieldChanges: { added: 1, modified: 2, removed: 0 } }]
        }
      };
      
      mockDeploymentService.getChangeSummary.mockResolvedValue(mockChanges);
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes?includeDetails=true');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.details).toEqual(mockChanges.details);
    });
    
    it('should filter by specific content types', async () => {
      const mockChanges = {
        summary: { total: 1, created: 0, updated: 1, deleted: 0, unchanged: 0 }
      };
      
      mockDeploymentService.getChangeSummary.mockResolvedValue(mockChanges);
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes?contentTypes=type1,type2');
      await GET(request);
      
      expect(mockDeploymentService.getChangeSummary).toHaveBeenCalledWith(['type1', 'type2']);
    });
    
    it('should handle different providers', async () => {
      mockDeploymentService.getChangeSummary.mockResolvedValue({ summary: {} });
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes?provider=contentful');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.provider).toBe('contentful');
    });
    
    it('should handle errors gracefully', async () => {
      mockDeploymentService.getChangeSummary.mockRejectedValue(new Error('API connection failed'));
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to detect changes');
      expect(data.message).toBe('API connection failed');
    });
  });
  
  describe('POST /api/v1/sync/changes/detect', () => {
    it('should trigger full change detection', async () => {
      const mockChanges = {
        summary: { total: 10, created: 3, updated: 5, deleted: 2 }
      };
      
      mockDeploymentService.detectChanges.mockResolvedValue(mockChanges);
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes/detect', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.changes).toEqual(mockChanges);
      expect(mockDeploymentService.detectChanges).toHaveBeenCalled();
    });
    
    it('should trigger batch detection for specific types', async () => {
      const mockBatchResult = {
        summary: { total: 2, created: 1, updated: 1 }
      };
      
      mockDeploymentService.getChangeSummary.mockResolvedValue(mockBatchResult);
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes/detect', {
        method: 'POST',
        body: JSON.stringify({
          contentTypeKeys: ['type1', 'type2']
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.changes).toEqual(mockBatchResult);
      expect(mockDeploymentService.getChangeSummary).toHaveBeenCalledWith(['type1', 'type2']);
    });
    
    it('should validate contentTypeKeys is an array', async () => {
      const request = new NextRequest('http://localhost/api/v1/sync/changes/detect', {
        method: 'POST',
        body: JSON.stringify({
          contentTypeKeys: 'not-an-array'
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('contentTypeKeys must be an array');
    });
    
    it('should handle provider parameter', async () => {
      mockDeploymentService.detectChanges.mockResolvedValue({ summary: {} });
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes/detect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'contentful'
        })
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.provider).toBe('contentful');
    });
    
    it('should handle errors during detection', async () => {
      mockDeploymentService.detectChanges.mockRejectedValue(new Error('Database connection lost'));
      
      const request = new NextRequest('http://localhost/api/v1/sync/changes/detect', {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to execute change detection');
      expect(data.message).toBe('Database connection lost');
    });
  });
});