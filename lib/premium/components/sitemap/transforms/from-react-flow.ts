import { Node, Edge } from 'reactflow';
import { Operation } from '../types';

// Extended data for API processing (includes fields not in base types)
interface ExtendedCreateData {
  parentId?: string | null;
  slug: string;
  title: string;
  contentTypeId: string;
  metadata?: Record<string, unknown>;
  contentTypeCategory?: string;
  components?: unknown[];
}

interface ExtendedUpdateData {
  slug?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  components?: unknown[];
}

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
  previousNodes?: Node[],
  previousEdges?: Edge[]
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
    const prevParentId = getPreviousParentId(nodeId, previousEdges);
    
    if (!prevNode) {
      // New node - CREATE operation
      const createData: ExtendedCreateData = {
        parentId: parentId,
        slug: node.data?.slug || generateSlugFromLabel(node.data?.label),
        title: node.data?.label || 'Untitled',
        contentTypeId: '', // Will be determined server-side based on category
        metadata: node.data?.metadata
      };
      
      // Add additional data for API to process
      if (node.type) {
        createData.contentTypeCategory = node.type;
      }
      if (node.data?.components) {
        createData.components = node.data.components;
      }
      
      operations.push({
        type: 'CREATE',
        nodeId: nodeId, // For tracking purposes
        data: createData
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
        const updateData: ExtendedUpdateData = {};
        
        if (node.data?.slug !== prevNode.data?.slug) {
          updateData.slug = node.data?.slug;
        }
        if (node.data?.label !== prevNode.data?.label) {
          updateData.title = node.data?.label;
        }
        if (node.data?.metadata !== prevNode.data?.metadata) {
          updateData.metadata = node.data?.metadata;
        }
        
        // Add components if changed (will be handled server-side)
        if (JSON.stringify(node.data?.components) !== JSON.stringify(prevNode.data?.components)) {
          updateData.components = node.data?.components;
        }
        
        operations.push({
          type: 'UPDATE',
          nodeId: nodeId,
          data: updateData
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
 * Helper to find previous parent ID from previous edges
 */
function getPreviousParentId(nodeId: string, previousEdges?: Edge[]): string | null {
  if (!previousEdges || previousEdges.length === 0) {
    return null;
  }
  
  // Find the edge where this node was the target (child)
  const parentEdge = previousEdges.find(edge => edge.target === nodeId);
  return parentEdge?.source || null;
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