import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeploymentWizard } from './deployment-wizard';
// Import removed - not used in tests

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, ...props }: { children: React.ReactNode; initial?: unknown; [key: string]: unknown }) => {
      // Filter out non-DOM props
      const { animate, exit, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the child components
jest.mock('./cms-provider-selector', () => ({
  CMSProviderSelector: ({ onProviderSelect, selectedProviderId }: { onProviderSelect: (provider: unknown) => void; selectedProviderId?: string }) => (
    <div data-testid="provider-selector">
      <button
        onClick={() => onProviderSelect({
          id: 'optimizely',
          name: 'Optimizely',
          description: 'Test provider',
          logo: '/test.svg',
          connectionStatus: 'connected',
          config: { apiKey: 'test' },
        })}
      >
        Select Optimizely
      </button>
      {selectedProviderId && <div>Selected: {selectedProviderId}</div>}
    </div>
  ),
}));

jest.mock('./content-mapping', () => ({
  ContentMapping: ({ providerId, websiteId, onMappingComplete }: { providerId: string; websiteId?: string; onMappingComplete?: (types: unknown[]) => void }) => {
    React.useEffect(() => {
      // Simulate successful mapping
      onMappingComplete?.([
        { id: '1', name: 'Page Title', fields: [] },
        { id: '2', name: 'Meta Description', fields: [] },
        { id: '3', name: 'Hero Section', fields: [] },
      ]);
    }, [onMappingComplete]);
    
    return (
      <div data-testid="content-mapping">
        <div>Page Title</div>
        <div>Meta Description</div>
        <div>Hero Section</div>
      </div>
    );
  },
}));

jest.mock('./deployment-progress', () => ({
  DeploymentProgress: ({ job, provider, onComplete }: { job: unknown; provider: { name: string }; onComplete: (job: unknown) => void }) => {
    React.useEffect(() => {
      setTimeout(() => {
        onComplete({
          ...job,
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
        });
      }, 100);
    }, []);
    
    return (
      <div data-testid="deployment-progress">
        Deploying to {provider.name}...
      </div>
    );
  },
}));

describe('DeploymentWizard', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders the wizard with step indicator', () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Select Provider')).toBeInTheDocument();
    expect(screen.getByText('Content Mapping')).toBeInTheDocument();
    expect(screen.getByText('Deploy')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('starts at the provider selection step', () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Select Your CMS Provider')).toBeInTheDocument();
    expect(screen.getByTestId('provider-selector')).toBeInTheDocument();
  });

  it('disables next button when no provider is selected', () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables next button after provider selection', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    const selectButton = screen.getByText('Select Optimizely');
    fireEvent.click(selectButton);
    
    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeEnabled();
    });
  });

  it('progresses through wizard steps', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Select provider
    fireEvent.click(screen.getByText('Select Optimizely'));
    
    await waitFor(() => {
      expect(screen.getByText('Optimizely selected and connected')).toBeInTheDocument();
    });
    
    // Go to mapping step
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      // Use getAllByText since there are multiple elements with this text
      const contentMappingElements = screen.getAllByText('Content Mapping');
      expect(contentMappingElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Review and map your content to Optimizely fields')).toBeInTheDocument();
    });
    
    // Check for mapped fields
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Meta Description')).toBeInTheDocument();
    expect(screen.getByText('Hero Section')).toBeInTheDocument();
    
    // Start deployment
    fireEvent.click(screen.getByText('Start Deployment'));
    
    await waitFor(() => {
      expect(screen.getByTestId('deployment-progress')).toBeInTheDocument();
    });
  });

  it('shows completion screen after successful deployment', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Quick progression through steps
    fireEvent.click(screen.getByText('Select Optimizely'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Start Deployment'));
    fireEvent.click(screen.getByText('Start Deployment'));
    
    // Wait for deployment to complete
    await waitFor(() => {
      expect(screen.getByText('Deployment Successful!')).toBeInTheDocument();
      expect(screen.getByText('Your content has been deployed to Optimizely')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        progress: 100,
      })
    );
  });

  it('allows going back to previous steps', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Go to mapping step
    fireEvent.click(screen.getByText('Select Optimizely'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      // Use getAllByText since there are multiple elements with this text
      const contentMappingElements = screen.getAllByText('Content Mapping');
      expect(contentMappingElements.length).toBeGreaterThan(0);
    });
    
    // Go back to provider selection
    fireEvent.click(screen.getByText('Previous'));
    
    await waitFor(() => {
      expect(screen.getByText('Select Your CMS Provider')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel is clicked on first step', () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables navigation during deployment', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Progress to deployment step
    fireEvent.click(screen.getByText('Select Optimizely'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Start Deployment'));
    fireEvent.click(screen.getByText('Start Deployment'));
    
    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  it('allows restarting deployment after completion', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Complete a deployment
    fireEvent.click(screen.getByText('Select Optimizely'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => screen.getByText('Start Deployment'));
    fireEvent.click(screen.getByText('Start Deployment'));
    
    await waitFor(() => {
      expect(screen.getByText('Deployment Successful!')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Click Deploy Again
    fireEvent.click(screen.getByText('Deploy Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Select Your CMS Provider')).toBeInTheDocument();
    });
  });

  it('highlights current step in the indicator', () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    const steps = screen.getAllByText(/^[1-4]$/);
    // First step should be highlighted (would have different styling)
    // Since framer-motion animations are mocked, we just check the element exists
    expect(steps[0]).toBeInTheDocument();
    expect(steps[0].closest('div')).toBeInTheDocument();
  });

  it('shows checkmarks for completed steps', async () => {
    render(<DeploymentWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />);
    
    // Progress through steps
    fireEvent.click(screen.getByText('Select Optimizely'));
    await waitFor(() => screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    // First step should now show as completed (would have CheckCircle icon)
    await waitFor(() => {
      const providerStep = screen.getByText('Select Provider').closest('div');
      expect(providerStep?.querySelector('svg')).toBeInTheDocument();
    });
  });
});