import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WebsiteContextProvider, useWebsiteContext } from '../website-context';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';

// Mock the WebsiteStorageService
jest.mock('@/lib/storage/website-storage.service');

describe('WebsiteContext', () => {
  let mockStorageService: jest.Mocked<WebsiteStorageService>;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock implementation
    mockStorageService = {
      initializeDB: jest.fn().mockResolvedValue(undefined),
      listWebsites: jest.fn().mockResolvedValue([
        {
          id: 'test-website',
          name: 'Test Website',
          createdAt: new Date(),
          lastModified: new Date(),
          storageQuota: 50 * 1024 * 1024,
          category: 'test'
        }
      ]),
      getWebsiteData: jest.fn().mockResolvedValue({
        config: {},
        content: {},
        assets: {},
        aiContext: {}
      }),
      createWebsite: jest.fn().mockResolvedValue('default'),
      saveWebsiteData: jest.fn().mockResolvedValue(undefined),
      updateWebsiteMetadata: jest.fn().mockResolvedValue(undefined),
      deleteWebsiteData: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<WebsiteStorageService>;
    
    // Mock the constructor
    (WebsiteStorageService as jest.MockedClass<typeof WebsiteStorageService>).mockImplementation(() => mockStorageService);
  });

  describe('WebsiteContextProvider', () => {
    it('should load website data on mount', async () => {
      const TestComponent = () => {
        const { website, isLoading } = useWebsiteContext();
        return (
          <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
            <div data-testid="website">{website ? 'has-website' : 'no-website'}</div>
          </div>
        );
      };

      render(
        <WebsiteContextProvider websiteId="test-website">
          <TestComponent />
        </WebsiteContextProvider>
      );

      // Initially should be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
      
      // Should have loaded website data
      expect(screen.getByTestId('website')).toHaveTextContent('has-website');
      expect(mockStorageService.initializeDB).toHaveBeenCalled();
      expect(mockStorageService.listWebsites).toHaveBeenCalled();
      expect(mockStorageService.getWebsiteData).toHaveBeenCalledWith('test-website');
    });

    it('should create default website if not found', async () => {
      // Mock no websites exist
      mockStorageService.listWebsites.mockResolvedValue([]);
      
      const TestComponent = () => {
        const { websiteId } = useWebsiteContext();
        return <div data-testid="website-id">{websiteId}</div>;
      };

      render(
        <WebsiteContextProvider websiteId="default">
          <TestComponent />
        </WebsiteContextProvider>
      );

      await waitFor(() => {
        expect(mockStorageService.createWebsite).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Website',
            category: 'default'
          })
        );
      });
    });

    it('should handle errors gracefully', async () => {
      const testError = new Error('Failed to load');
      mockStorageService.getWebsiteData.mockRejectedValue(testError);
      
      const TestComponent = () => {
        const { error } = useWebsiteContext();
        return <div data-testid="error">{error?.message || 'no-error'}</div>;
      };

      render(
        <WebsiteContextProvider websiteId="test-website">
          <TestComponent />
        </WebsiteContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load');
      });
    });

    it('should update website data', async () => {
      const TestComponent = () => {
        const { updateWebsite } = useWebsiteContext();
        React.useEffect(() => {
          updateWebsite({ config: { updated: true } });
        }, [updateWebsite]);
        return <div>Test</div>;
      };

      render(
        <WebsiteContextProvider websiteId="test-website">
          <TestComponent />
        </WebsiteContextProvider>
      );

      await waitFor(() => {
        expect(mockStorageService.saveWebsiteData).toHaveBeenCalledWith(
          'test-website',
          expect.objectContaining({ config: { updated: true } })
        );
      });
    });

    it('should delete website data', async () => {
      const TestComponent = () => {
        const { deleteWebsite } = useWebsiteContext();
        React.useEffect(() => {
          deleteWebsite();
        }, [deleteWebsite]);
        return <div>Test</div>;
      };

      render(
        <WebsiteContextProvider websiteId="test-website">
          <TestComponent />
        </WebsiteContextProvider>
      );

      await waitFor(() => {
        expect(mockStorageService.deleteWebsiteData).toHaveBeenCalledWith('test-website');
      });
    });
  });

  describe('useWebsiteContext', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useWebsiteContext();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWebsiteContext must be used within WebsiteContextProvider');

      console.error = originalError;
    });
  });
});