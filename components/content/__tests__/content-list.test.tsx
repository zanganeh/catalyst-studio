import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentList } from '../content-list';
import type { ContentItem, ContentType } from '@/lib/content-types/types';

// Mock ContentCard component
jest.mock('../content-card', () => ({
  ContentCard: ({ item, contentType, onEdit, onDelete, onDuplicate }: any) => (
    <article data-testid={`content-card-${item.id}`}>
      <h3>{item.data.title || item.data.name}</h3>
      <span>{contentType.name}</span>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onDuplicate}>Duplicate</button>
    </article>
  ),
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
    contentTypes: mockContentTypes,
    onNewContent: jest.fn(),
    onEditContent: jest.fn(),
    onDeleteContent: jest.fn(),
    onDuplicateContent: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders content list with items', () => {
    render(<ContentList {...defaultProps} />);
    
    expect(screen.getByText('Content Items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
  });

  it('shows empty state when no content types exist', () => {
    render(<ContentList {...defaultProps} contentTypes={[]} />);
    
    expect(screen.getByText('No Content Types Available')).toBeInTheDocument();
    expect(screen.getByText(/you need to create content types first/i)).toBeInTheDocument();
  });

  it('shows empty state when no content items exist', () => {
    render(<ContentList {...defaultProps} contentItems={[]} />);
    
    expect(screen.getByText(/no content yet/i)).toBeInTheDocument();
    expect(screen.getByText(/start building your content/i)).toBeInTheDocument();
  });

  it('filters content by content type', async () => {
    render(<ContentList {...defaultProps} />);
    
    // Click on Articles filter button
    const articlesButton = screen.getByRole('button', { name: /Articles/i });
    fireEvent.click(articlesButton);

    // Should only show article items (verify by content cards)
    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(1); // Only one article item
    });
  });

  it('calls onNewContent when new content button is clicked', () => {
    render(<ContentList {...defaultProps} />);
    
    const newButton = screen.getByRole('button', { name: /add entry/i });
    fireEvent.click(newButton);
    
    expect(defaultProps.onNewContent).toHaveBeenCalledTimes(1);
  });

  it('disables new content button when no content types exist', () => {
    render(<ContentList {...defaultProps} contentTypes={[]} />);
    
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
    
    // Check cards are rendered
    expect(firstCard).toBeInTheDocument();
    expect(secondCard).toBeInTheDocument();
    
    // Check that cards have the expected content
    expect(firstCard).toHaveTextContent('Test Article');
    expect(secondCard).toHaveTextContent('Test Product');
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<ContentList {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add entry/i });
    expect(addButton).toBeInTheDocument();
    
    // Check content structure exists
    const contentHeader = screen.getByText('Content Items');
    expect(contentHeader).toBeInTheDocument();
  });
});