import { prisma } from '@/lib/prisma';
import { Redirect } from '@/lib/generated/prisma';
import { ErrorCode, StandardResponse } from '@/lib/services/types';

export interface CreateRedirectInput {
  websiteId: string;
  sourcePath: string;
  targetPath: string;
  redirectType: 301 | 302;
  isActive?: boolean;
}

export interface UpdateRedirectInput {
  id: string;
  sourcePath?: string;
  targetPath?: string;
  redirectType?: 301 | 302;
  isActive?: boolean;
}

export interface RedirectChainResult {
  finalPath: string;
  hops: number;
  chain: string[];
  hasLoop: boolean;
}

export class RedirectService {
  private maxRedirectHops = 3;

  /**
   * Validates redirect paths to prevent loops and invalid redirects
   */
  private validateRedirect(sourcePath: string, targetPath: string): { valid: boolean; error?: string } {
    // Normalize paths
    const normalizedSource = this.normalizePath(sourcePath);
    const normalizedTarget = this.normalizePath(targetPath);

    // Check for self-redirect
    if (normalizedSource === normalizedTarget) {
      return { valid: false, error: 'Source and target paths cannot be the same' };
    }

    // Check for invalid characters (basic validation)
    const pathRegex = /^[a-zA-Z0-9\-\/]*$/;
    if (!pathRegex.test(normalizedSource) || !pathRegex.test(normalizedTarget)) {
      return { valid: false, error: 'Paths contain invalid characters' };
    }

    // Check path length
    if (normalizedSource.length > 2000 || normalizedTarget.length > 2000) {
      return { valid: false, error: 'Path exceeds maximum length of 2000 characters' };
    }

    return { valid: true };
  }

  private normalizePath(path: string): string {
    // Remove query params and hash
    let normalized = path.split('?')[0].split('#')[0];
    
    // Handle root path
    if (normalized === '' || normalized === '/') {
      return '/';
    }

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');
    
    // Remove trailing slash for non-root paths
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // Ensure path starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    
    return normalized;
  }

