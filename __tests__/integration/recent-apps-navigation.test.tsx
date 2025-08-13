import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RecentApps } from '@/components/dashboard/recent-apps';
import { useWebsites } from '@/lib/api/hooks/use-websites';
import { useRouter } from 'next/navigation';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/hooks/use-websites');

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

describe('Recent Apps Navigation Integration', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Navigation to Studio', () => {
    it('navigates to correct studio context when website card is clicked', async () => {
      const mockWebsites = [
        {
          id: 'test-site-1',
          name: 'Test Website 1',
          description: 'A test website',
          category: 'Business',
          isActive: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T12:00:00Z'),
        },
        {
          id: 'test-site-2',
          name: 'Test Website 2',
          description: 'Another test website',
          category: 'Portfolio',
          isActive: true,
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
        },
      ];

      (useWebsites as jest.Mock).mockReturnValue({
        data: mockWebsites,
        isLoading: false,
        error: null,
      });
      
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
        category: 'Business',
        isActive: true,
        createdAt: new Date(2024, 0, 1, 10 - i),
        updatedAt: new Date(2024, 0, 1, 12 - i),
      }));

      (useWebsites as jest.Mock).mockReturnValue({
        data: websites,
        isLoading: false,
        error: null,
      });
      
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
          category: 'Business',
          isActive: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      (useWebsites as jest.Mock).mockReturnValue({
        data: initialWebsites,
        isLoading: false,
        error: null,
      });
      
      render(<RecentApps />);

      await waitFor(() => {
        expect(screen.getByText('Existing Website')).toBeInTheDocument();
      });

      // Simulate website creation
      const updatedWebsites = [
        {
          id: 'new-site',
          name: 'New Website',
          category: 'Business',
          isActive: true,
          createdAt: new Date('2024-01-01T14:00:00Z'),
          updatedAt: new Date('2024-01-01T14:00:00Z'),
        },
        ...initialWebsites,
      ];

      (useWebsites as jest.Mock).mockReturnValue({
        data: updatedWebsites,
        isLoading: false,
        error: null,
      });

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
          category: 'Business',
          isActive: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'site-to-delete',
          name: 'Website to Delete',
          category: 'Portfolio',
          isActive: true,
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T09:00:00Z'),
        },
      ];

      (useWebsites as jest.Mock).mockReturnValue({
        data: websites,
        isLoading: false,
        error: null,
      });
      
      render(<RecentApps />);

      await waitFor(() => {
        expect(screen.getByText('Website to Keep')).toBeInTheDocument();
        expect(screen.getByText('Website to Delete')).toBeInTheDocument();
      });

      // Simulate website deletion
      const remainingWebsites = websites.filter(w => w.id !== 'site-to-delete');
      (useWebsites as jest.Mock).mockReturnValue({
        data: remainingWebsites,
        isLoading: false,
        error: null,
      });

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
        category: 'Business',
        isActive: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      }));

      (useWebsites as jest.Mock).mockReturnValue({
        data: twelveWebsites,
        isLoading: false,
        error: null,
      });
      
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
        category: 'Business',
        isActive: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      }));

      (useWebsites as jest.Mock).mockReturnValue({
        data: twentyWebsites,
        isLoading: false,
        error: null,
      });
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