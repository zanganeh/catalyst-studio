/**
 * Unified Page Service
 * 
 * Single entry point for all page creation operations across UI, AI, and Sync systems.
 * Ensures atomic creation of both ContentItem and SiteStructure to prevent orphaned content.
 * 
 * Based on Architecture Document Section 16.
 */

import { PageOrchestrator } from './site-structure/page-orchestrator';
import { prisma } from '@/lib/prisma';
import {
  StandardResponse,
  CreatePageRequest,
  UpdatePageRequest,
  PageResult,
  ValidationError,
  ErrorCode,
  DeleteOptions,
  RecoverySuggestion
} from '@/lib/types/unified-response.types';

/**
 * Unified Page Service - Ensures no orphaned content
 */
export class UnifiedPageService {
  private pageOrchestrator: PageOrchestrator;
  private requestCounter = 0;

  constructor() {
    this.pageOrchestrator = new PageOrchestrator();
  }

  /**
   * Create content (page or component) with proper structure
   * - Pages: Creates both ContentItem and SiteStructure atomically
   * - Components: Creates only ContentItem (no routing needed)
   */
  async createContent(
    dto: CreatePageRequest,
    source: 'ui' | 'ai' | 'sync'
  ): Promise<StandardResponse<PageResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate input
      const validation = await this.validateCreateRequest(dto);
      if (!validation.success) {
        return this.formatValidationErrors(validation.errors, requestId, source, startTime);
      }

      // Check if this is a component or page
      const contentType = await prisma.contentType.findUnique({
        where: { id: dto.contentTypeId }
      });
      
      const isComponent = contentType?.category === 'component';

      // Components don't need SiteStructure
      if (isComponent) {
        return this.createComponent(dto, source, startTime, requestId);
      }

      // Generate slug if not provided (pages need slugs)
      if (!dto.slug) {
        dto.slug = await this.generateUniqueSlug(dto.title, dto.websiteId, dto.parentId);
      }

      // Use PageOrchestrator for atomic creation of pages
      const result = await this.pageOrchestrator.createPage(
        {
          title: dto.title,
          contentTypeId: dto.contentTypeId,
          content: dto.content,
          parentId: dto.parentId,
          slug: dto.slug,
          metadata: dto.metadata,
          status: dto.status || 'draft'
        },
        dto.websiteId
      );

      // Audit log
      await this.auditLog({
        action: 'page_created',
        source,
        pageId: result.contentItem.id,
        websiteId: dto.websiteId,
        requestId,
        timestamp: new Date()
      });

      // Format result to match PageResult interface
      const formattedResult: PageResult = {
        contentItem: result.contentItem,
        siteStructure: result.siteStructure,
        url: result.fullPath || result.siteStructure.fullPath
      };