  /**
   * Creates a new redirect
   */
  async createRedirect(input: CreateRedirectInput): Promise<StandardResponse<Redirect>> {
    try {
      // Normalize paths
      const sourcePath = this.normalizePath(input.sourcePath);
      const targetPath = this.normalizePath(input.targetPath);

      // Validate redirect
      const validation = this.validateRedirect(sourcePath, targetPath);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: validation.error || 'Invalid redirect',
            details: { sourcePath, targetPath }
          }
        };
      }

      // Check if redirect already exists
      const existing = await prisma.redirect.findUnique({
        where: {
          websiteId_sourcePath: {
            websiteId: input.websiteId,
            sourcePath
          }
        }
      });

      if (existing) {
        return {
          success: false,
          error: {
            code: ErrorCode.CONFLICT,
            message: 'A redirect for this source path already exists',
            details: { existingId: existing.id, sourcePath }
          }
        };
      }

      // Check for potential loops before creating
      const loopCheck = await this.checkForPotentialLoop(input.websiteId, sourcePath, targetPath);
      if (loopCheck.hasLoop) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'This redirect would create a loop',
            details: { chain: loopCheck.chain }
          }
        };
      }

      // Create the redirect
      const redirect = await prisma.redirect.create({
        data: {
          websiteId: input.websiteId,
          sourcePath,
          targetPath,
          redirectType: input.redirectType,
          isActive: input.isActive ?? true
        }
      });

      return { success: true, data: redirect };
    } catch (error) {
      console.error('Failed to create redirect:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to create redirect',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      };
    }
  }

  /**
   * Updates an existing redirect
   */
  async updateRedirect(input: UpdateRedirectInput): Promise<StandardResponse<Redirect>> {
    try {
      // Get existing redirect
      const existing = await prisma.redirect.findUnique({
        where: { id: input.id }
      });

      if (!existing) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Redirect not found',
            details: { id: input.id }
          }
        };
      }

      // Prepare update data
      const updateData: any = {};
      
      if (input.sourcePath !== undefined) {
        updateData.sourcePath = this.normalizePath(input.sourcePath);
      }
      
      if (input.targetPath !== undefined) {
        updateData.targetPath = this.normalizePath(input.targetPath);
      }

      // Validate if paths are being changed
      if (updateData.sourcePath || updateData.targetPath) {
        const sourcePath = updateData.sourcePath || existing.sourcePath;
        const targetPath = updateData.targetPath || existing.targetPath;
        
        const validation = this.validateRedirect(sourcePath, targetPath);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: validation.error || 'Invalid redirect',
              details: { sourcePath, targetPath }
            }
          };
        }

        // Check for loops if target is being changed
        if (updateData.targetPath) {
          const loopCheck = await this.checkForPotentialLoop(
            existing.websiteId, 
            sourcePath, 
            targetPath
          );
          if (loopCheck.hasLoop) {
            return {
              success: false,
              error: {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'This redirect would create a loop',
                details: { chain: loopCheck.chain }
              }
            };
          }
        }
      }

      if (input.redirectType !== undefined) {
        updateData.redirectType = input.redirectType;
      }

      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      // Update the redirect
      const redirect = await prisma.redirect.update({
        where: { id: input.id },
        data: updateData
      });

      return { success: true, data: redirect };
    } catch (error) {
      console.error('Failed to update redirect:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to update redirect',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      };
    }
  }

  /**
   * Deletes a redirect
   */
  async deleteRedirect(id: string): Promise<StandardResponse<void>> {
    try {
      await prisma.redirect.delete({
        where: { id }
      });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to delete redirect:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to delete redirect',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      };
    }
  }

  /**
   * Resolves a redirect chain
   */
  async resolveRedirectChain(
    websiteId: string, 
    sourcePath: string
  ): Promise<RedirectChainResult> {
    const chain: string[] = [sourcePath];
    let currentPath = sourcePath;
    let hops = 0;
    const visitedPaths = new Set<string>([sourcePath]);

    while (hops < this.maxRedirectHops) {
      const redirect = await prisma.redirect.findFirst({
        where: {
          websiteId,
          sourcePath: currentPath,
          isActive: true
        }
      });

      if (!redirect) {
        // No more redirects
        return {
          finalPath: currentPath,
          hops,
          chain,
          hasLoop: false
        };
      }

      // Check for loop
      if (visitedPaths.has(redirect.targetPath)) {
        console.warn(`Redirect loop detected: ${chain.join(' -> ')} -> ${redirect.targetPath}`);
        return {
          finalPath: currentPath,
          hops,
          chain,
          hasLoop: true
        };
      }

      currentPath = redirect.targetPath;
      chain.push(currentPath);
      visitedPaths.add(currentPath);
      hops++;
    }

    // Max hops reached
    return {
      finalPath: currentPath,
      hops,
      chain,
      hasLoop: false
    };
  }

  /**
   * Checks if creating a redirect would cause a loop
   */
  private async checkForPotentialLoop(
    websiteId: string,
    sourcePath: string,
    targetPath: string
  ): Promise<RedirectChainResult> {
    // Check if target path redirects back to source
    const reverseCheck = await this.resolveRedirectChain(websiteId, targetPath);
    
    if (reverseCheck.chain.includes(sourcePath)) {
      return {
        finalPath: sourcePath,
        hops: reverseCheck.hops + 1,
        chain: [...reverseCheck.chain, sourcePath],
        hasLoop: true
      };
    }

    return {
      finalPath: targetPath,
      hops: 0,
      chain: [sourcePath, targetPath],
      hasLoop: false
    };
  }

  /**
   * Lists redirects for a website
   */
  async listRedirects(
    websiteId: string,
    options?: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<StandardResponse<Redirect[]>> {
    try {
      const where: any = { websiteId };
      
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      const redirects = await prisma.redirect.findMany({
        where,
        take: options?.limit || 100,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      return { success: true, data: redirects };
    } catch (error) {
      console.error('Failed to list redirects:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed to list redirects',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      };
    }
  }

  /**
   * Bulk import redirects
   */
  async bulkImportRedirects(
    websiteId: string,
    redirects: Array<{
      sourcePath: string;
      targetPath: string;
      redirectType: 301 | 302;
    }>
  ): Promise<StandardResponse<{ created: number; failed: number; errors: any[] }>> {
    let created = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const redirect of redirects) {
      const result = await this.createRedirect({
        websiteId,
        ...redirect
      });

      if (result.success) {
        created++;
      } else {
        failed++;
        errors.push({
          sourcePath: redirect.sourcePath,
          error: result.error
        });
      }
    }

    return {
      success: true,
      data: { created, failed, errors }
    };
  }
}

// Singleton instance
export const redirectService = new RedirectService();