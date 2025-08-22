import { PrismaClient, SiteStructure, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ISiteStructureRepository {
  findById(id: string, tx?: PrismaClient): Promise<SiteStructure | null>;
  findByPath(path: string, websiteId: string, tx?: PrismaClient): Promise<SiteStructure | null>;
  findByWebsiteId(websiteId: string, tx?: PrismaClient): Promise<SiteStructure[]>;
  findChildren(parentId: string | null, tx?: PrismaClient): Promise<SiteStructure[]>;
  findAncestors(nodeId: string, tx?: PrismaClient): Promise<SiteStructure[]>;
  save(node: SiteStructure, tx?: PrismaClient): Promise<SiteStructure>;
  delete(id: string, tx?: PrismaClient): Promise<void>;
  transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
}

export class SiteStructureRepository implements ISiteStructureRepository {
  constructor(private readonly db: PrismaClient = prisma) {}
  
  /**
   * Find a site structure node by ID
   * @param id The node ID
   * @param tx Optional transaction client
   * @returns The node or null if not found
   */
  async findById(id: string, tx?: PrismaClient): Promise<SiteStructure | null> {
    const db = tx || this.db;
    return await db.siteStructure.findUnique({
      where: { id }
    });
  }
  
  /**
   * Find a site structure node by path
   * @param path The full path
   * @param websiteId The website ID
   * @param tx Optional transaction client
   * @returns The node or null if not found
   */
  async findByPath(
    path: string, 
    websiteId: string, 
    tx?: PrismaClient
  ): Promise<SiteStructure | null> {
    const db = tx || this.db;
    return await db.siteStructure.findFirst({
      where: {
        fullPath: path,
        websiteId
      }
    });
  }
  
  /**
   * Find all site structure nodes for a website
   * @param websiteId The website ID
   * @param tx Optional transaction client
   * @returns Array of nodes
   */
  async findByWebsiteId(
    websiteId: string, 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    return await db.siteStructure.findMany({
      where: { websiteId },
      orderBy: [
        { pathDepth: 'asc' },
        { position: 'asc' }
      ]
    });
  }
  
  /**
   * Find all children of a node
   * @param parentId The parent node ID (null for root nodes)
   * @param tx Optional transaction client
   * @returns Array of child nodes
   */
  async findChildren(
    parentId: string | null, 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    return await db.siteStructure.findMany({
      where: { parentId },
      orderBy: { position: 'asc' }
    });
  }
  
  /**
   * Find all ancestors of a node (walking up the parent chain)
   * @param nodeId The node ID
   * @param tx Optional transaction client
   * @returns Array of ancestor nodes (from root to immediate parent)
   */
  async findAncestors(
    nodeId: string, 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    const ancestors: SiteStructure[] = [];
    
    let currentNode = await this.findById(nodeId, db);
    if (!currentNode) {
      return ancestors;
    }
    
    while (currentNode.parentId) {
      const parent = await this.findById(currentNode.parentId, db);
      if (!parent) break;
      ancestors.push(parent);
      currentNode = parent;
    }
    
    return ancestors.reverse();
  }
  
  /**
   * Save (create or update) a site structure node
   * @param node The node data
   * @param tx Optional transaction client
   * @returns The saved node
   */
  async save(
    node: SiteStructure, 
    tx?: PrismaClient
  ): Promise<SiteStructure> {
    const db = tx || this.db;
    
    // Check if node exists
    const existing = await this.findById(node.id, db);
    
    if (existing) {
      // Update existing node
      return await db.siteStructure.update({
        where: { id: node.id },
        data: {
          websiteId: node.websiteId,
          contentItemId: node.contentItemId,
          parentId: node.parentId,
          slug: node.slug,
          fullPath: node.fullPath,
          pathDepth: node.pathDepth,
          position: node.position,
          weight: node.weight,
          title: node.title
        }
      });
    } else {
      // Create new node
      return await db.siteStructure.create({
        data: node
      });
    }
  }
  
  /**
   * Delete a site structure node
   * @param id The node ID
   * @param tx Optional transaction client
   */
  async delete(id: string, tx?: PrismaClient): Promise<void> {
    const db = tx || this.db;
    await db.siteStructure.delete({
      where: { id }
    });
  }
  
  /**
   * Execute operations in a transaction
   * @param fn The function to execute in transaction
   * @returns The result of the transaction
   */
  async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return await this.db.$transaction(fn as any);
  }
  
  /**
   * Find nodes by multiple IDs
   * @param ids Array of node IDs
   * @param tx Optional transaction client
   * @returns Array of nodes
   */
  async findByIds(
    ids: string[], 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    return await db.siteStructure.findMany({
      where: {
        id: { in: ids }
      }
    });
  }
  
  /**
   * Find all descendants of a node (using path-based query)
   * @param nodeId The node ID
   * @param tx Optional transaction client
   * @returns Array of descendant nodes
   */
  async findDescendants(
    nodeId: string, 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    
    const node = await this.findById(nodeId, db);
    if (!node) {
      return [];
    }
    
    // Find all nodes whose path starts with this node's path
    return await db.siteStructure.findMany({
      where: {
        websiteId: node.websiteId,
        fullPath: {
          startsWith: node.fullPath + '/'
        }
      },
      orderBy: [
        { pathDepth: 'asc' },
        { position: 'asc' }
      ]
    });
  }
  
  /**
   * Find siblings of a node
   * @param nodeId The node ID
   * @param tx Optional transaction client
   * @returns Array of sibling nodes
   */
  async findSiblings(
    nodeId: string, 
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    
    const node = await this.findById(nodeId, db);
    if (!node) {
      return [];
    }
    
    return await db.siteStructure.findMany({
      where: {
        parentId: node.parentId,
        websiteId: node.websiteId,
        id: { not: nodeId }
      },
      orderBy: { position: 'asc' }
    });
  }
  
  /**
   * Count nodes in a website
   * @param websiteId The website ID
   * @param tx Optional transaction client
   * @returns The count of nodes
   */
  async countByWebsiteId(
    websiteId: string, 
    tx?: PrismaClient
  ): Promise<number> {
    const db = tx || this.db;
    return await db.siteStructure.count({
      where: { websiteId }
    });
  }
  
  /**
   * Check if a slug exists at a given level
   * @param slug The slug to check
   * @param parentId The parent ID (null for root level)
   * @param websiteId The website ID
   * @param excludeId Optional ID to exclude (for updates)
   * @param tx Optional transaction client
   * @returns True if slug exists
   */
  async slugExists(
    slug: string,
    parentId: string | null,
    websiteId: string,
    excludeId?: string,
    tx?: PrismaClient
  ): Promise<boolean> {
    const db = tx || this.db;
    
    const where: Prisma.SiteStructureWhereInput = {
      slug,
      parentId,
      websiteId
    };
    
    if (excludeId) {
      where.id = { not: excludeId };
    }
    
    const count = await db.siteStructure.count({ where });
    return count > 0;
  }
  
  /**
   * Get the maximum position for children of a parent
   * @param parentId The parent ID (null for root level)
   * @param websiteId The website ID
   * @param tx Optional transaction client
   * @returns The maximum position or -1 if no children
   */
  async getMaxPosition(
    parentId: string | null,
    websiteId: string,
    tx?: PrismaClient
  ): Promise<number> {
    const db = tx || this.db;
    
    const result = await db.siteStructure.aggregate({
      where: {
        parentId,
        websiteId
      },
      _max: {
        position: true
      }
    });
    
    return result._max.position ?? -1;
  }
  
  /**
   * Update positions for a set of nodes
   * @param updates Array of { id, position } objects
   * @param tx Optional transaction client
   */
  async updatePositions(
    updates: { id: string; position: number }[],
    tx?: PrismaClient
  ): Promise<void> {
    const db = tx || this.db;
    
    // Use transaction for atomic updates
    const operations = updates.map(({ id, position }) =>
      db.siteStructure.update({
        where: { id },
        data: { position }
      })
    );
    
    await Promise.all(operations);
  }
  
  /**
   * Find root nodes for a website
   * @param websiteId The website ID
   * @param tx Optional transaction client
   * @returns Array of root nodes
   */
  async findRootNodes(
    websiteId: string,
    tx?: PrismaClient
  ): Promise<SiteStructure[]> {
    const db = tx || this.db;
    return await db.siteStructure.findMany({
      where: {
        websiteId,
        parentId: null
      },
      orderBy: { position: 'asc' }
    });
  }
}

// Export singleton instance
export const siteStructureRepository = new SiteStructureRepository();