import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecentApps } from '@/components/dashboard/recent-apps';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { useRouter } from 'next/navigation';
import { WebsiteMetadata } from '@/lib/storage/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock WebsiteStorageService
jest.mock('@/lib/storage/website-storage.service', () => ({
  WebsiteStorageService: jest.fn().mockImplementation(() => ({
    listWebsites: jest.fn(),
  })),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago'),
}));

describe('RecentApps', () => {
  const mockPush = jest.fn();
  const mockListWebsites = jest.fn();

  const mockWebsites: WebsiteMetadata[] = [
    {
      id: 'site1',
      name: 'Website 1',
      description: 'First test website',
      icon: '🚀',
      createdAt: '2024-01-01T10:00:00Z',
      lastModified: '2024-01-01T12:00:00Z',
    },
    {
      id: 'site2',
      name: 'Website 2',
      description: 'Second test website',
      createdAt: '2024-01-01T09:00:00Z',
      lastModified: '2024-01-01T11:00:00Z',
    },
    {
      id: 'site3',
      name: 'Website 3',
      description: 'Third test website',
      icon: '💡',
      createdAt: '2024-01-01T08:00:00Z',
      lastModified: '2024-01-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders loading state initially', () => {
    mockListWebsites.mockResolvedValue([]);
    render(<RecentApps />);
    
    expect(screen.getByText('Recent Apps')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty state when no websites exist', async () => {
    mockListWebsites.mockResolvedValue([]);
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('No websites yet. Create your first one above!')).toBeInTheDocument();
    });
  });

  it('renders website cards correctly', async () => {
    mockListWebsites.mockResolvedValue(mockWebsites);
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('Website 1')).toBeInTheDocument();
      expect(screen.getByText('Website 2')).toBeInTheDocument();
      expect(screen.getByText('Website 3')).toBeInTheDocument();
      expect(screen.getByText('First test website')).toBeInTheDocument();
    });
  });

  it('sorts websites by last modified date', async () => {
    mockListWebsites.mockResolvedValue(mockWebsites);
    render(<RecentApps />);

    await waitFor(() => {
      const cards = screen.getAllByRole('button');
      // First card should be Website 1 (most recently modified)
      expect(cards[0]).toHaveTextContent('Website 1');
    });
  });

  it('navigates to studio when card is clicked', async () => {
    mockListWebsites.mockResolvedValue(mockWebsites);
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
      createdAt: '2024-01-01T10:00:00Z',
      lastModified: '2024-01-01T10:00:00Z',
    }));

    mockListWebsites.mockResolvedValue(manyWebsites);
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
      createdAt: '2024-01-01T10:00:00Z',
      lastModified: '2024-01-01T10:00:00Z',
    }));

    mockListWebsites.mockResolvedValue(manyWebsites);
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
    mockListWebsites.mockRejectedValue(new Error('Failed to load'));
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load recent apps')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('retries loading when Try again is clicked', async () => {
    mockListWebsites
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockWebsites);
    
    render(<RecentApps />);

    await waitFor(() => {
      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Website 1')).toBeInTheDocument();
    });
  });

  it('updates when storage events occur', async () => {
    mockListWebsites.mockResolvedValue(mockWebsites);
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('Website 1')).toBeInTheDocument();
    });

    // Simulate a storage event
    const updatedWebsites = [...mockWebsites, {
      id: 'site4',
      name: 'Website 4',
      createdAt: '2024-01-01T13:00:00Z',
      lastModified: '2024-01-01T13:00:00Z',
    }];
    mockListWebsites.mockResolvedValue(updatedWebsites);

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('website-created'));

    await waitFor(() => {
      expect(mockListWebsites).toHaveBeenCalledTimes(2);
    });
  });

  it('displays website icons when available', async () => {
    mockListWebsites.mockResolvedValue(mockWebsites);
    render(<RecentApps />);

    await waitFor(() => {
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
    });
  });

  it('applies custom className prop', () => {
    mockListWebsites.mockResolvedValue([]);
    const { container } = render(<RecentApps className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});