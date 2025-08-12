import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebsiteGrid } from '@/components/dashboard/website-grid';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';

// Mock the storage service
jest.mock('@/lib/storage/website-storage.service');

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('WebsiteGrid', () => {
  const mockWebsites = [
    {
      id: 'site-1',
      name: 'Test Website 1',
      icon: '🌟',
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-10'),
      storageQuota: 100000,
      category: 'Business',
      description: 'A test business website',
    },
    {
      id: 'site-2',
      name: 'Test Website 2',
      icon: '🚀',
      createdAt: new Date('2024-01-02'),
      lastModified: new Date('2024-01-11'),
      storageQuota: 100000,
      category: 'Portfolio',
      description: 'A test portfolio website',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading skeleton initially', () => {
    const mockListWebsites = jest.fn().mockResolvedValue([]);
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));

    render(<WebsiteGrid />);
    
    // Check for skeleton presence
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display websites after loading', async () => {
    const mockListWebsites = jest.fn().mockResolvedValue(mockWebsites);
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));

    render(<WebsiteGrid />);

    await waitFor(() => {
      expect(screen.getByText('Test Website 1')).toBeInTheDocument();
      expect(screen.getByText('Test Website 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('should display empty state when no websites exist', async () => {
    const mockListWebsites = jest.fn().mockResolvedValue([]);
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));

    render(<WebsiteGrid />);

    await waitFor(() => {
      expect(screen.getByText('No websites yet')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating your first website/)).toBeInTheDocument();
    });
  });

  it('should handle error gracefully', async () => {
    const mockListWebsites = jest.fn().mockRejectedValue(new Error('Failed to load'));
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<WebsiteGrid />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load websites:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should render correct number of website cards', async () => {
    const mockListWebsites = jest.fn().mockResolvedValue(mockWebsites);
    (WebsiteStorageService as jest.Mock).mockImplementation(() => ({
      listWebsites: mockListWebsites,
    }));

    render(<WebsiteGrid />);

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/studio/site-1');
      expect(links[1]).toHaveAttribute('href', '/studio/site-2');
    });
  });
});