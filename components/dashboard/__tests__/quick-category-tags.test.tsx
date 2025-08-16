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
    
    expect(screen.getByText('CMS Migration')).toBeInTheDocument();
    expect(screen.getByText('Course Catalog')).toBeInTheDocument();
    expect(screen.getByText('Customer Portal')).toBeInTheDocument();
    expect(screen.getByText('HR Platform')).toBeInTheDocument();
    expect(screen.getByText('Vendor Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
  });
  
  it('should call onTagClick with correct prompt when CMS Migration tag is clicked', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const cmsTag = screen.getByText('CMS Migration');
    fireEvent.click(cmsTag);
    
    expect(mockOnTagClick).toHaveBeenCalledWith(
      'Migrate my Sitecore website to Optimizely SaaS CMS with content modeling, personalization rules, and SEO preservation'
    );
  });
  
  it('should call onTagClick with correct prompt when Customer Portal tag is clicked', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const portalTag = screen.getByText('Customer Portal');
    fireEvent.click(portalTag);
    
    expect(mockOnTagClick).toHaveBeenCalledWith(
      'Build a B2B customer portal with order tracking, invoice management, support tickets, and document library'
    );
  });
  
  it('should have proper accessibility labels', () => {
    render(<QuickCategoryTags onTagClick={mockOnTagClick} />);
    
    const cmsButton = screen.getByLabelText('Use CMS Migration template');
    expect(cmsButton).toBeInTheDocument();
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