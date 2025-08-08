/**
 * Component Tests
 * Tests layout components and feature flag integration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureFlagProvider } from '@/contexts/feature-flag-context';
import { LayoutContainer, ChatPanel, NavigationPanel, MainContentPanel } from '@/components/layout/layout-container-v2';
import { CatalystBranding } from '@/components/catalyst-branding-v2';
import { ErrorBoundary, IsolatedErrorBoundary } from '@/components/error-boundary-enhanced';

// Mock the feature config
jest.mock('@/config/features', () => ({
  isFeatureEnabled: jest.fn((name: string) => false),
  enableFeature: jest.fn(),
  disableFeature: jest.fn(),
  clearFeatureCache: jest.fn()
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('Layout Components', () => {
  describe('LayoutContainer', () => {
    it('should render children when feature is disabled', () => {
      render(
        <FeatureFlagProvider>
          <LayoutContainer>
            <div data-testid="child">Test Content</div>
          </LayoutContainer>
        </FeatureFlagProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child').parentElement?.className).not.toContain('grid');
    });

    it('should apply grid layout when feature is enabled', async () => {
      const { isFeatureEnabled } = require('@/config/features');
      isFeatureEnabled.mockImplementation((name: string) => 
        name === 'threeColumnLayout'
      );
      
      render(
        <FeatureFlagProvider>
          <LayoutContainer>
            <div data-testid="child">Test Content</div>
          </LayoutContainer>
        </FeatureFlagProvider>
      );
      
      await waitFor(() => {
        const container = screen.getByTestId('child').parentElement;
        expect(container?.className).toContain('grid');
        expect(container?.className).toContain('grid-cols-[360px_260px_1fr]');
      });
    });
  });

  describe('ChatPanel', () => {
    it('should render children without modifications when disabled', () => {
      render(
        <FeatureFlagProvider>
          <ChatPanel>
            <div data-testid="chat">Chat Content</div>
          </ChatPanel>
        </FeatureFlagProvider>
      );
      
      expect(screen.getByTestId('chat')).toBeInTheDocument();
    });

    it('should apply styling when features are enabled', async () => {
      const { isFeatureEnabled } = require('@/config/features');
      isFeatureEnabled.mockImplementation((name: string) => 
        ['threeColumnLayout', 'catalystBranding', 'glassMorphism'].includes(name)
      );
      
      render(
        <FeatureFlagProvider>
          <ChatPanel>
            <div data-testid="chat">Chat Content</div>
          </ChatPanel>
        </FeatureFlagProvider>
      );
      
      await waitFor(() => {
        const panel = screen.getByTestId('chat').parentElement;
        expect(panel?.className).toContain('border-r');
        expect(panel?.className).toContain('backdrop-blur-md');
      });
    });
  });

  describe('NavigationPanel', () => {
    it('should not render when layout is disabled', () => {
      render(
        <FeatureFlagProvider>
          <NavigationPanel>
            <div data-testid="nav">Navigation</div>
          </NavigationPanel>
        </FeatureFlagProvider>
      );
      
      expect(screen.queryByTestId('nav')).not.toBeInTheDocument();
    });

    it('should render with placeholder when enabled without children', async () => {
      const { isFeatureEnabled } = require('@/config/features');
      isFeatureEnabled.mockImplementation((name: string) => 
        name === 'threeColumnLayout'
      );
      
      render(
        <FeatureFlagProvider>
          <NavigationPanel />
        </FeatureFlagProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Navigation (Coming Soon)')).toBeInTheDocument();
      });
    });
  });

  describe('MainContentPanel', () => {
    it('should not render when layout is disabled', () => {
      render(
        <FeatureFlagProvider>
          <MainContentPanel>
            <div data-testid="main">Main Content</div>
          </MainContentPanel>
        </FeatureFlagProvider>
      );
      
      expect(screen.queryByTestId('main')).not.toBeInTheDocument();
    });

    it('should render with glass morphism when enabled', async () => {
      const { isFeatureEnabled } = require('@/config/features');
      isFeatureEnabled.mockImplementation((name: string) => 
        ['threeColumnLayout', 'glassMorphism', 'catalystBranding'].includes(name)
      );
      
      render(
        <FeatureFlagProvider>
          <MainContentPanel>
            <div data-testid="main">Main Content</div>
          </MainContentPanel>
        </FeatureFlagProvider>
      );
      
      await waitFor(() => {
        const panel = screen.getByTestId('main').parentElement;
        expect(panel?.className).toContain('backdrop-blur-sm');
        expect(panel?.className).toContain('bg-gray-950/80');
      });
    });
  });
});

describe('CatalystBranding', () => {
  it('should apply classes to body when enabled', async () => {
    const { isFeatureEnabled } = require('@/config/features');
    isFeatureEnabled.mockImplementation((name: string) => 
      name === 'catalystBranding'
    );
    
    render(
      <FeatureFlagProvider>
        <CatalystBranding />
      </FeatureFlagProvider>
    );
    
    await waitFor(() => {
      expect(document.body.classList.contains('catalyst-branding')).toBe(true);
      expect(document.body.classList.contains('catalyst-dark')).toBe(true);
    });
  });

  it('should cleanup classes on unmount', async () => {
    const { isFeatureEnabled } = require('@/config/features');
    isFeatureEnabled.mockImplementation(() => true);
    
    const { unmount } = render(
      <FeatureFlagProvider>
        <CatalystBranding />
      </FeatureFlagProvider>
    );
    
    await waitFor(() => {
      expect(document.body.classList.contains('catalyst-branding')).toBe(true);
    });
    
    unmount();
    
    expect(document.body.classList.contains('catalyst-branding')).toBe(false);
    expect(document.body.classList.contains('catalyst-dark')).toBe(false);
  });
});

describe('ErrorBoundary', () => {
  // Component that throws an error
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should catch errors and display fallback', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Temporary Error/)).toBeInTheDocument();
    expect(screen.getByText(/Attempting to recover/)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should use custom fallback when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <ErrorBoundary fallback={<div>Custom Error Message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should reset when reset button is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    let shouldThrow = true;
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Temporary Error/)).toBeInTheDocument();
    
    // Fix the error
    shouldThrow = false;
    
    // Click reset
    screen.getByText('Reset Now').click();
    
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should show permanent error after multiple failures', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Simulate multiple errors
    for (let i = 0; i < 3; i++) {
      screen.getByText(/Reset|Try Again/).click();
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    }
    
    expect(screen.getByText(/Component Error/)).toBeInTheDocument();
    expect(screen.getByText(/multiple errors/)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  describe('IsolatedErrorBoundary', () => {
    it('should isolate errors to specific components', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <div>
          <IsolatedErrorBoundary componentName="TestComponent">
            <ThrowError shouldThrow={true} />
          </IsolatedErrorBoundary>
          <div data-testid="sibling">Sibling Component</div>
        </div>
      );
      
      expect(screen.getByText(/Temporary Error in TestComponent/)).toBeInTheDocument();
      expect(screen.getByTestId('sibling')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});