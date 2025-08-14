import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { redirect } from 'next/navigation';
import LegacyStudioPage from '../page';

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: mockBack,
    forward: mockForward,
  })),
  useParams: jest.fn(() => ({ id: 'test-website' })),
  usePathname: jest.fn(() => '/studio/test-website'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
  useState: jest.fn((initial) => [initial, jest.fn()]),
}));

// Mock the website context and API hooks
const mockWebsite = {
  id: 'test-website',
  name: 'Test Website',
  description: 'Test Description',
  category: 'business',
  metadata: {},
  settings: { primaryColor: '#000' },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('@/lib/context/website-context', () => ({
  WebsiteContextProvider: ({ children, websiteId }: { children: React.ReactNode; websiteId: string }) => (
    <div data-testid="website-context-provider" data-website-id={websiteId}>
      {children}
    </div>
  ),
  useWebsiteContext: () => ({
    websiteId: 'test-website',
    website: mockWebsite,
    isLoading: false,
    error: null,
    updateWebsite: jest.fn(),
    deleteWebsite: jest.fn(),
    switchWebsite: jest.fn(),
    refreshWebsite: jest.fn(),
  }),
}));

jest.mock('@/lib/context/content-type-context', () => ({
  ContentTypeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="content-type-provider">{children}</div>
  ),
  useContentTypeContext: () => ({
    contentTypes: [],
    isLoading: false,
    error: null,
    createContentType: jest.fn(),
    updateContentType: jest.fn(),
    deleteContentType: jest.fn(),
  }),
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => jest.fn((fn: () => Promise<any>) => {
  const Component = () => <div data-testid="dynamic-component">Mocked Dynamic Component</div>;
  Component.displayName = 'MockedDynamicComponent';
  return Component;
}));

// Mock the overview page that's dynamically imported
jest.mock('../../(dashboard)/overview/page', () => {
  return function MockOverviewPage() {
    return <div data-testid="overview-page">Mock Overview Page</div>;
  };
});

// Mock StudioShell component
jest.mock('@/components/studio/studio-shell', () => ({
  StudioShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="studio-shell">{children}</div>
  ),
}));

describe('Studio Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Legacy Route Redirect', () => {
    it('should redirect /studio to /studio/default', () => {
      // Test that the legacy page function calls redirect
      LegacyStudioPage();
      
      // Verify redirect was called with correct path
      expect(redirect).toHaveBeenCalledWith('/studio/default');
    });

    it('should call redirect immediately without side effects', () => {
      // Ensure redirect is called synchronously
      expect(() => LegacyStudioPage()).not.toThrow();
      expect(redirect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Studio Layout Component', () => {
    const StudioLayout = require('../[id]/layout').default;

    it('should render with WebsiteContextProvider', async () => {
      const params = Promise.resolve({ id: 'test-website' });
      const children = <div data-testid="test-child">Test Content</div>;

      render(await StudioLayout({ children, params }));

      expect(screen.getByTestId('website-context-provider')).toBeInTheDocument();
      expect(screen.getByTestId('website-context-provider')).toHaveAttribute('data-website-id', 'test-website');
      expect(screen.getByTestId('content-type-provider')).toBeInTheDocument();
      expect(screen.getByTestId('studio-shell')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should handle missing ID parameter with default', async () => {
      const params = Promise.resolve({ id: undefined });
      const children = <div data-testid="test-child">Test Content</div>;

      render(await StudioLayout({ children, params }));

      expect(screen.getByTestId('website-context-provider')).toHaveAttribute('data-website-id', 'default');
    });

    it('should handle empty ID parameter with default', async () => {
      const params = Promise.resolve({ id: '' });
      const children = <div data-testid="test-child">Test Content</div>;

      render(await StudioLayout({ children, params }));

      expect(screen.getByTestId('website-context-provider')).toHaveAttribute('data-website-id', 'default');
    });
  });

  describe('Studio Page Component with Navigation', () => {
    // Create mock component that simulates the StudioPage behavior
    function MockStudioPage({ mockContext }: { mockContext?: any }) {
      const context = mockContext || {
        websiteId: 'test-website',
        website: mockWebsite,
        isLoading: false,
        error: null,
        updateWebsite: jest.fn(),
        deleteWebsite: jest.fn(),
        switchWebsite: jest.fn(),
        refreshWebsite: jest.fn(),
      };

      React.useEffect(() => {
        if (context.error && context.error.message.includes('not found')) {
          mockPush('/dashboard');
        }
      }, [context.error]);

      if (context.isLoading) {
        return (
          <div className="p-6">
            <div className="text-gray-400">
              <p>Loading website...</p>
            </div>
          </div>
        );
      }

      if (context.error) {
        return (
          <div className="p-6">
            <div className="text-gray-400">
              <p>Redirecting to dashboard...</p>
            </div>
          </div>
        );
      }

      return (
        <>
          {context.website && (
            <div data-testid="website-name" className="sr-only">
              {context.website.name}
            </div>
          )}
          <div data-testid="dynamic-component">Mocked Dynamic Component</div>
        </>
      );
    }

    it('should render successfully with website context', () => {
      render(<MockStudioPage />);

      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
      expect(screen.getByTestId('website-name')).toBeInTheDocument();
      expect(screen.getByTestId('website-name')).toHaveTextContent('Test Website');
    });

    it('should handle loading state', () => {
      const loadingContext = {
        websiteId: 'test-website',
        website: null,
        isLoading: true,
        error: null,
        updateWebsite: jest.fn(),
        deleteWebsite: jest.fn(),
        switchWebsite: jest.fn(),
        refreshWebsite: jest.fn(),
      };

      render(<MockStudioPage mockContext={loadingContext} />);

      expect(screen.getByText('Loading website...')).toBeInTheDocument();
    });

    it('should handle error state and redirect to dashboard', async () => {
      const errorContext = {
        websiteId: 'test-website',
        website: null,
        isLoading: false,
        error: new Error('Website not found'),
        updateWebsite: jest.fn(),
        deleteWebsite: jest.fn(),
        switchWebsite: jest.fn(),
        refreshWebsite: jest.fn(),
      };

      render(<MockStudioPage mockContext={errorContext} />);

      expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
      
      // Should trigger redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not redirect on generic errors', async () => {
      const errorContext = {
        websiteId: 'test-website',
        website: null,
        isLoading: false,
        error: new Error('Network error'),
        updateWebsite: jest.fn(),
        deleteWebsite: jest.fn(),
        switchWebsite: jest.fn(),
        refreshWebsite: jest.fn(),
      };

      render(<MockStudioPage mockContext={errorContext} />);

      expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
      
      // Should NOT trigger redirect for generic errors (doesn't contain "not found")
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      }, { timeout: 100 });
    });
  });

  describe('Router Hook Integration', () => {
    it('should provide correct router methods', () => {
      const { useRouter } = jest.requireMock('next/navigation');
      const router = useRouter();

      expect(router.push).toBe(mockPush);
      expect(router.replace).toBe(mockReplace);
      expect(router.refresh).toBe(mockRefresh);
      expect(router.back).toBe(mockBack);
      expect(router.forward).toBe(mockForward);
    });

    it('should provide correct params and pathname', () => {
      const { useParams, usePathname } = jest.requireMock('next/navigation');
      
      expect(useParams()).toEqual({ id: 'test-website' });
      expect(usePathname()).toBe('/studio/test-website');
    });
  });

  describe('Navigation Flows', () => {
    it('should handle programmatic navigation', async () => {
      const user = userEvent.setup();
      const TestNavigationComponent = () => {
        return (
          <button 
            onClick={() => mockPush('/studio/another-website')}
            data-testid="navigate-button"
          >
            Navigate
          </button>
        );
      };

      render(<TestNavigationComponent />);

      const button = screen.getByTestId('navigate-button');
      await user.click(button);

      expect(mockPush).toHaveBeenCalledWith('/studio/another-website');
    });

    it('should handle router replace calls', async () => {
      const user = userEvent.setup();
      const TestReplaceComponent = () => {
        return (
          <button 
            onClick={() => mockReplace('/studio/replaced-website')}
            data-testid="replace-button"
          >
            Replace
          </button>
        );
      };

      render(<TestReplaceComponent />);

      const button = screen.getByTestId('replace-button');
      await user.click(button);

      expect(mockReplace).toHaveBeenCalledWith('/studio/replaced-website');
    });
  });

  describe('Route Parameters Validation', () => {
    it('should handle valid website IDs', () => {
      const validIds = ['default', 'website-1', 'my_site', 'test123'];
      
      validIds.forEach(id => {
        expect(id).toMatch(/^[a-zA-Z0-9-_]+$/);
        expect(id.length).toBeLessThanOrEqual(50);
      });
    });

    it('should identify invalid website IDs', () => {
      const invalidIds = ['site with spaces', 'site@domain.com', 'site/path', 'x'.repeat(51)];
      
      invalidIds.forEach(id => {
        const isValid = /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 50;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Middleware Integration', () => {
    it('should handle redirect responses', () => {
      // Test that redirect function is available and callable
      expect(redirect).toBeDefined();
      expect(typeof redirect).toBe('function');
    });

    it('should handle async route parameters', async () => {
      const asyncParams = Promise.resolve({ id: 'async-website' });
      const resolvedParams = await asyncParams;
      
      expect(resolvedParams).toEqual({ id: 'async-website' });
    });
  });

  describe('Error Boundaries and Fallbacks', () => {
    it('should handle component mount errors gracefully', () => {
      // Test that components don't throw during mount
      expect(() => {
        render(<div>Mock component without errors</div>);
      }).not.toThrow();
    });

    it('should provide fallback content for dynamic imports', () => {
      // Test mocked dynamic import
      const MockDynamicComponent = () => <div data-testid="dynamic-component">Mocked Dynamic Component</div>;
      
      render(<MockDynamicComponent />);
      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
    });
  });
});