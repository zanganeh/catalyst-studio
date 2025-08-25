import { Node, Edge } from 'reactflow';
import { TreeNode } from '@/lib/types/site-structure.types';
import { ContentTypeCategory } from '@prisma/client';

export interface SitemapNodeData {
  label: string;
  slug: string;
  fullPath?: string;
  components?: any[];
  childCount: number;
  metadata?: any;
  contentTypeCategory?: ContentTypeCategory;
  hasContent: boolean;
}

export type SitemapNode = Node<SitemapNodeData>;
export type SitemapEdge = Edge;

export interface TransformResult {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
}

export interface Operation {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';
  nodeId?: string;
  data?: any;
  newParentId?: string;
}

export interface SaveRequest {
  websiteId: string;
  operations: Operation[];
}

export interface SaveResponse {
  success: boolean;
  results?: any[];
  error?: string;
}