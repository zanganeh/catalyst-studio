import { Node, Edge } from 'reactflow';
import { TreeNode } from '@/lib/types/site-structure.types';
import { ContentTypeCategory } from '@/lib/generated/prisma';

// Component data structure for global components
export interface ComponentData {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface SitemapNodeData {
  label: string;
  slug: string;
  fullPath?: string;
  components?: ComponentData[];
  childCount: number;
  metadata?: Record<string, unknown>;
  contentTypeCategory?: ContentTypeCategory;
  hasContent: boolean;
}

export type SitemapNode = Node<SitemapNodeData>;
export type SitemapEdge = Edge;

export interface TransformResult {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
}

// Node operation data structures
export interface CreateNodeData {
  title: string;
  slug: string;
  parentId?: string | null;
  contentTypeId: string;
  contentItemId?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateNodeData {
  title?: string;
  slug?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
  status?: string;
}

export interface Operation {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';
  nodeId?: string;
  data?: CreateNodeData | UpdateNodeData;
  newParentId?: string;
}

export interface SaveRequest {
  websiteId: string;
  operations: Operation[];
}

export interface OperationResult {
  operationType: string;
  nodeId?: string;
  success: boolean;
  error?: string;
}

export interface SaveResponse {
  success: boolean;
  results?: OperationResult[];
  error?: string;
}