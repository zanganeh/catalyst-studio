import { PrismaClient, ContentItem, SiteStructure, Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug, validateAndSuggestSlug } from './slug-validator';

// Create a wrapper for slug operations
const slugManager = {
  async generateSlug(title: string, websiteId: string, parentId: string | null = null): Promise<string> {
    return await generateUniqueSlug(title, { websiteId, parentId });
  },
  
  async validateSlug(slug: string): Promise<{ isValid: boolean; error?: string }> {
    const { getSlugValidationDetails } = await import('./slug-manager');
    const validation = getSlugValidationDetails(slug);
    return {
      isValid: validation.valid,
      error: validation.errors[0]
    };
  }
};
import { 
  OrphanedNodeError, 
  CircularReferenceError,
  InvalidSlugError,
  DuplicateSlugError 
} from './errors';
import {
  CreatePageDto,
  UpdatePageDto,
  PageResult,
  DeleteOptions,
  MovePageDto,
  IPageOrchestrator
} from '@/lib/types/page-orchestrator.types';

export class PageOrchestrator implements IPageOrchestrator {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  async createPage(dto: CreatePageDto, websiteId: string): Promise<PageResult> {
    return await this.prisma.$transaction(async (tx) => {
      // Validate content type exists
      const contentType = await tx.contentType.findUnique({
        where: { id: dto.contentTypeId }
      });

      if (!contentType) {
        throw new Error(`Content type ${dto.contentTypeId} not found`);
      }

      // Generate slug if not provided
      const slug = dto.slug || await slugManager.generateSlug(dto.title, websiteId, dto.parentId);
      
      // Validate slug
      const slugValidation = await slugManager.validateSlug(slug);
      if (!slugValidation.isValid) {
        throw new InvalidSlugError(slug, [slugValidation.error || 'Invalid slug']);
      }

      // Check slug uniqueness within website
      const existingSlug = await tx.contentItem.findFirst({
        where: {
          websiteId,
          slug: slug
        }
      });

      if (existingSlug) {
        throw new DuplicateSlugError(`Slug "${slug}" already exists`);
      }

      // Get parent structure if parentId provided
      let parentStructure: SiteStructure | null = null;
      let pathDepth = 0;
      let fullPath = `/${slug}`;

      if (dto.parentId) {
        parentStructure = await tx.siteStructure.findUnique({
          where: { id: dto.parentId }
        });

        if (!parentStructure) {
          throw new Error(`Parent structure ${dto.parentId} not found`);
        }

        pathDepth = parentStructure.pathDepth + 1;
        fullPath = `${parentStructure.fullPath}/${slug}`;
      }

      // Calculate position if not provided
      let position = dto.position;
      if (position === undefined) {
        const lastSibling = await tx.siteStructure.findFirst({
          where: {
            websiteId,
            parentId: dto.parentId || null
          },
          orderBy: { position: 'desc' }
        });
        position = lastSibling ? lastSibling.position + 1 : 0;
      }

      // Create ContentItem (source of truth for slug)
      const contentItem = await tx.contentItem.create({
        data: {
          websiteId,
          contentTypeId: dto.contentTypeId,
          title: dto.title,
          slug,
          content: dto.content || {},
          metadata: dto.metadata || {},
          status: dto.status || 'draft'
        }
      });

      // Create SiteStructure (mirrors slug for path construction)
      const siteStructure = await tx.siteStructure.create({
        data: {
          websiteId,
          contentItemId: contentItem.id,
          parentId: dto.parentId || null,
          slug, // Mirror from ContentItem
          position,
          pathDepth,
          fullPath,
          weight: 0
        }
      });

      // Get breadcrumbs
      const breadcrumbs = await this.getBreadcrumbs(tx, siteStructure.id);

      return {
        contentItem,
        siteStructure,
        fullPath,
        breadcrumbs
      };
    });
  }

