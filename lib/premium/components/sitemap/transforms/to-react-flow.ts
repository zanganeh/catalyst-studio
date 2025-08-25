import { TreeNode } from '@/lib/types/site-structure.types';
import { SitemapNode, SitemapEdge, TransformResult } from '../types';

/**
 * Transform database tree structure to React Flow nodes and edges
 * @param treeData The tree data from the database
 * @returns Object containing React Flow nodes and edges arrays
 */
export function transformToReactFlow(treeData: TreeNode | TreeNode[]): TransformResult {
  const nodes: SitemapNode[] = [];
  const edges: SitemapEdge[] = [];
  
  function traverse(node: TreeNode, parent?: string, parentPath: string = '') {
    // Validate required fields
    if (!node.id || !node.slug) {
      console.warn('Skipping invalid node:', node);
      return;
    }
    
    // Build fullPath from hierarchy traversal (NOT from node.fullPath which may be different)
    const fullPath = parentPath ? `${parentPath}/${node.slug}` : node.slug;
    
    // Safe type detection with null checks
    // @ts-ignore - contentType relation may be populated
    const nodeType = node.contentType?.category || (node.contentItemId ? 'page' : 'folder');
    const hasContent = node.contentItemId !== null && node.contentItemId !== undefined;
    
    // Extract content if contentItem is populated
    // @ts-ignore - contentItem relation may be populated
    const contentData = node.contentItem?.content;
    const components = hasContent && contentData ? (contentData.components || []) : [];
    
    // Create React Flow node with validated data
    const flowNode: SitemapNode = {
      id: node.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // Dagre will calculate actual positions
      data: {
        // @ts-ignore - title may be from contentItem or node
        label: node.title || node.contentItem?.title || node.slug,
        slug: node.slug,
        fullPath: fullPath,
        components: components,
        childCount: node.children?.length || 0,
        // @ts-ignore - metadata from contentItem if populated
        metadata: hasContent ? node.contentItem?.metadata : undefined,
        contentTypeCategory: nodeType as any,
        hasContent: hasContent
      }
    };
    
    nodes.push(flowNode);
    
    // Create edge to parent with type specification
    if (parent) {
      edges.push({
        id: `${parent}-${node.id}`,
        source: parent,
        target: node.id,
        type: 'smoothstep' // Edge type for better visual
      });
    }
    
    // Recursively process children with accumulated path
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => traverse(child, node.id, fullPath));
    }
  }
  
  // Handle both single node and array of nodes (for multiple root nodes)
  if (Array.isArray(treeData)) {
    treeData.forEach(node => traverse(node));
  } else {
    traverse(treeData);
  }
  
  return { nodes, edges };
}