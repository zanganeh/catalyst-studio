import { TreeNode } from '@/lib/types/site-structure.types';
import { SitemapNode, SitemapEdge, TransformResult } from '../types';
import { 
  PopulatedTreeNode, 
  hasPopulatedContent, 
  getNodeType, 
  getNodeLabel, 
  getNodeComponents, 
  getNodeMetadata 
} from '../types/populated-tree';

/**
 * Transform database tree structure to React Flow nodes and edges
 * @param treeData The tree data from the database
 * @returns Object containing React Flow nodes and edges arrays
 */
export function transformToReactFlow(treeData: TreeNode | TreeNode[] | PopulatedTreeNode | PopulatedTreeNode[]): TransformResult {
  const nodes: SitemapNode[] = [];
  const edges: SitemapEdge[] = [];
  
  function traverse(node: PopulatedTreeNode, parent?: string, parentPath: string = '') {
    // Validate required fields
    if (!node.id || !node.slug) {
      console.warn('Skipping invalid node:', node);
      return;
    }
    
    // Build fullPath from hierarchy traversal (NOT from node.fullPath which may be different)
    const fullPath = parentPath ? `${parentPath}/${node.slug}` : node.slug;
    
    // Safe type detection with proper type helpers
    const nodeType = getNodeType(node);
    const hasContent = hasPopulatedContent(node);
    const components = getNodeComponents(node);
    const metadata = getNodeMetadata(node);
    const label = getNodeLabel(node);
    
    // Create React Flow node with validated data
    const flowNode: SitemapNode = {
      id: node.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // Dagre will calculate actual positions
      data: {
        label: label,
        slug: node.slug,
        fullPath: fullPath,
        components: components,
        childCount: node.children?.length || 0,
        metadata: metadata,
        contentTypeCategory: nodeType,
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
    treeData.forEach(node => traverse(node as PopulatedTreeNode));
  } else {
    traverse(treeData as PopulatedTreeNode);
  }
  
  return { nodes, edges };
}