  async updatePage(id: string, dto: UpdatePageDto): Promise<PageResult> {
    return await this.prisma.$transaction(async (tx) => {
      // Find existing structure
      const existingStructure = await tx.siteStructure.findUnique({
        where: { id },
        include: { contentItem: true }
      });

      if (!existingStructure || !existingStructure.contentItem) {
        throw new Error(`Page ${id} not found`);
      }

      const contentItem = existingStructure.contentItem;
      let newSlug = existingStructure.slug;
      let pathUpdateNeeded = false;

      // Handle slug update
      if (dto.slug && dto.slug !== existingStructure.slug) {
        // Validate new slug
        const slugValidation = await slugManager.validateSlug(dto.slug);
        if (!slugValidation.isValid) {
          throw new InvalidSlugError(dto.slug, [slugValidation.error || 'Invalid slug']);
        }

        // Check uniqueness
        const duplicate = await tx.contentItem.findFirst({
          where: {
            websiteId: contentItem.websiteId,
            slug: dto.slug,
            id: { not: contentItem.id }
          }
        });

        if (duplicate) {
          throw new DuplicateSlugError(`Slug "${dto.slug}" already exists`);
        }

        newSlug = dto.slug;
        pathUpdateNeeded = true;
      } else if (dto.title && dto.title !== contentItem.title && !dto.slug) {
        // Generate new slug from title if title changed
        newSlug = await slugManager.generateSlug(dto.title, contentItem.websiteId, existingStructure.parentId);
        
        // Check uniqueness
        const duplicate = await tx.contentItem.findFirst({
          where: {
            websiteId: contentItem.websiteId,
            slug: newSlug,
            id: { not: contentItem.id }
          }
        });

        if (!duplicate) {
          pathUpdateNeeded = true;
        } else {
          newSlug = existingStructure.slug; // Keep existing if conflict
        }
      }

      // Update ContentItem
      const updatedContentItem = await tx.contentItem.update({
        where: { id: contentItem.id },
        data: {
          title: dto.title || contentItem.title,
          slug: newSlug,
          content: dto.content !== undefined ? dto.content : (contentItem.content as Prisma.InputJsonValue),
          metadata: dto.metadata !== undefined ? dto.metadata : (contentItem.metadata as Prisma.InputJsonValue),
          status: dto.status || contentItem.status
        }
      });

      // Calculate new fullPath
      let newFullPath = existingStructure.fullPath;
      if (pathUpdateNeeded) {
        if (existingStructure.parentId) {
          const parent = await tx.siteStructure.findUnique({
            where: { id: existingStructure.parentId }
          });
          newFullPath = parent ? `${parent.fullPath}/${newSlug}` : `/${newSlug}`;
        } else {
          newFullPath = `/${newSlug}`;
        }
      }

      // Update SiteStructure
      const updatedStructure = await tx.siteStructure.update({
        where: { id },
        data: {
          slug: newSlug,
          fullPath: newFullPath
        }
      });

      // If path changed, update all descendants
      if (pathUpdateNeeded) {
        await this.updateDescendantPaths(tx, id, existingStructure.fullPath, newFullPath);
      }

      // Get breadcrumbs
      const breadcrumbs = await this.getBreadcrumbs(tx, id);

      return {
        contentItem: updatedContentItem,
        siteStructure: updatedStructure,
        fullPath: newFullPath,
        breadcrumbs
      };
    });
  }

  async deletePage(id: string, options?: DeleteOptions): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const structure = await tx.siteStructure.findUnique({
        where: { id },
        include: { 
          contentItem: true,
          children: true
        }
      });

      if (!structure) {
        throw new Error(`Page ${id} not found`);
      }

      // Handle children based on options
      if (structure.children.length > 0) {
        if (options?.cascade) {
          // Cascade delete all descendants
          await this.cascadeDelete(tx, id);
        } else if (options?.orphanChildren) {
          // Move children to parent or root
          await tx.siteStructure.updateMany({
            where: { parentId: id },
            data: { 
              parentId: structure.parentId,
              pathDepth: structure.pathDepth
            }
          });
        } else {
          throw new Error('Page has children. Use cascade or orphanChildren option.');
        }
      }

      // Delete SiteStructure
      await tx.siteStructure.delete({
        where: { id }
      });

