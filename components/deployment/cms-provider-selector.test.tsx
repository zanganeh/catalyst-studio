import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CMSProviderSelector } from './cms-provider-selector';
// Import removed - not used in tests

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: { 
      children: React.ReactNode; 
      whileHover?: unknown;
      whileTap?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      [key: string]: unknown 
    }) => {
      // Filter out animation-related props and pass only DOM-compatible props
      const { onClick, className, style, role, tabIndex, 'aria-label': ariaLabel, id, key } = props;
      return (
        <div 
          onClick={onClick} 
          className={className} 
          style={style}
          role={role}
          tabIndex={tabIndex}
          aria-label={ariaLabel}
          id={id}
          key={key}
        >
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CMSProviderSelector', () => {
  const mockOnProviderSelect = jest.fn();
  
  beforeEach(() => {
    mockOnProviderSelect.mockClear();
    localStorage.clear();
  });

  it('renders all three CMS providers', () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    expect(screen.getByText('Optimizely')).toBeInTheDocument();
    expect(screen.getByText('Contentful')).toBeInTheDocument();
    expect(screen.getByText('Strapi')).toBeInTheDocument();
  });

  it('shows disconnected status by default', () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const notConnectedElements = screen.getAllByText('Not Connected');
    expect(notConnectedElements).toHaveLength(3);
  });

  it('opens configuration modal when clicking on disconnected provider', async () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    // The provider cards are divs with onClick, not buttons
    const optimizelyCard = screen.getByText('Optimizely').closest('div');
    fireEvent.click(optimizelyCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Configure Optimizely')).toBeInTheDocument();
    });
  });

  it('validates required fields in configuration modal', async () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const optimizelyCard = screen.getByText('Optimizely').closest('div');
    fireEvent.click(optimizelyCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Configure Optimizely')).toBeInTheDocument();
    });
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Key is required')).toBeInTheDocument();
      expect(screen.getByText('Project ID is required')).toBeInTheDocument();
      expect(screen.getByText('Environment is required')).toBeInTheDocument();
    });
  });

  it('validates URL format for Strapi endpoint', async () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const strapiCard = screen.getByText('Strapi').closest('div');
    fireEvent.click(strapiCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Configure Strapi')).toBeInTheDocument();
    });
    
    const endpointInput = screen.getByPlaceholderText('https://your-strapi-instance.com');
    fireEvent.change(endpointInput, { target: { value: 'not-a-url' } });
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Endpoint must be a valid URL')).toBeInTheDocument();
    });
  });

  it('saves provider configuration to localStorage', async () => {
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const contentfulCard = screen.getByText('Contentful').closest('div');
    fireEvent.click(contentfulCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Configure Contentful')).toBeInTheDocument();
    });
    
    // Fill in the configuration
    const apiKeyInput = screen.getByPlaceholderText('Enter your Contentful API token');
    const spaceIdInput = screen.getByPlaceholderText('e.g., abc123xyz');
    const environmentInput = screen.getByPlaceholderText('e.g., master');
    
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    fireEvent.change(spaceIdInput, { target: { value: 'test-space' } });
    fireEvent.change(environmentInput, { target: { value: 'master' } });
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    
    // Wait for simulated connection
    await waitFor(() => {
      const stored = localStorage.getItem('cms-provider-configs');
      expect(stored).toBeTruthy();
      const configs = JSON.parse(stored!);
      expect(configs.contentful).toBeDefined();
      expect(configs.contentful.config.apiKey).toBe('test-api-key');
    }, { timeout: 3000 });
  });

  it('restores saved configurations on mount', () => {
    const savedConfigs = {
      optimizely: {
        config: { apiKey: 'saved-key', projectId: '12345', environment: 'prod' },
        lastConnected: new Date().toISOString(),
        connectionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    localStorage.setItem('cms-provider-configs', JSON.stringify(savedConfigs));
    
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    // Should show connected status for Optimizely
    const optimizelyCard = screen.getByText('Optimizely').closest('div');
    expect(optimizelyCard).toHaveTextContent('Connected');
    expect(optimizelyCard).toHaveTextContent('Ready to deploy');
  });

  it('highlights selected provider', () => {
    render(
      <CMSProviderSelector
        onProviderSelect={mockOnProviderSelect}
        selectedProviderId="contentful"
      />
    );
    
    const contentfulCard = screen.getByText('Contentful').closest('div');
    expect(contentfulCard).toHaveClass('ring-2', 'ring-[#FF5500]');
  });

  it('allows reconfiguration of connected provider', async () => {
    const savedConfigs = {
      strapi: {
        config: { endpoint: 'https://test.com', apiKey: 'test-key' },
        lastConnected: new Date().toISOString(),
        connectionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    localStorage.setItem('cms-provider-configs', JSON.stringify(savedConfigs));
    
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const settingsButton = screen.getByRole('button', { name: '' });
    fireEvent.click(settingsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Configure Strapi')).toBeInTheDocument();
      const endpointInput = screen.getByDisplayValue('https://test.com');
      expect(endpointInput).toBeInTheDocument();
    });
  });

  it('calls onProviderSelect when clicking connected provider', () => {
    const savedConfigs = {
      optimizely: {
        config: { apiKey: 'key', projectId: '123', environment: 'prod' },
        lastConnected: new Date().toISOString(),
        connectionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
    localStorage.setItem('cms-provider-configs', JSON.stringify(savedConfigs));
    
    render(<CMSProviderSelector onProviderSelect={mockOnProviderSelect} />);
    
    const optimizelyCard = screen.getByText('Optimizely').closest('div');
    fireEvent.click(optimizelyCard!);
    
    expect(mockOnProviderSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'optimizely',
        connectionStatus: 'connected',
      })
    );
  });
});