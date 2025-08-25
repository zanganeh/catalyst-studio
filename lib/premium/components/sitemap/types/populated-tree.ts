import { TreeNode } from '@/lib/types/site-structure.types';
import { ContentTypeCategory } from '@prisma/client';

/**
 * TreeNode with populated relations for transform operations
 * Properly typed to avoid @ts-ignore statements
 */
export interface PopulatedTreeNode extends TreeNode {
  contentType?: {
    category: ContentTypeCategory;
  };
  contentItem?: {
    title?: string;
    content?: {
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
  if (hasPopulatedContent(node) && node.contentItem?.content?.components) {
    return node.contentItem.content.components;
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