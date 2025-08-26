import { TreeNode } from '@/lib/types/site-structure.types';
import { ContentTypeCategory } from '@/lib/generated/prisma';

/**
 * TreeNode with populated relations for transform operations
 * Properly typed to avoid @ts-ignore statements
 */
export interface PopulatedTreeNode {
  id: string;
  slug: string;
  title: string;
  websiteId: string;
  parentId?: string | null;
  contentItemId?: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  contentType?: {
    category: ContentTypeCategory;
  };
  contentItem?: {
    title?: string;
    content?: string | {
      components?: string[] | unknown[];
    };
    metadata?: Record<string, unknown>;
  };
  children?: PopulatedTreeNode[];
}

/**
 * Type guard to check if a node has populated content
 */
export function hasPopulatedContent(node: PopulatedTreeNode): boolean {
  return node.contentItemId !== null && node.contentItemId !== undefined;
}

/**
 * Safe accessor for node type with proper fallback
 */
export function getNodeType(node: PopulatedTreeNode): ContentTypeCategory {
  if (node.contentType?.category) {
    return node.contentType.category;
  }
  return node.contentItemId ? 'page' : 'folder';
}

/**
 * Safe accessor for node label with fallback chain
 */
export function getNodeLabel(node: PopulatedTreeNode): string {
  return node.title || node.contentItem?.title || node.slug;
}

/**
 * Safe accessor for components array
 */
export function getNodeComponents(node: PopulatedTreeNode): unknown[] {
  if (hasPopulatedContent(node) && node.contentItem?.content) {
    // Handle both string (JSON) and object content
    const content = node.contentItem.content;
    
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return parsed.components || [];
      } catch {
        return [];
      }
    } else if (typeof content === 'object' && content !== null) {
      // Check if components exists directly or nested
      if ('components' in content) {
        return (content as any).components || [];
      } else if (Array.isArray(content)) {
        // If content is directly an array, it might be the components
        return content;
      }
    }
  }
  return [];
}

/**
 * Safe accessor for metadata
 */
export function getNodeMetadata(node: PopulatedTreeNode): Record<string, unknown> | undefined {
  if (hasPopulatedContent(node)) {
    return node.contentItem?.metadata;
  }
  return undefined;
}