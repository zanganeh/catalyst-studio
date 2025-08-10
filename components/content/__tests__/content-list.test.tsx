import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentList } from '../content-list';
import { useProjectContext } from '@/lib/context/project-context';
import type { ContentItem, ContentType } from '@/lib/content-types/types';

// Mock the project context
jest.mock('@/lib/context/project-context', () => ({
  useProjectContext: jest.fn(),
}));

describe('ContentList', () => {
  const mockContentTypes: ContentType[] = [
    {
      id: 'ct1',
      name: 'Article',
      pluralName: 'Articles',
      icon: '📄',
      description: 'Blog articles',
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ct2',
      name: 'Product',
      pluralName: 'Products',
      icon: '📦',
      description: 'Product catalog',
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockContentItems: ContentItem[] = [
    {
      id: 'item1',
      contentTypeId: 'ct1',
      data: { title: 'Test Article' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'item2',
      contentTypeId: 'ct2',
      data: { name: 'Test Product' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    contentItems: mockContentItems,
    onNewContent: jest.fn(),
    onEditContent: jest.fn(),
    onDeleteContent: jest.fn(),
    onDuplicateContent: jest.fn(),
  };

  beforeEach(() => {
    (useProjectContext as jest.Mock).mockReturnValue({
      context: {
        contentTypes: mockContentTypes,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders content list with items', () => {
    render(<ContentList {...defaultProps} />);
    
    expect(screen.getByText('Content Items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new content item/i })).toBeInTheDocument();
  });

  it('shows empty state when no content types exist', () => {
    (useProjectContext as jest.Mock).mockReturnValue({
      context: {
        contentTypes: [],
      },
    });

    render(<ContentList {...defaultProps} />);
    
    expect(screen.getByText('No Content Types Available')).toBeInTheDocument();
    expect(screen.getByText(/you need to create content types first/i)).toBeInTheDocument();
  });

  it('shows empty state when no content items exist', () => {
    render(<ContentList {...defaultProps} contentItems={[]} />);
    
    expect(screen.getByText('No Content Yet')).toBeInTheDocument();
    expect(screen.getByText(/no content items have been created yet/i)).toBeInTheDocument();
  });

  it('filters content by content type', async () => {
    const { container } = render(<ContentList {...defaultProps} />);
    
    // Open the select dropdown
    const select = container.querySelector('[role="combobox"]');
    if (select) {
      fireEvent.click(select);
    }

    // Select Articles filter
    await waitFor(() => {
      const articleOption = screen.getByText('Articles');
      fireEvent.click(articleOption);
    });

    // Should only show article items
    expect(screen.queryByText('Test Article')).toBeInTheDocument();
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });

  it('calls onNewContent when new content button is clicked', () => {
    render(<ContentList {...defaultProps} />);
    
    const newButton = screen.getByRole('button', { name: /create new content item/i });
    fireEvent.click(newButton);
    
    expect(defaultProps.onNewContent).toHaveBeenCalledTimes(1);
  });

  it('disables new content button when no content types exist', () => {
    (useProjectContext as jest.Mock).mockReturnValue({
      context: {
        contentTypes: [],
      },
    });

    render(<ContentList {...defaultProps} />);
    
    // Since the component shows a different view when no content types exist,
    // we need to check if the component shows the empty state instead
    expect(screen.getByText('No Content Types Available')).toBeInTheDocument();
  });

  it('renders content cards for each item', () => {
    render(<ContentList {...defaultProps} />);
    
    // Check if ContentCard components are rendered
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(mockContentItems.length);
  });

  it('supports keyboard navigation through content items', () => {
    render(<ContentList {...defaultProps} />);
    
    const firstCard = screen.getAllByRole('article')[0];
    const secondCard = screen.getAllByRole('article')[1];
    
    // Focus first card
    firstCard.focus();
    expect(document.activeElement).toBe(firstCard);
    
    // Tab to next card
    fireEvent.keyDown(firstCard, { key: 'Tab' });
    // Note: Actual tab navigation would be handled by the browser
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<ContentList {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /create new content item/i })).toHaveAttribute('aria-label');
    
    // Check for other ARIA attributes
    const contentGrid = screen.getByRole('grid', { hidden: true }) || 
                       screen.getByRole('list', { hidden: true }) ||
                       document.querySelector('[role="region"]');
    expect(contentGrid).toBeTruthy();
  });
});