      return {
        success: true,
        data: formattedResult,
        errors: [],
        warnings: [],
        metadata: {
          executionTime: `${Date.now() - startTime}ms`,
          source,
          requestId,
          version: '1.0.0'
        }
      };
    } catch (error) {
      return this.handleError(error, dto, requestId, source, startTime);
    }
  }

  /**
   * Create a component (ContentItem only, no SiteStructure needed)
   */
  private async createComponent(
    dto: CreatePageRequest,
    source: 'ui' | 'ai' | 'sync',
    startTime: number,
    requestId: string
  ): Promise<StandardResponse<PageResult>> {
    try {
      // Components don't need slugs or SiteStructure
      const contentItem = await prisma.contentItem.create({
        data: {
          websiteId: dto.websiteId,
          contentTypeId: dto.contentTypeId,
          title: dto.title,
          slug: dto.slug || dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          content: dto.content || {},
          metadata: dto.metadata || {},
          status: dto.status || 'draft'
        }
      });

      // Audit log
      await this.auditLog({
        action: 'component_created',
        source,
        componentId: contentItem.id,
        websiteId: dto.websiteId,
        requestId,
        timestamp: new Date()
      });

      // Format response (no SiteStructure for components)
      const formattedResult: PageResult = {
        contentItem,
        siteStructure: null as any, // Components don't have SiteStructure
        url: null as any // Components don't have URLs
      };

      return {
        success: true,
        data: formattedResult,
        errors: [],
        warnings: [],
        metadata: {
          executionTime: `${Date.now() - startTime}ms`,
          source,
          requestId,
          version: '1.0.0'
        }
      };
    } catch (error) {
      return this.handleError(error, dto, requestId, source, startTime);
    }
  }

  /**
   * Alias for createContent - kept for backward compatibility
   */
  async createPage(
    dto: CreatePageRequest,
    source: 'ui' | 'ai' | 'sync'
  ): Promise<StandardResponse<PageResult>> {
    return this.createContent(dto, source);
  }

  /**
   * Update a page with consistency checks
   */
  async updatePage(
    id: string,
    dto: UpdatePageRequest,
    source: 'ui' | 'ai' | 'sync'
  ): Promise<StandardResponse<PageResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Find existing page
      const contentItem = await prisma.contentItem.findUnique({
        where: { id },
        include: {
          contentType: true,
          website: true
        }
      });

      if (!contentItem) {
        return this.formatError(
          ErrorCode.CONTENT_TYPE_NOT_FOUND,
          'Page not found',
          requestId,
          source,
          startTime
        );
      }

      // If slug changes, update both ContentItem and SiteStructure
      if (dto.slug && dto.slug !== contentItem.slug) {
        const validation = await this.validateSlug(
          dto.slug,
          contentItem.websiteId,
          dto.parentId
        );
        if (!validation.valid) {
          return this.formatError(
            ErrorCode.SLUG_CONFLICT,
            validation.error || 'Invalid slug',
            requestId,
            source,
            startTime
          );
        }
      }

      // Update using transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update ContentItem
        const updatedItem = await tx.contentItem.update({
          where: { id },
          data: {
            title: dto.title || contentItem.title,
            slug: dto.slug || contentItem.slug,
            content: dto.content || contentItem.content,
            status: dto.status || contentItem.status
          }
        });

        // Update SiteStructure if needed
        let siteStructure = await tx.siteStructure.findFirst({
          where: { contentItemId: id }
        });

        if (siteStructure && (dto.slug || dto.parentId !== undefined)) {
          siteStructure = await tx.siteStructure.update({
            where: { id: siteStructure.id },
            data: {
              slug: dto.slug || siteStructure.slug,
              parentId: dto.parentId !== undefined ? dto.parentId : siteStructure.parentId,
              fullPath: await this.calculateFullPath(
                dto.slug || siteStructure.slug,
                dto.parentId !== undefined ? dto.parentId : siteStructure.parentId
              )
            }
          });
        }

        return {
          contentItem: updatedItem,
          siteStructure,
          url: siteStructure?.fullPath || `/${updatedItem.slug}`
        };
      });

      return {
        success: true,
        data: result as PageResult,
        errors: [],
        warnings: [],
        metadata: {
          executionTime: `${Date.now() - startTime}ms`,
          source,
          requestId,
          version: '1.0.0'
        }
      };
    } catch (error) {
      return this.handleError(error, { id, ...dto }, requestId, source, startTime);
    }
  }

  /**
   * Delete a page with cascade options
   */
  async deletePage(
    id: string,
    options: DeleteOptions = {},
    source: 'ui' | 'ai' | 'sync'
  ): Promise<StandardResponse<void>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      await prisma.$transaction(async (tx) => {
        // Find site structure
        const siteStructure = await tx.siteStructure.findFirst({
          where: { contentItemId: id }
        });

        if (options.cascade && siteStructure) {
          // Delete all descendants
          await tx.siteStructure.deleteMany({
            where: {
              fullPath: {
                startsWith: siteStructure.fullPath + '/'
              }
            }
          });
        }

        // Delete site structure
        if (siteStructure) {
          await tx.siteStructure.delete({
            where: { id: siteStructure.id }
          });
        }

        // Delete content item
        await tx.contentItem.delete({
          where: { id }
        });
      });

      return {
        success: true,
        data: null,
        errors: [],
        warnings: [],
        metadata: {
          executionTime: `${Date.now() - startTime}ms`,
          source,
          requestId,
          version: '1.0.0'
        }
      };
    } catch (error) {
      return this.handleError(error, { id, options }, requestId, source, startTime);
    }
  }

  /**
   * Validate create request
   */
  private async validateCreateRequest(dto: CreatePageRequest): Promise<{
    success: boolean;
    errors?: ValidationError[];
  }> {
    const errors: ValidationError[] = [];

    // Check website exists
    const website = await prisma.website.findUnique({
      where: { id: dto.websiteId }
    });
    if (!website) {
      errors.push({
        code: ErrorCode.WEBSITE_NOT_FOUND,
        field: 'websiteId',
        message: 'Website not found',
        severity: 'critical'
      });
    }

    // Check content type exists
    const contentType = await prisma.contentType.findUnique({
      where: { id: dto.contentTypeId }
    });
    if (!contentType) {
      errors.push({
        code: ErrorCode.CONTENT_TYPE_NOT_FOUND,
        field: 'contentTypeId',
        message: 'Content type not found',
        severity: 'critical'
      });
    }

    // Validate slug if provided
    if (dto.slug) {
      const validation = await this.validateSlug(dto.slug, dto.websiteId, dto.parentId);
      if (!validation.valid) {
        errors.push({
          code: ErrorCode.INVALID_SLUG,
          field: 'slug',
          message: validation.error || 'Invalid slug',
          severity: 'error',
          recovery: {
            action: 'regenerate_slug',
            suggestion: 'Try a different slug or let the system generate one',
            alternativeValues: await this.generateSlugAlternatives(dto.title)
          }
        });
      }
    }

    // Check parent exists if provided
    if (dto.parentId) {
      const parent = await prisma.siteStructure.findUnique({
        where: { id: dto.parentId }
      });
      if (!parent) {
        errors.push({
          code: ErrorCode.PARENT_NOT_FOUND,
          field: 'parentId',
          message: 'Parent page not found',
          severity: 'error',
          recovery: {
            action: 'select_parent',
            suggestion: 'Select a different parent or create at root level',
            alternativeValues: []
          }
        });
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Validate slug uniqueness
   */
  private async validateSlug(
    slug: string,
    websiteId: string,
    parentId?: string | null
  ): Promise<{ valid: boolean; error?: string }> {
    // Check format
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' };
    }

    // Check uniqueness at same level
    const existing = await prisma.siteStructure.findFirst({
      where: {
        websiteId,
        parentId: parentId || null,
        slug
      }
    });

    if (existing) {
      return { valid: false, error: 'Slug already exists at this level' };
    }

    return { valid: true };
  }

  /**
   * Generate unique slug from title
   */
  private async generateUniqueSlug(
    title: string,
    websiteId: string,
    parentId?: string | null
  ): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const validation = await this.validateSlug(slug, websiteId, parentId);
      if (validation.valid) {
        return slug;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Generate slug alternatives for error recovery
   */
  private async generateSlugAlternatives(title: string): Promise<string[]> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return [
      baseSlug,
      `${baseSlug}-${Date.now()}`,
      `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`,
      `${baseSlug}-page`,
      `${baseSlug}-new`
    ];
  }

  /**
   * Calculate full path for a node
   */
  private async calculateFullPath(slug: string, parentId?: string | null): Promise<string> {
    if (!parentId) {
      return `/${slug}`;
    }

    const parent = await prisma.siteStructure.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      return `/${slug}`;
    }

    return `${parent.fullPath}/${slug}`;
  }

  /**
   * Handle errors with recovery suggestions
   */
  private handleError(
    error: unknown,
    context: any,
    requestId: string,
    source: 'ui' | 'ai' | 'sync',
    startTime: number
  ): StandardResponse<any> {
    console.error('UnifiedPageService error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return {
          success: false,
          data: null,
          errors: [{
            code: ErrorCode.SLUG_CONFLICT,
            field: 'slug',
            message: 'Slug already exists',
            severity: 'error',
            recovery: {
              action: 'regenerate_slug',
              suggestion: 'Try a different slug',
              alternativeValues: context.title ? 
                this.generateSlugAlternatives(context.title).then(v => v) as any : []
            }
          }],
          warnings: [],
          metadata: {
            executionTime: `${Date.now() - startTime}ms`,
            source,
            requestId,
            version: '1.0.0'
          }
        };
      }
    }

    return {
      success: false,
      data: null,
      errors: [{
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        severity: 'critical'
      }],
      warnings: [],
      metadata: {
        executionTime: `${Date.now() - startTime}ms`,
        source,
        requestId,
        version: '1.0.0'
      }
    };
  }

  /**
   * Format validation errors
   */
  private formatValidationErrors(
    errors: ValidationError[] | undefined,
    requestId: string,
    source: 'ui' | 'ai' | 'sync',
    startTime: number
  ): StandardResponse<any> {
    return {
      success: false,
      data: null,
      errors: errors || [],
      warnings: [],
      metadata: {
        executionTime: `${Date.now() - startTime}ms`,
        source,
        requestId,
        version: '1.0.0'
      }
    };
  }

  /**
   * Format single error
   */
  private formatError(
    code: ErrorCode,
    message: string,
    requestId: string,
    source: 'ui' | 'ai' | 'sync',
    startTime: number
  ): StandardResponse<any> {
    return {
      success: false,
      data: null,
      errors: [{
        code,
        message,
        severity: 'error'
      }],
      warnings: [],
      metadata: {
        executionTime: `${Date.now() - startTime}ms`,
        source,
        requestId,
        version: '1.0.0'
      }
    };
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}`;
  }

  /**
   * Audit log
   */
  private async auditLog(data: any): Promise<void> {
    // For now, just console log
    // In production, this would write to an audit table
    console.log('Audit:', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const unifiedPageService = new UnifiedPageService();