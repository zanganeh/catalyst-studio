import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecentApps } from '@/components/dashboard/recent-apps';
import { useWebsites } from '@/lib/api/hooks/use-websites';
import { useRouter } from 'next/navigation';
import { Website } from '@/types/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API hook
jest.mock('@/lib/api/hooks/use-websites', () => ({
  useWebsites: jest.fn(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago'),
}));

describe('RecentApps', () => {
  const mockPush = jest.fn();

  const mockWebsites: Website[] = [
    {
      id: 'site1',
      name: 'Website 1',
      description: 'First test website',
      category: 'blog',
      icon: '🚀',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
    },
    {
      id: 'site2',
      name: 'Website 2',
      description: 'Second test website',
      category: 'portfolio',
      isActive: true,
      createdAt: new Date('2024-01-01T09:00:00Z'),
      updatedAt: new Date('2024-01-01T11:00:00Z'),
    },
    {
      id: 'site3',
      name: 'Website 3',
      description: 'Third test website',
      category: 'ecommerce',
      icon: '💡',
      isActive: true,
      createdAt: new Date('2024-01-01T08:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders loading state initially', () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    render(<RecentApps />);
    
    expect(screen.getByText('Recent Apps')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty state when no websites exist', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('No websites yet. Create your first one above!')).toBeInTheDocument();
    });
  });

  it('renders website cards correctly', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: mockWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('Website 1')).toBeInTheDocument();
      expect(screen.getByText('Website 2')).toBeInTheDocument();
      expect(screen.getByText('Website 3')).toBeInTheDocument();
      expect(screen.getByText('First test website')).toBeInTheDocument();
    });
  });

  it('sorts websites by updated date', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: mockWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      const cards = screen.getAllByRole('button');
      // First card should be Website 1 (most recently updated)
      expect(cards[0]).toHaveTextContent('Website 1');
    });
  });

  it('navigates to studio when card is clicked', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: mockWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      const websiteCard = screen.getByText('Website 1').closest('button');
      fireEvent.click(websiteCard!);
    });

    expect(mockPush).toHaveBeenCalledWith('/studio/site1');
  });

  it('limits display to maxItems prop', async () => {
    const manyWebsites = Array.from({ length: 20 }, (_, i) => ({
      id: `site${i}`,
      name: `Website ${i}`,
      category: 'blog',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    }));

    (useWebsites as jest.Mock).mockReturnValue({
      data: manyWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps maxItems={12} />);

    await waitFor(() => {
      const cards = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Website')
      );
      expect(cards).toHaveLength(12);
      expect(screen.getByText('View All (20)')).toBeInTheDocument();
    });
  });

  it('shows all websites when View All is clicked', async () => {
    const manyWebsites = Array.from({ length: 15 }, (_, i) => ({
      id: `site${i}`,
      name: `Website ${i}`,
      category: 'blog',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    }));

    (useWebsites as jest.Mock).mockReturnValue({
      data: manyWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps maxItems={12} />);

    await waitFor(() => {
      const viewAllButton = screen.getByText('View All (15)');
      fireEvent.click(viewAllButton);
    });

    await waitFor(() => {
      const cards = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Website')
      );
      expect(cards).toHaveLength(15);
      expect(screen.getByText('Show Less')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load websites'),
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load recent apps')).toBeInTheDocument();
      expect(screen.getByText('Failed to load websites')).toBeInTheDocument();
    });
  });

  // Note: Retry functionality removed as React Query handles refetch internally

  // Note: Real-time updates handled by React Query cache invalidation

  it('displays website icons when available', async () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: mockWebsites,
      isLoading: false,
      error: null,
    });
    
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
    });
  });

  it('applies custom className prop', () => {
    (useWebsites as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    
    const { container } = render(<RecentApps className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});