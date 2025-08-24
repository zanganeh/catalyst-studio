/**
 * Utility functions for content type operations
 */

// Type for content type with category field
interface ContentTypeWithCategory {
  category?: string | null;
}

/**
 * Check if a content type is a component (not a page)
 * Components don't need SiteStructure entries as they're not routable
 */
export function isComponent(contentType: ContentTypeWithCategory | null | undefined): boolean {
  return contentType?.category === 'component';
}

/**
 * Check if a content type is a page (routable content)
 * Pages require SiteStructure entries for navigation
 */
export function isPage(contentType: ContentTypeWithCategory | null | undefined): boolean {
  return contentType?.category === 'page';
}

/**
 * Get the category of a content type with a default fallback
 */
export function getContentTypeCategory(
  contentType: ContentTypeWithCategory | null | undefined,
  defaultCategory: 'page' | 'component' = 'page'
): 'page' | 'component' {
  if (!contentType?.category) {
    return defaultCategory;
  }
  
  // Ensure we only return valid categories
  if (contentType.category === 'component') {
    return 'component';
  }
  
  return 'page';
}