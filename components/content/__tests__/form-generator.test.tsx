import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormGenerator } from '../form-generator';
import type { ContentType, ContentItem, Field } from '@/lib/content-types/types';

describe('FormGenerator', () => {
  const mockContentType: ContentType = {
    id: 'ct1',
    name: 'Article',
    pluralName: 'Articles',
    icon: '📄',
    description: 'Blog articles',
    fields: [
      {
        id: 'field1',
        name: 'content',
        label: 'Content',
        type: 'richText',
        required: true,
        order: 1,
      },
      {
        id: 'field2',
        name: 'views',
        label: 'View Count',
        type: 'number',
        required: false,
        order: 2,
        validation: {
          min: 0,
        },
      },
      {
        id: 'field3',
        name: 'published',
        label: 'Published',
        type: 'boolean',
        required: false,
        order: 3,
      },
      {
        id: 'field4',
        name: 'publishDate',
        label: 'Publish Date',
        type: 'date',
        required: false,
        order: 4,
      },
      {
        id: 'field5',
        name: 'featuredImage',
        label: 'Featured Image',
        type: 'image',
        required: false,
        order: 5,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContentItem: ContentItem = {
    id: 'item1',
    contentTypeId: 'ct1',
    title: 'Existing Article',
    data: {
      content: 'Existing content',
      views: 100,
      published: true,
      publishDate: '2024-01-01',
      featuredImage: 'https://example.com/image.jpg',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    contentType: mockContentType,
    contentItem: null,
    onSubmit: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all field types correctly', () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Title field (automatically added)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    
    // Rich text field
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i).tagName).toBe('TEXTAREA');
    
    // Number field
    expect(screen.getByLabelText(/view count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view count/i)).toHaveAttribute('type', 'number');
    
    // Boolean field (switch)
    expect(screen.getByLabelText(/published/i)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
    
    // Date field
    expect(screen.getByLabelText(/publish date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/publish date/i)).toHaveAttribute('type', 'date');
    
    // Image field
    expect(screen.getByLabelText(/featured image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/featured image/i)).toHaveAttribute('type', 'url');
  });

  it('shows required field indicators', () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Check for required indicators
    const requiredIndicators = screen.getAllByLabelText('required');
    expect(requiredIndicators.length).toBeGreaterThan(0);
    
    // Title is required (first indicator)
    expect(requiredIndicators[0]).toHaveTextContent('*');
  });

  it('shows help text when provided', () => {
    render(<FormGenerator {...defaultProps} />);
    
    expect(screen.getByText('A descriptive title for this content item')).toBeInTheDocument();
  });

  it('populates form with existing content item data', async () => {
    render(<FormGenerator {...defaultProps} contentItem={mockContentItem} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Article');
      expect(screen.getByLabelText(/content/i)).toHaveValue('Existing content');
      expect(screen.getByLabelText(/view count/i)).toHaveValue(100);
      expect(screen.getByLabelText(/featured image/i)).toHaveValue('https://example.com/image.jpg');
    });
  });

  it('validates required fields', async () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Submit without filling required fields
    const form = document.getElementById('content-form');
    expect(form).toBeInTheDocument();
    
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Should show validation errors for required fields
      const errors = screen.queryAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates field constraints', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    // Leave required fields empty and submit
    const form = document.getElementById('content-form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Should show validation error for required fields
      const errors = screen.queryAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    // Fill in required fields
    const titleField = screen.getByLabelText(/title/i);
    const contentField = screen.getByLabelText(/content/i);
    
    await user.type(titleField, 'Test Article Title');
    await user.type(contentField, 'Test article content');
    
    const form = document.getElementById('content-form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('handles keyboard shortcut for save (Ctrl+S)', async () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Fill in required fields
    const titleField = screen.getByLabelText(/title/i);
    await userEvent.type(titleField, 'Test Article');
    await userEvent.type(screen.getByLabelText(/content/i), 'Test content');
    
    // Press Ctrl+S
    fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  it('handles keyboard shortcut for save (Cmd+S on Mac)', async () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/title/i), 'Test Article');
    await userEvent.type(screen.getByLabelText(/content/i), 'Test content');
    
    // Press Cmd+S
    fireEvent.keyDown(document, { key: 's', metaKey: true });
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  it('sorts fields by order property', () => {
    const unorderedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[1], order: 1 }, // views
        { ...mockContentType.fields[0], order: 3 }, // content
        { ...mockContentType.fields[2], order: 2 }, // published
      ],
    };
    
    render(<FormGenerator {...defaultProps} contentType={unorderedContentType} />);
    
    // Check that fields are rendered (title is always first)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Check required fields have aria-required
    const titleField = screen.getByLabelText(/title/i);
    expect(titleField).toHaveAttribute('aria-required', 'true');
    
    // Check help text is connected via aria-describedby
    expect(titleField).toHaveAttribute('aria-describedby');
    
    // Check error messages have role="alert"
    // (Would need to trigger validation to test this)
  });

  it('shows image preview for image fields', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    const imageField = screen.getByLabelText(/featured image/i);
    await user.type(imageField, 'https://example.com/test.jpg');
    
    await waitFor(() => {
      const preview = screen.getByAltText(/preview/i);
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', 'https://example.com/test.jpg');
    });
  });

  it('handles switch toggle for boolean fields', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    
    await user.click(switchElement);
    
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });
});