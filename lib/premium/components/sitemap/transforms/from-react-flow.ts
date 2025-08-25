import { Node, Edge } from 'reactflow';
import { Operation } from '../types';

/**
 * Transform React Flow nodes and edges to database operations
 * Analyzes changes and generates appropriate CRUD operations
 * @param nodes Current React Flow nodes
 * @param edges Current React Flow edges  
 * @param previousNodes Previous state for diff calculation
 * @returns Array of database operations to execute
 */
export function transformFromReactFlow(
  nodes: Node[], 
  edges: Edge[],
  previousNodes?: Node[]
): Operation[] {
  const operations: Operation[] = [];
  
  // Create lookup maps for efficient processing
  const currentNodeMap = new Map(nodes.map(n => [n.id, n]));
  const previousNodeMap = new Map(previousNodes?.map(n => [n.id, n]) || []);
  const edgeMap = new Map<string, string>(); // target -> source mapping
  
  // Build parent-child relationships from edges
  edges.forEach(edge => {
    edgeMap.set(edge.target, edge.source);
  });
  
  // Detect deleted nodes
  previousNodeMap.forEach((prevNode, nodeId) => {
    if (!currentNodeMap.has(nodeId)) {
      operations.push({
        type: 'DELETE',
        nodeId: nodeId
      });
    }
  });
  
  // Detect new and updated nodes
  currentNodeMap.forEach((node, nodeId) => {
    const prevNode = previousNodeMap.get(nodeId);
    const parentId = edgeMap.get(nodeId) || null;
    const prevParentId = getPreviousParentId(nodeId, previousNodes || []);
    
    if (!prevNode) {
      // New node - CREATE operation
      operations.push({
        type: 'CREATE',
        data: {
          id: nodeId,
          parentId: parentId,
          slug: node.data?.slug || generateSlugFromLabel(node.data?.label),
          title: node.data?.label || 'Untitled',
          contentTypeCategory: node.type || 'page',
          components: node.data?.components || [],
          metadata: node.data?.metadata
        }
      });
    } else {
      // Check if node was moved (parent changed)
      if (parentId !== prevParentId) {
        operations.push({
          type: 'MOVE',
          nodeId: nodeId,
          newParentId: parentId
        });
      }
      
      // Check if node data was updated
      if (hasDataChanged(node, prevNode)) {
        operations.push({
          type: 'UPDATE',
          nodeId: nodeId,
          data: {
            slug: node.data?.slug,
            title: node.data?.label,
            components: node.data?.components,
            metadata: node.data?.metadata
          }
        });
      }
    }
  });
  
  // Sort operations: DELETE first, then MOVE, then UPDATE, then CREATE
  // This ensures proper execution order
  const sortOrder = { 'DELETE': 0, 'MOVE': 1, 'UPDATE': 2, 'CREATE': 3 };
  operations.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);
  
  return operations;
}

/**
 * Helper to find previous parent ID from edges
 */
function getPreviousParentId(nodeId: string, previousNodes: Node[]): string | null {
  // This would need access to previous edges as well
  // For now, we'll extract from node data if available
  return null; // Simplified for MVP
}

/**
 * Check if node data has changed
 */
function hasDataChanged(current: Node, previous: Node): boolean {
  const currentData = current.data || {};
  const previousData = previous.data || {};
  
  return (
    currentData.label !== previousData.label ||
    currentData.slug !== previousData.slug ||
    JSON.stringify(currentData.components) !== JSON.stringify(previousData.components) ||
    JSON.stringify(currentData.metadata) !== JSON.stringify(previousData.metadata)
  );
}

/**
 * Generate a slug from a label
 */
function generateSlugFromLabel(label?: string): string {
  if (!label) return 'untitled';
  
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}