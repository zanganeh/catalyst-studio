import { getClient } from '@/lib/db/client';
import { Website, CreateWebsiteRequest, UpdateWebsiteRequest, WebsiteSettings } from '@/types/api';
import { ApiError } from '@/lib/api/errors';

/**
 * Service layer for website operations
 */
export class WebsiteService {
  private prisma;

  constructor() {
    this.prisma = getClient();
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
    const dataToUpdate: any = { ...data };
    
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
    } catch (error: any) {
      if (error?.code === 'P2025') {
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
  private formatWebsite(website: any): Website {
    return {
      ...website,
      metadata: website.metadata ? JSON.parse(website.metadata) : null,
      settings: website.settings ? JSON.parse(website.settings) : null
    };
  }
}

// Export singleton instance for production use
export const websiteService = new WebsiteService();