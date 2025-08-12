import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickCategoryTags } from '../quick-category-tags';

describe('QuickCategoryTags', () => {
  const mockOnTagClick = jest.fn();
  
  beforeEach(() => {
    mockOnTagClick.mockClear();
  });
  
  it('should render all category tags', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('Dev Productivity')).toBeInTheDocument();
    expect(screen.getByText('Educational')).toBeInTheDocument();
    expect(screen.getByText('E-Commerce')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('SaaS Platform')).toBeInTheDocument();
  });
  
  it('should call onTagClick with correct prompt when CRM tag is clicked', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const crmTag = screen.getByText('CRM');
    fireEvent.click(crmTag);
    
    expect(mockOnTagClick).toHaveBeenCalledWith(
      'A customer relationship management system with contact tracking, deal pipeline, and analytics'
    );
  });
  
  it('should call onTagClick with correct prompt when E-Commerce tag is clicked', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const ecommerceTag = screen.getByText('E-Commerce');
    fireEvent.click(ecommerceTag);
    
    expect(mockOnTagClick).toHaveBeenCalledWith(
      'An online store with product catalog, shopping cart, and payment processing'
    );
  });
  
  it('should have proper accessibility labels', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const crmButton = screen.getByLabelText('Use CRM template');
    expect(crmButton).toBeInTheDocument();
  });
  
  it('should render icons for each tag', () => {
    const { container } = render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    // Check for SVG icons
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(6); // One icon for each category
  });
  
  it('should apply correct color classes to tags', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const crmTag = screen.getByText('CRM').closest('button');
    expect(crmTag?.className).toContain('blue');
    
    const devTag = screen.getByText('Dev Productivity').closest('button');
    expect(devTag?.className).toContain('purple');
  });
  
  it('should handle rapid clicks correctly', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const crmTag = screen.getByText('CRM');
    
    // Simulate rapid clicks
    fireEvent.click(crmTag);
    fireEvent.click(crmTag);
    fireEvent.click(crmTag);
    
    expect(mockOnTagClick).toHaveBeenCalledTimes(3);
  });
});