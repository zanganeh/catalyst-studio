import { PrismaClient, SiteStructure, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { 
  CircularReferenceError, 
  NodeNotFoundError, 
  InvalidOperationError 
} from './errors';
import { PathManager } from './path-manager';
import { SiteStructureRepository } from './site-structure-repository';
import { 
  CreateNodeInput,
  UpdateNodeInput,
  MoveNodeInput,
  BulkMoveInput,
  TreeNode,
  ValidationReport,
  BreadcrumbItem
} from '@/lib/types/site-structure.types';

export interface ISiteStructureService {
  // Tree operations
  getTree(websiteId: string): Promise<TreeNode>;
  getAncestors(nodeId: string): Promise<SiteStructure[]>;
  getDescendants(nodeId: string): Promise<SiteStructure[]>;
  getSiblings(nodeId: string): Promise<SiteStructure[]>;
  getBreadcrumbs(nodeId: string): Promise<BreadcrumbItem[]>;
  
  // CRUD operations
  create(input: CreateNodeInput): Promise<SiteStructure>;
  update(id: string, updates: UpdateNodeInput): Promise<SiteStructure>;
  delete(id: string): Promise<void>;
  
  // Move operations
  moveNode(nodeId: string, newParentId: string | null): Promise<SiteStructure>;
  validateMove(nodeId: string, targetParentId: string | null): Promise<boolean>;
  wouldCreateCycle(nodeId: string, targetParentId: string | null): Promise<boolean>;
  
  // Position management
  reorderSiblings(parentId: string | null, websiteId: string, positions: { id: string; position: number }[]): Promise<void>;
  insertAtPosition(nodeId: string, position: number): Promise<SiteStructure>;
  swapPositions(nodeId1: string, nodeId2: string): Promise<void>;
  
  // Bulk operations
  bulkCreate(nodes: CreateNodeInput[]): Promise<SiteStructure[]>;
  bulkUpdate(updates: { id: string; updates: UpdateNodeInput }[]): Promise<SiteStructure[]>;
  bulkDelete(nodeIds: string[]): Promise<void>;
  bulkMove(moves: BulkMoveInput[]): Promise<SiteStructure[]>;
  
  // Validation
  validateTree(websiteId: string): Promise<ValidationReport>;
  findOrphanedNodes(websiteId: string): Promise<SiteStructure[]>;
  validatePaths(websiteId: string): Promise<ValidationReport>;
  repairTree(websiteId: string): Promise<ValidationReport>;
}

export class SiteStructureService implements ISiteStructureService {
  private readonly pathManager: PathManager;
  private readonly repository: SiteStructureRepository;
  
  constructor(
    private readonly db: PrismaClient = prisma
  ) {
    this.pathManager = new PathManager(db);
    this.repository = new SiteStructureRepository(db);
  }
  
  // Tree operations
  async getTree(websiteId: string): Promise<TreeNode> {
    const nodes = await this.repository.findByWebsiteId(websiteId);
    return this.buildTreeFromNodes(nodes);
  }
  
  async getAncestors(nodeId: string): Promise<SiteStructure[]> {
    const ancestors: SiteStructure[] = [];
    let currentNode = await this.repository.findById(nodeId);
    
    if (!currentNode) {
      throw new NodeNotFoundError(nodeId);
    }
    
    while (currentNode.parentId) {
      const parent = await this.repository.findById(currentNode.parentId);
      if (!parent) break;
      ancestors.push(parent);
      currentNode = parent;
    }
    
    return ancestors.reverse();
  }
  
  async getDescendants(nodeId: string): Promise<SiteStructure[]> {
    const node = await this.repository.findById(nodeId);
    if (!node) {
      throw new NodeNotFoundError(nodeId);
    }
    
    const descendants: SiteStructure[] = [];
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.repository.findChildren(currentId);
      descendants.push(...children);
      queue.push(...children.map(c => c.id));
    }
    
    return descendants;
  }
  
  async getSiblings(nodeId: string): Promise<SiteStructure[]> {
    const node = await this.repository.findById(nodeId);
    if (!node) {
      throw new NodeNotFoundError(nodeId);
    }
    
    const siblings = await this.repository.findChildren(node.parentId);
    return siblings.filter(s => s.id !== nodeId);
  }
  
  async getBreadcrumbs(nodeId: string): Promise<BreadcrumbItem[]> {
    const node = await this.repository.findById(nodeId);
    if (!node) {
      throw new NodeNotFoundError(nodeId);
    }
    
    const ancestors = await this.getAncestors(nodeId);
    const breadcrumbs: BreadcrumbItem[] = ancestors.map(ancestor => ({
      id: ancestor.id,
      title: ancestor.title,
      path: ancestor.fullPath
    }));
    
    breadcrumbs.push({
      id: node.id,
      title: node.title,
      path: node.fullPath
    });
    
    return breadcrumbs;
  }
  
  // CRUD operations
  async create(input: CreateNodeInput): Promise<SiteStructure> {
    return await this.db.$transaction(async (tx) => {
      // Calculate position
      const siblings = await this.repository.findChildren(input.parentId, tx as any);
      const position = siblings.length > 0 
        ? Math.max(...siblings.map(s => s.position)) + 1 
        : 0;
      
      // Build path
      const parentPath = input.parentId 
        ? (await this.repository.findById(input.parentId, tx as any))?.fullPath || ''
        : '';
      const fullPath = this.pathManager.buildPath(parentPath, input.slug);
      const pathDepth = this.pathManager.getDepth(fullPath);
      
      // Create node
      const node = await tx.siteStructure.create({
        data: {
          websiteId: input.websiteId,
          contentItemId: input.contentItemId,
          parentId: input.parentId,
          slug: input.slug,
          fullPath,
          pathDepth,
          position,
          weight: input.weight || 0,
          title: input.title
        }
      });
      
      return node;
    });
  }
  
  async update(id: string, updates: UpdateNodeInput): Promise<SiteStructure> {
    return await this.db.$transaction(async (tx) => {
      const node = await this.repository.findById(id, tx as any);
      if (!node) {
        throw new NodeNotFoundError(id);
      }
      
      // If slug changed, recalculate paths
      if (updates.slug && updates.slug !== node.slug) {
        const parent = node.parentId 
          ? await this.repository.findById(node.parentId, tx as any)
          : null;
        const parentPath = parent?.fullPath || '';
        const newPath = this.pathManager.buildPath(parentPath, updates.slug);
        
        // Update node and cascade to descendants
        await this.pathManager.recalculatePaths(id, newPath, tx as any);
        
        return await tx.siteStructure.update({
          where: { id },
          data: {
            ...updates,
            fullPath: newPath,
            pathDepth: this.pathManager.getDepth(newPath)
          }
        });
      }
      
      return await tx.siteStructure.update({
        where: { id },
        data: updates
      });
    });
  }
  
  async delete(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const node = await this.repository.findById(id, tx as any);
      if (!node) {
        throw new NodeNotFoundError(id);
      }
      
      // Delete all descendants first
      const descendants = await this.getDescendants(id);
      for (const descendant of descendants.reverse()) {
        await tx.siteStructure.delete({ where: { id: descendant.id } });
      }
      
      // Delete the node itself
      await tx.siteStructure.delete({ where: { id } });
      
      // Reorder siblings
      const siblings = await this.repository.findChildren(node.parentId, tx as any);
      await this.normalizePositions(siblings, tx as any);
    });
  }
  
  // Move operations
  async moveNode(nodeId: string, newParentId: string | null): Promise<SiteStructure> {
    // Validate move
    if (!(await this.validateMove(nodeId, newParentId))) {
      throw new CircularReferenceError('Move would create circular reference');
    }
    
    return await this.db.$transaction(async (tx) => {
      const node = await this.repository.findById(nodeId, tx as any);
      if (!node) {
        throw new NodeNotFoundError(nodeId);
      }
      
      // Get new parent path
      const newParent = newParentId 
        ? await this.repository.findById(newParentId, tx as any)
        : null;
      const newParentPath = newParent?.fullPath || '';
      
      // Calculate new path
      const newPath = this.pathManager.buildPath(newParentPath, node.slug);
      const newDepth = this.pathManager.getDepth(newPath);
      
      // Get new position
      const newSiblings = await this.repository.findChildren(newParentId, tx as any);
      const newPosition = newSiblings.length > 0
        ? Math.max(...newSiblings.map(s => s.position)) + 1
        : 0;
      
      // Update node
      const updatedNode = await tx.siteStructure.update({
        where: { id: nodeId },
        data: {
          parentId: newParentId,
          fullPath: newPath,
          pathDepth: newDepth,
          position: newPosition
        }
      });
      
      // Recalculate paths for descendants
      await this.pathManager.recalculatePaths(nodeId, newPath, tx as any);
      
      // Reorder old siblings
      const oldSiblings = await this.repository.findChildren(node.parentId, tx as any);
      await this.normalizePositions(oldSiblings, tx as any);
      
      return updatedNode;
    });
  }
  
  async validateMove(nodeId: string, targetParentId: string | null): Promise<boolean> {
    if (nodeId === targetParentId) {
      return false;
    }
    
    if (!targetParentId) {
      return true; // Moving to root is always valid
    }
    
    return !(await this.wouldCreateCycle(nodeId, targetParentId));
  }
  
  async wouldCreateCycle(nodeId: string, targetParentId: string | null): Promise<boolean> {
    if (!targetParentId) {
      return false;
    }
    
    const descendants = await this.getDescendants(nodeId);
    return descendants.some(d => d.id === targetParentId);
  }
  
  // Position management
  async reorderSiblings(
    parentId: string | null, 
    websiteId: string,
    positions: { id: string; position: number }[]
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      // Validate all nodes belong to same parent
      const nodes = await tx.siteStructure.findMany({
        where: {
          id: { in: positions.map(p => p.id) },
          parentId,
          websiteId
        }
      });
      
      if (nodes.length !== positions.length) {
        throw new InvalidOperationError('Some nodes do not belong to the specified parent');
      }
      
      // Update positions
      for (const { id, position } of positions) {
        await tx.siteStructure.update({
          where: { id },
          data: { position }
        });
      }
    });
  }
  
  async insertAtPosition(nodeId: string, position: number): Promise<SiteStructure> {
    return await this.db.$transaction(async (tx) => {
      const node = await this.repository.findById(nodeId, tx as any);
      if (!node) {
        throw new NodeNotFoundError(nodeId);
      }
      
      // Get siblings
      const siblings = await this.repository.findChildren(node.parentId, tx as any);
      
      // Shift positions of nodes at or after target position
      for (const sibling of siblings) {
        if (sibling.position >= position && sibling.id !== nodeId) {
          await tx.siteStructure.update({
            where: { id: sibling.id },
            data: { position: sibling.position + 1 }
          });
        }
      }
      
      // Update node position
      return await tx.siteStructure.update({
        where: { id: nodeId },
        data: { position }
      });
    });
  }
  
  async swapPositions(nodeId1: string, nodeId2: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const node1 = await this.repository.findById(nodeId1, tx as any);
      const node2 = await this.repository.findById(nodeId2, tx as any);
      
      if (!node1 || !node2) {
        throw new NodeNotFoundError('One or both nodes not found');
      }
      
      if (node1.parentId !== node2.parentId) {
        throw new InvalidOperationError('Nodes must have the same parent');
      }
      
      // Swap positions
      const tempPosition = node1.position;
      await tx.siteStructure.update({
        where: { id: nodeId1 },
        data: { position: node2.position }
      });
      await tx.siteStructure.update({
        where: { id: nodeId2 },
        data: { position: tempPosition }
      });
    });
  }
  
  // Bulk operations
  async bulkCreate(nodes: CreateNodeInput[]): Promise<SiteStructure[]> {
    return await this.db.$transaction(async (tx) => {
      const created: SiteStructure[] = [];
      
      for (const node of nodes) {
        const result = await this.create(node);
        created.push(result);
      }
      
      return created;
    });
  }
  
  async bulkUpdate(updates: { id: string; updates: UpdateNodeInput }[]): Promise<SiteStructure[]> {
    return await this.db.$transaction(async (tx) => {
      const updated: SiteStructure[] = [];
      
      for (const { id, updates: nodeUpdates } of updates) {
        const result = await this.update(id, nodeUpdates);
        updated.push(result);
      }
      
      return updated;
    });
  }
  
  async bulkDelete(nodeIds: string[]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      for (const nodeId of nodeIds) {
        await this.delete(nodeId);
      }
    });
  }
  
  async bulkMove(moves: BulkMoveInput[]): Promise<SiteStructure[]> {
    return await this.db.$transaction(async (tx) => {
      const moved: SiteStructure[] = [];
      
      // Validate all moves first
      for (const move of moves) {
        if (!(await this.validateMove(move.nodeId, move.newParentId))) {
          throw new CircularReferenceError(`Move of ${move.nodeId} would create circular reference`);
        }
      }
      
      // Execute moves
      for (const move of moves) {
        const result = await this.moveNode(move.nodeId, move.newParentId);
        moved.push(result);
      }
      
      return moved;
    });
  }
  
  // Validation
  async validateTree(websiteId: string): Promise<ValidationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const nodes = await this.repository.findByWebsiteId(websiteId);
    
    // Check for orphaned nodes
    const orphaned = await this.findOrphanedNodes(websiteId);
    if (orphaned.length > 0) {
      errors.push(`Found ${orphaned.length} orphaned nodes`);
    }
    
    // Check for path consistency
    const pathReport = await this.validatePaths(websiteId);
    errors.push(...pathReport.errors);
    warnings.push(...pathReport.warnings);
    
    // Check for duplicate slugs at same level
    const slugMap = new Map<string, string[]>();
    for (const node of nodes) {
      const key = `${node.parentId || 'root'}-${node.slug}`;
      if (!slugMap.has(key)) {
        slugMap.set(key, []);
      }
      slugMap.get(key)!.push(node.id);
    }
    
    for (const [key, nodeIds] of slugMap.entries()) {
      if (nodeIds.length > 1) {
        errors.push(`Duplicate slug "${key}" for nodes: ${nodeIds.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: `Found ${errors.length} errors and ${warnings.length} warnings`
    };
  }
  
  async findOrphanedNodes(websiteId: string): Promise<SiteStructure[]> {
    const nodes = await this.repository.findByWebsiteId(websiteId);
    const nodeIds = new Set(nodes.map(n => n.id));
    const orphaned: SiteStructure[] = [];
    
    for (const node of nodes) {
      if (node.parentId && !nodeIds.has(node.parentId)) {
        orphaned.push(node);
      }
    }
    
    return orphaned;
  }
  
  async validatePaths(websiteId: string): Promise<ValidationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const nodes = await this.repository.findByWebsiteId(websiteId);
    
    for (const node of nodes) {
      // Reconstruct expected path
      let expectedPath = '';
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          expectedPath = this.pathManager.buildPath(parent.fullPath, node.slug);
        }
      } else {
        expectedPath = `/${node.slug}`;
      }
      
      // Compare with actual path
      if (node.fullPath !== expectedPath) {
        errors.push(`Path mismatch for node ${node.id}: expected "${expectedPath}", got "${node.fullPath}"`);
      }
      
      // Check depth
      const expectedDepth = this.pathManager.getDepth(node.fullPath);
      if (node.pathDepth !== expectedDepth) {
        warnings.push(`Depth mismatch for node ${node.id}: expected ${expectedDepth}, got ${node.pathDepth}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: `Path validation: ${errors.length} errors, ${warnings.length} warnings`
    };
  }
  
  async repairTree(websiteId: string): Promise<ValidationReport> {
    const report = await this.validateTree(websiteId);
    const repairs: string[] = [];
    
    await this.db.$transaction(async (tx) => {
      // Fix orphaned nodes by moving to root
      const orphaned = await this.findOrphanedNodes(websiteId);
      for (const node of orphaned) {
        await tx.siteStructure.update({
          where: { id: node.id },
          data: { parentId: null }
        });
        repairs.push(`Moved orphaned node ${node.id} to root`);
      }
      
      // Fix path inconsistencies
      const nodes = await this.repository.findByWebsiteId(websiteId, tx as any);
      for (const node of nodes) {
        const parent = node.parentId 
          ? nodes.find(n => n.id === node.parentId)
          : null;
        const parentPath = parent?.fullPath || '';
        const correctPath = this.pathManager.buildPath(parentPath, node.slug);
        const correctDepth = this.pathManager.getDepth(correctPath);
        
        if (node.fullPath !== correctPath || node.pathDepth !== correctDepth) {
          await tx.siteStructure.update({
            where: { id: node.id },
            data: {
              fullPath: correctPath,
              pathDepth: correctDepth
            }
          });
          repairs.push(`Fixed path for node ${node.id}`);
        }
      }
      
      // Normalize positions
      const parentGroups = new Map<string | null, SiteStructure[]>();
      for (const node of nodes) {
        const key = node.parentId;
        if (!parentGroups.has(key)) {
          parentGroups.set(key, []);
        }
        parentGroups.get(key)!.push(node);
      }
      
      for (const [parentId, children] of parentGroups.entries()) {
        await this.normalizePositions(children, tx as any);
        if (children.length > 0) {
          repairs.push(`Normalized positions for ${children.length} children of ${parentId || 'root'}`);
        }
      }
    });
    
    return {
      valid: true,
      errors: [],
      warnings: repairs,
      summary: `Repaired ${repairs.length} issues`
    };
  }
  
  // Helper methods
  private buildTreeFromNodes(nodes: SiteStructure[]): TreeNode {
    const nodeMap = new Map<string | null, SiteStructure[]>();
    
    // Group nodes by parent
    for (const node of nodes) {
      const parentId = node.parentId;
      if (!nodeMap.has(parentId)) {
        nodeMap.set(parentId, []);
      }
      nodeMap.get(parentId)!.push(node);
    }
    
    // Build tree recursively
    const buildNode = (node: SiteStructure): TreeNode => {
      const children = nodeMap.get(node.id) || [];
      return {
        ...node,
        children: children
          .sort((a, b) => a.position - b.position)
          .map(child => buildNode(child))
      };
    };
    
    // Find root nodes and build tree
    const roots = nodeMap.get(null) || [];
    if (roots.length === 0) {
      return {
        id: 'root',
        websiteId: nodes[0]?.websiteId || '',
        title: 'Root',
        slug: '',
        fullPath: '/',
        pathDepth: 0,
        position: 0,
        weight: 0,
        parentId: null,
        contentItemId: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as TreeNode;
    }
    
    if (roots.length === 1) {
      return buildNode(roots[0]);
    }
    
    // Multiple roots - create virtual root
    return {
      id: 'root',
      websiteId: roots[0].websiteId,
      title: 'Root',
      slug: '',
      fullPath: '/',
      pathDepth: 0,
      position: 0,
      weight: 0,
      parentId: null,
      contentItemId: null,
      children: roots
        .sort((a, b) => a.position - b.position)
        .map(root => buildNode(root)),
      createdAt: new Date(),
      updatedAt: new Date()
    } as TreeNode;
  }
  
  private async normalizePositions(
    nodes: SiteStructure[], 
    tx?: PrismaClient
  ): Promise<void> {
    const db = tx || this.db;
    const sorted = nodes.sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        await db.siteStructure.update({
          where: { id: sorted[i].id },
          data: { position: i }
        });
      }
    }
  }
}

// Export singleton instance
export const siteStructureService = new SiteStructureService();