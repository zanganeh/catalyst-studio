import { getClient } from '@/lib/db/client';
import { Website, CreateWebsiteRequest, UpdateWebsiteRequest, WebsiteSettings } from '@/types/api';
import { ApiError } from '@/lib/api/errors';
import type { PrismaClient } from '@/lib/generated/prisma';
import type { Website as PrismaWebsite } from '@/lib/generated/prisma';

/**
 * Service layer for website operations
 */
export class WebsiteService {
  private _prisma: PrismaClient | null = null;

  // Lazy initialization of Prisma client
  private get prisma(): PrismaClient {
    if (!this._prisma) {
      this._prisma = getClient();
    }
    return this._prisma;
  }

  /**
   * Get all active websites
   */
  async getWebsites(): Promise<Website[]> {
    const websites = await this.prisma.website.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return websites.map(this.formatWebsite);
  }

  /**
   * Get a single website by ID
   */
  async getWebsite(id: string): Promise<Website> {
    const website = await this.prisma.website.findUnique({
      where: { id }
    });

    if (!website) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }

    return this.formatWebsite(website);
  }

  /**
   * Create a new website
   */
  async createWebsite(data: CreateWebsiteRequest): Promise<Website> {
    const dataToStore = {
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      settings: data.settings ? JSON.stringify(data.settings) : null
    };

    const website = await this.prisma.website.create({
      data: dataToStore
    });

    return this.formatWebsite(website);
  }

  /**
   * Update an existing website
   */
  async updateWebsite(id: string, data: UpdateWebsiteRequest): Promise<Website> {
    // Check if website exists
    const existing = await this.prisma.website.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }

    // Convert JSON fields to strings for storage
    const dataToUpdate: Record<string, unknown> = { ...data };
    
    if (data.metadata !== undefined) {
      dataToUpdate.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
    }
    
    if (data.settings !== undefined) {
      dataToUpdate.settings = data.settings ? JSON.stringify(data.settings) : null;
    }

    const website = await this.prisma.website.update({
      where: { id },
      data: dataToUpdate
    });

    return this.formatWebsite(website);
  }

  /**
   * Soft delete a website
   */
  async deleteWebsite(id: string): Promise<void> {
    try {
      await this.prisma.website.update({
        where: { id },
        data: { isActive: false }
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new ApiError(404, 'Website not found', 'NOT_FOUND');
      }
      throw error;
    }
  }

  /**
   * Get website settings
   */
  async getWebsiteSettings(id: string): Promise<WebsiteSettings | null> {
    const website = await this.getWebsite(id);
    return website.settings || null;
  }

  /**
   * Format website data from database
   */
  private formatWebsite(website: PrismaWebsite): Website {
    return {
      id: website.id,
      name: website.name,
      description: website.description || undefined,
      category: website.category,
      icon: website.icon || undefined,
      isActive: website.isActive,
      createdAt: website.createdAt,
      updatedAt: website.updatedAt,
      metadata: website.metadata ? JSON.parse(website.metadata as string) : undefined,
      settings: website.settings ? JSON.parse(website.settings as string) : undefined
    };
  }
}

// Export singleton instance for production use
export const websiteService = new WebsiteService();