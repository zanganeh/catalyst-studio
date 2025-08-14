import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { WebsiteCreator } from '../website-creator';
import { AIPromptProcessor } from '@/lib/services/ai-prompt-processor';
import { useToast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/services/ai-prompt-processor');
jest.mock('@/components/ui/use-toast');

describe('WebsiteCreator', () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();
  const mockProcessPrompt = jest.fn();
  const mockCreateWebsiteFromPrompt = jest.fn();
  
  beforeEach(() => {
    // Reset all mock functions explicitly
    mockPush.mockReset();
    mockToast.mockReset();
    mockProcessPrompt.mockReset();
    mockCreateWebsiteFromPrompt.mockReset();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast
    });
    
    (AIPromptProcessor as jest.Mock).mockImplementation(() => ({
      processPrompt: mockProcessPrompt,
      createWebsiteFromPrompt: mockCreateWebsiteFromPrompt
    }));
    
    // Setup default mock responses
    mockProcessPrompt.mockResolvedValue({
      websiteName: 'Test Website',
      description: 'Test description',
      category: 'general',
      suggestedFeatures: [],
      technicalRequirements: [],
      targetAudience: 'general users'
    });
    
    mockCreateWebsiteFromPrompt.mockResolvedValue('test-website-id-123');
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
  });
  
  it('should render the AI prompt section', () => {
    render(<WebsiteCreator />);
    
    expect(screen.getByText('What would you build today?')).toBeInTheDocument();
  });
  
  it('should create website successfully', async () => {
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'A CRM for small businesses');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockProcessPrompt).toHaveBeenCalledWith('A CRM for small businesses');
      expect(mockCreateWebsiteFromPrompt).toHaveBeenCalledWith('A CRM for small businesses', {
        websiteName: 'Test Website',
        description: 'Test description',
        category: 'general',
        suggestedFeatures: [],
        technicalRequirements: [],
        targetAudience: 'general users'
      });
    });
  });
  
  it('should store prompt in sessionStorage', async () => {
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'ai_prompt_test-website-id-123',
        expect.stringContaining('Test prompt')
      );
    });
  });
  
  it('should show success toast on successful creation', async () => {
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Website Created!',
        description: 'Test Website is ready for development'
      });
    });
  });
  
  it('should navigate to AI panel after creation', async () => {
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/studio/test-website-id-123/ai');
    }, { timeout: 1000 });
  });
  
  it('should handle creation errors gracefully', async () => {
    // Create a fresh mock for this specific test
    const localMockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: localMockPush
    });
    
    // Reset the process mock to succeed but the create mock to fail
    mockProcessPrompt.mockResolvedValue({
      websiteName: 'Test Website',
      description: 'Test description', 
      category: 'general',
      suggestedFeatures: [],
      technicalRequirements: [],
      targetAudience: 'general users'
    });
    mockCreateWebsiteFromPrompt.mockRejectedValue(new Error('Storage quota exceeded'));
    
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Creation Failed',
        description: 'Storage quota exceeded',
        variant: 'destructive'
      });
    });
    
    // Wait a bit longer to ensure no navigation happens
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Should not navigate on error
    expect(localMockPush).not.toHaveBeenCalled();
  });
  
  it('should show loading state during creation', async () => {
    // Make the promise hang to test loading state
    let resolvePromise: (value: string) => void;
    mockCreateWebsiteFromPrompt.mockReturnValue(
      new Promise<string>(resolve => { resolvePromise = resolve; })
    );
    
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
    
    // Resolve the promise
    resolvePromise('test-id');
  });
  
  it('should handle prompt processing errors', async () => {
    mockProcessPrompt.mockRejectedValue(new Error('Failed to process prompt'));
    
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Creation Failed',
        description: 'Failed to process prompt',
        variant: 'destructive'
      });
    });
  });
  
  it('should disable input during creation', async () => {
    // Make the promise hang
    mockCreateWebsiteFromPrompt.mockReturnValue(new Promise(() => {}));
    
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'Test prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(textarea).toBeDisabled();
      expect(createButton).toBeDisabled();
    });
  });
  
  it('should store processed prompt data in session storage', async () => {
    const processedData = {
      websiteName: 'My CRM',
      description: 'CRM for businesses',
      category: 'crm',
      suggestedFeatures: ['auth', 'payments'],
      technicalRequirements: ['real-time'],
      targetAudience: 'businesses'
    };
    
    mockProcessPrompt.mockResolvedValue(processedData);
    
    render(<WebsiteCreator />);
    
    const textarea = screen.getByPlaceholderText(/Describe your website idea/);
    const createButton = screen.getByRole('button', { name: /Create Website/i });
    
    await userEvent.type(textarea, 'CRM prompt');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const storedData = (window.sessionStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(storedData);
      
      expect(parsed.original).toBe('CRM prompt');
      expect(parsed.processed).toEqual(processedData);
      expect(parsed.timestamp).toBeDefined();
    });
  });
});