      // Delete ContentItem if requested (default: true)
      if (options?.deleteContent !== false && structure.contentItem) {
        await tx.contentItem.delete({
          where: { id: structure.contentItem.id }
        });
      }
    });
  }

  async movePage(id: string, dto: MovePageDto): Promise<PageResult> {
    return await this.prisma.$transaction(async (tx) => {
      const structure = await tx.siteStructure.findUnique({
        where: { id },
        include: { contentItem: true }
      });

      if (!structure || !structure.contentItem) {
        throw new Error(`Page ${id} not found`);
      }

      // Validate no circular reference
      if (dto.newParentId) {
        const isCircular = await this.checkCircularReference(tx, id, dto.newParentId);
        if (isCircular) {
          throw new CircularReferenceError('Cannot move page to its own descendant');
        }
      }

      // Get new parent info
      let newPathDepth = 0;
      let newFullPath = `/${structure.slug}`;

      if (dto.newParentId) {
        const newParent = await tx.siteStructure.findUnique({
          where: { id: dto.newParentId }
        });

        if (!newParent) {
          throw new Error(`Parent ${dto.newParentId} not found`);
        }

        newPathDepth = newParent.pathDepth + 1;
        newFullPath = `${newParent.fullPath}/${structure.slug}`;
      }

      // Calculate position
      let position = dto.position;
      if (position === undefined) {
        const lastSibling = await tx.siteStructure.findFirst({
          where: {
            websiteId: structure.websiteId,
            parentId: dto.newParentId || null,
            id: { not: id }
          },
          orderBy: { position: 'desc' }
        });
        position = lastSibling ? lastSibling.position + 1 : 0;
      }

      // Update structure
      const updatedStructure = await tx.siteStructure.update({
        where: { id },
        data: {
          parentId: dto.newParentId || null,
          position,
          pathDepth: newPathDepth,
          fullPath: newFullPath
        }
      });

      // Update all descendants
      await this.updateDescendantPaths(tx, id, structure.fullPath, newFullPath);
      await this.updateDescendantDepths(tx, id, structure.pathDepth, newPathDepth);

      // Get breadcrumbs
      const breadcrumbs = await this.getBreadcrumbs(tx, id);

      return {
        contentItem: structure.contentItem,
        siteStructure: updatedStructure,
        fullPath: newFullPath,
        breadcrumbs
      };
    });
  }

  async getPage(id: string): Promise<PageResult | null> {
    const structure = await this.prisma.siteStructure.findUnique({
      where: { id },
      include: { contentItem: true }
    });

    if (!structure || !structure.contentItem) {
      return null;
    }

    const breadcrumbs = await this.getBreadcrumbs(this.prisma, structure.id);

    return {
      contentItem: structure.contentItem,
      siteStructure: structure,
      fullPath: structure.fullPath,
      breadcrumbs
    };
  }

  async listPages(
    websiteId: string,
    options?: { 
      parentId?: string | null; 
      limit?: number; 
      offset?: number;
      includeContent?: boolean;
    }
  ): Promise<{ pages: PageResult[]; total: number }> {
    const where = {
      websiteId,
      ...(options?.parentId !== undefined && { parentId: options.parentId })
    };

    const [structures, total] = await Promise.all([
      this.prisma.siteStructure.findMany({
        where,
        include: { contentItem: options?.includeContent !== false },
        take: options?.limit,
        skip: options?.offset,
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' }
        ]
      }),
      this.prisma.siteStructure.count({ where })
    ]);

    const pages = await Promise.all(
      structures.map(async (structure) => {
        if (!structure.contentItem) {
          throw new OrphanedNodeError(`Site structure ${structure.id} has no content item`);
        }
        
        const breadcrumbs = await this.getBreadcrumbs(this.prisma, structure.id);
        
        return {
          contentItem: structure.contentItem,
          siteStructure: structure,
          fullPath: structure.fullPath,
          breadcrumbs
        };
      })
    );

    return { pages, total };
  }

  async resolveUrl(path: string, websiteId: string): Promise<PageResult | null> {
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const structure = await this.prisma.siteStructure.findFirst({
      where: {
        websiteId,
        fullPath: normalizedPath
      },
      include: { contentItem: true }
    });

    if (!structure || !structure.contentItem) {
      return null;
    }

    const breadcrumbs = await this.getBreadcrumbs(this.prisma, structure.id);

    return {
      contentItem: structure.contentItem,
      siteStructure: structure,
      fullPath: structure.fullPath,
      breadcrumbs
    };
  }

  private async getBreadcrumbs(
    tx: Prisma.TransactionClient | PrismaClient,
    structureId: string
  ): Promise<Array<{ id: string; title: string; slug: string }>> {
    const structure = await tx.siteStructure.findUnique({
      where: { id: structureId },
      include: { contentItem: true }
    });

    if (!structure) return [];

    const breadcrumbs: Array<{ id: string; title: string; slug: string }> = [];
    
    // Walk up the parent chain to build breadcrumbs
    let currentParentId = structure.parentId;
    const parentChain: Array<{ id: string; title: string; slug: string }> = [];
    
    while (currentParentId) {
      const parent = await tx.siteStructure.findUnique({
        where: { id: currentParentId },
        include: { contentItem: true }
      });
      
      if (parent && parent.contentItem) {
        parentChain.unshift({
          id: parent.id,
          title: parent.contentItem.title,
          slug: parent.slug
        });
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    
    breadcrumbs.push(...parentChain);

    // Add current page
    if (structure.contentItem) {
      breadcrumbs.push({
        id: structure.id,
        title: structure.contentItem.title,
        slug: structure.slug
      });
    }

    return breadcrumbs;
  }

  private async updateDescendantPaths(
    tx: Prisma.TransactionClient,
    parentId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    // Find all descendants by checking if their fullPath starts with the old path
    const descendants = await tx.siteStructure.findMany({
      where: {
        fullPath: { startsWith: oldPath + '/' }
      }
    });

    // Update each descendant's fullPath by replacing the old path prefix with the new one
    for (const descendant of descendants) {
      const updatedFullPath = descendant.fullPath.replace(oldPath, newPath);
      await tx.siteStructure.update({
        where: { id: descendant.id },
        data: { fullPath: updatedFullPath }
      });
    }
  }

  private async updateDescendantDepths(
    tx: Prisma.TransactionClient,
    parentId: string,
    oldDepth: number,
    newDepth: number
  ): Promise<void> {
    const depthDiff = newDepth - oldDepth;
    
    // Get the parent structure to find its fullPath
    const parentStructure = await tx.siteStructure.findUnique({
      where: { id: parentId }
    });
    
    if (!parentStructure) return;
    
    // Find all descendants by checking if their fullPath starts with the parent's fullPath
    const descendants = await tx.siteStructure.findMany({
      where: {
        fullPath: { startsWith: parentStructure.fullPath + '/' }
      }
    });

    // Update each descendant's depth
    for (const descendant of descendants) {
      await tx.siteStructure.update({
        where: { id: descendant.id },
        data: { pathDepth: descendant.pathDepth + depthDiff }
      });
    }
  }

  private async cascadeDelete(
    tx: Prisma.TransactionClient,
    parentId: string
  ): Promise<void> {
    const children = await tx.siteStructure.findMany({
      where: { parentId }
    });

    for (const child of children) {
      await this.cascadeDelete(tx, child.id);
      
      // Delete structure
      await tx.siteStructure.delete({
        where: { id: child.id }
      });

      // Delete content
      if (child.contentItemId) {
        await tx.contentItem.delete({
          where: { id: child.contentItemId }
        });
      }
    }
  }

  private async checkCircularReference(
    tx: Prisma.TransactionClient,
    nodeId: string,
    potentialParentId: string
  ): Promise<boolean> {
    if (nodeId === potentialParentId) return true;

    const potentialParent = await tx.siteStructure.findUnique({
      where: { id: potentialParentId }
    });

    if (!potentialParent) return false;
    
    // Check if potential parent is a descendant of node by checking paths
    const node = await tx.siteStructure.findUnique({
      where: { id: nodeId }
    });
    
    if (!node) return false;
    
    return potentialParent.fullPath.startsWith(node.fullPath + '/');
  }
}

export const pageOrchestrator = new PageOrchestrator();