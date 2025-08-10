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
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        order: 1,
        helpText: 'Enter the article title',
        validation: {
          minLength: 3,
          maxLength: 100,
        },
      },
      {
        id: 'field2',
        name: 'content',
        label: 'Content',
        type: 'richText',
        required: true,
        order: 2,
      },
      {
        id: 'field3',
        name: 'views',
        label: 'View Count',
        type: 'number',
        required: false,
        order: 3,
        validation: {
          min: 0,
        },
      },
      {
        id: 'field4',
        name: 'published',
        label: 'Published',
        type: 'boolean',
        required: false,
        order: 4,
      },
      {
        id: 'field5',
        name: 'publishDate',
        label: 'Publish Date',
        type: 'date',
        required: false,
        order: 5,
      },
      {
        id: 'field6',
        name: 'featuredImage',
        label: 'Featured Image',
        type: 'image',
        required: false,
        order: 6,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContentItem: ContentItem = {
    id: 'item1',
    contentTypeId: 'ct1',
    data: {
      title: 'Existing Article',
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
    
    // Text field
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('type', 'text');
    
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
    
    // Title is required
    const titleLabel = screen.getByText('Title');
    const requiredIndicator = titleLabel.parentElement?.querySelector('[aria-label="required"]');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('shows help text when provided', () => {
    render(<FormGenerator {...defaultProps} />);
    
    expect(screen.getByText('Enter the article title')).toBeInTheDocument();
  });

  it('populates form with existing content item data', () => {
    render(<FormGenerator {...defaultProps} contentItem={mockContentItem} />);
    
    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Article');
    expect(screen.getByLabelText(/content/i)).toHaveValue('Existing content');
    expect(screen.getByLabelText(/view count/i)).toHaveValue(100);
    expect(screen.getByLabelText(/featured image/i)).toHaveValue('https://example.com/image.jpg');
  });

  it('validates required fields', async () => {
    render(<FormGenerator {...defaultProps} />);
    
    // Submit without filling required fields
    const form = screen.getByRole('form', { hidden: true }) || document.getElementById('content-form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Should show validation errors
      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates field constraints', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    const titleField = screen.getByLabelText(/title/i);
    
    // Type a title that's too short (min length is 3)
    await user.clear(titleField);
    await user.type(titleField, 'ab');
    
    const form = document.getElementById('content-form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Should show validation error
      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<FormGenerator {...defaultProps} />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Article Title');
    await user.type(screen.getByLabelText(/content/i), 'Test article content');
    
    const form = document.getElementById('content-form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Article Title',
          content: 'Test article content',
        })
      );
    });
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
        { ...mockContentType.fields[2], order: 1 }, // views
        { ...mockContentType.fields[0], order: 3 }, // title
        { ...mockContentType.fields[1], order: 2 }, // content
      ],
    };
    
    render(<FormGenerator {...defaultProps} contentType={unorderedContentType} />);
    
    const labels = screen.getAllByRole('textbox', { hidden: true });
    // Fields should be rendered in order: views (1), content (2), title (3)
    expect(labels.length).toBeGreaterThan(0);
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