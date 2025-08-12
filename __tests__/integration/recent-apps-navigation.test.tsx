import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RecentApps } from '@/components/dashboard/recent-apps';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { useRouter } from 'next/navigation';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/storage/website-storage.service', () => ({
  WebsiteStorageService: jest.fn().mockImplementation(() => ({
    listWebsites: jest.fn(),
  })),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

describe('Recent Apps Navigation Integration', () => {
  const mockPush = jest.fn();
  const mockListWebsites = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));
  });

  describe('Navigation to Studio', () => {
    it('navigates to correct studio context when website card is clicked', async () => {
      const mockWebsites = [
        {
          id: 'test-site-1',
          name: 'Test Website 1',
          description: 'A test website',
          createdAt: '2024-01-01T10:00:00Z',
          lastModified: '2024-01-01T12:00:00Z',
        },
        {
          id: 'test-site-2',
          name: 'Test Website 2',
          description: 'Another test website',
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T11:00:00Z',
        },
      ];

      mockListWebsites.mockResolvedValue(mockWebsites);
      
      render(<RecentApps />);

      await waitFor(() => {
        expect(screen.getByText('Test Website 1')).toBeInTheDocument();
      });

      // Click on the first website
      const firstWebsite = screen.getByText('Test Website 1').closest('button');
      fireEvent.click(firstWebsite!);

      expect(mockPush).toHaveBeenCalledWith('/studio/test-site-1');

      // Click on the second website
      const secondWebsite = screen.getByText('Test Website 2').closest('button');
      fireEvent.click(secondWebsite!);

      expect(mockPush).toHaveBeenCalledWith('/studio/test-site-2');
    });

    it('maintains data integrity during navigation between websites', async () => {
      const websites = Array.from({ length: 5 }, (_, i) => ({
        id: `site-${i}`,
        name: `Website ${i}`,
        description: `Description for website ${i}`,
        createdAt: new Date(2024, 0, 1, 10 - i).toISOString(),
        lastModified: new Date(2024, 0, 1, 12 - i).toISOString(),
      }));

      mockListWebsites.mockResolvedValue(websites);
      
      render(<RecentApps />);

      await waitFor(() => {
        websites.forEach(site => {
          expect(screen.getByText(site.name)).toBeInTheDocument();
        });
      });

      // Navigate through multiple websites
      for (const website of websites) {
        const card = screen.getByText(website.name).closest('button');
        fireEvent.click(card!);
        expect(mockPush).toHaveBeenCalledWith(`/studio/${website.id}`);
      }

      // Verify all navigations were called with correct IDs
      expect(mockPush).toHaveBeenCalledTimes(5);
    });
  });

  describe('Real-time Updates', () => {
    it('updates immediately after website creation', async () => {
      const initialWebsites = [
        {
          id: 'existing-site',
          name: 'Existing Website',
          createdAt: '2024-01-01T10:00:00Z',
          lastModified: '2024-01-01T10:00:00Z',
        },
      ];

      mockListWebsites.mockResolvedValue(initialWebsites);
      
      render(<RecentApps />);

      await waitFor(() => {
        expect(screen.getByText('Existing Website')).toBeInTheDocument();
      });

      // Simulate website creation
      const updatedWebsites = [
        {
          id: 'new-site',
          name: 'New Website',
          createdAt: '2024-01-01T14:00:00Z',
          lastModified: '2024-01-01T14:00:00Z',
        },
        ...initialWebsites,
      ];

      mockListWebsites.mockResolvedValue(updatedWebsites);

      // Dispatch website-created event
      window.dispatchEvent(new CustomEvent('website-created'));

      await waitFor(() => {
        expect(screen.getByText('New Website')).toBeInTheDocument();
      });

      // Verify new website appears first (most recent)
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('New Website');
    });

    it('removes deleted websites from display', async () => {
      const websites = [
        {
          id: 'site-to-keep',
          name: 'Website to Keep',
          createdAt: '2024-01-01T10:00:00Z',
          lastModified: '2024-01-01T10:00:00Z',
        },
        {
          id: 'site-to-delete',
          name: 'Website to Delete',
          createdAt: '2024-01-01T09:00:00Z',
          lastModified: '2024-01-01T09:00:00Z',
        },
      ];

      mockListWebsites.mockResolvedValue(websites);
      
      render(<RecentApps />);

      await waitFor(() => {
        expect(screen.getByText('Website to Keep')).toBeInTheDocument();
        expect(screen.getByText('Website to Delete')).toBeInTheDocument();
      });

      // Simulate website deletion
      const remainingWebsites = websites.filter(w => w.id !== 'site-to-delete');
      mockListWebsites.mockResolvedValue(remainingWebsites);

      // Dispatch website-deleted event
      window.dispatchEvent(new CustomEvent('website-deleted'));

      await waitFor(() => {
        expect(screen.getByText('Website to Keep')).toBeInTheDocument();
        expect(screen.queryByText('Website to Delete')).not.toBeInTheDocument();
      });
    });
  });

  describe('View All Functionality', () => {
    it('correctly handles View All with various website counts', async () => {
      // Test with exactly 12 websites (no View All button)
      const twelveWebsites = Array.from({ length: 12 }, (_, i) => ({
        id: `site-${i}`,
        name: `Website ${i}`,
        createdAt: '2024-01-01T10:00:00Z',
        lastModified: '2024-01-01T10:00:00Z',
      }));

      mockListWebsites.mockResolvedValue(twelveWebsites);
      
      const { rerender } = render(<RecentApps maxItems={12} />);

      await waitFor(() => {
        const cards = screen.getAllByRole('button');
        expect(cards).toHaveLength(12);
        expect(screen.queryByText(/View All/)).not.toBeInTheDocument();
      });

      // Test with 20 websites (View All button should appear)
      const twentyWebsites = Array.from({ length: 20 }, (_, i) => ({
        id: `site-${i}`,
        name: `Website ${i}`,
        createdAt: '2024-01-01T10:00:00Z',
        lastModified: '2024-01-01T10:00:00Z',
      }));

      mockListWebsites.mockResolvedValue(twentyWebsites);
      rerender(<RecentApps maxItems={12} />);

      await waitFor(() => {
        expect(screen.getByText('View All (20)')).toBeInTheDocument();
      });

      // Click View All
      fireEvent.click(screen.getByText('View All (20)'));

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(
          btn => btn.textContent?.includes('Website')
        );
        expect(cards).toHaveLength(20);
        expect(screen.getByText('Show Less')).toBeInTheDocument();
      });

      // Click Show Less
      fireEvent.click(screen.getByText('Show Less'));

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(
          btn => btn.textContent?.includes('Website')
        );
        expect(cards).toHaveLength(12);
        expect(screen.getByText('View All (20)')).toBeInTheDocument();
      });
    });
  });
});