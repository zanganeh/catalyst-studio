import { ContentItem, SiteStructure, Prisma } from '@/lib/generated/prisma';

export interface CreatePageDto {
  // Content fields
  title: string;
  contentTypeId: string;
  content?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  
  // Structure fields  
  parentId?: string;
  position?: number;
  slug?: string;  // Auto-generated if not provided
  
  // Publishing
  status?: 'draft' | 'published';
}

export interface UpdatePageDto {
  // Content fields
  title?: string;
  content?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  slug?: string;
  
  
  // Publishing
  status?: 'draft' | 'published';
}

export interface MovePageDto {
  newParentId?: string | null;
  position?: number;
}

export interface DeleteOptions {
  cascade?: boolean;           // Delete all descendants
  orphanChildren?: boolean;     // Move children to parent
  deleteContent?: boolean;      // Delete ContentItem (default: true)
}

export interface PageResult {
  contentItem: ContentItem;
  siteStructure: SiteStructure;
  fullPath: string;
  breadcrumbs?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

export interface IPageOrchestrator {
  createPage(dto: CreatePageDto, websiteId: string): Promise<PageResult>;
  updatePage(id: string, dto: UpdatePageDto): Promise<PageResult>;
  deletePage(id: string, options?: DeleteOptions): Promise<void>;
  movePage(id: string, dto: MovePageDto): Promise<PageResult>;
  getPage(id: string): Promise<PageResult | null>;
  resolveUrl(path: string, websiteId: string): Promise<PageResult | null>;
}