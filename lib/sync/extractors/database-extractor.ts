import { prisma } from '@/lib/prisma';

export interface ExtractedContentType {
  id: string;
  websiteId: string;
  websiteName: string | null;
  name: string;
  category?: 'page' | 'component' | 'folder';
  fields: Record<string, any>;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  metadata: {
    extractedAt: string;
    source: string;
  };
}

export interface Website {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseExtractor {
  /**
   * Connect to the database (Prisma handles this automatically)
   */
  async connect(): Promise<void> {
    // Prisma automatically handles database connections
    // This method exists for compatibility with the sync orchestrator
    return Promise.resolve();
  }

  /**
   * Close the database connection (Prisma handles this automatically)
   */
  async close(): Promise<void> {
    // Prisma automatically handles connection pooling
    // This method exists for compatibility with the sync orchestrator
    return Promise.resolve();
  }

  /**
   * Extract all content types from the database using Prisma
   */
  async extractContentTypes(websiteId?: string): Promise<ExtractedContentType[]> {
    if (websiteId) {
      return this.extractContentTypesForWebsite(websiteId);
    }
    try {
      const contentTypes = await prisma.contentType.findMany({
        include: {
          website: true,
        },
      });

      return contentTypes.map(ct => ({
        id: ct.id,
        websiteId: ct.websiteId,
        websiteName: ct.website?.name || null,
        name: ct.name,
        category: ct.category as 'page' | 'component' | 'folder' | undefined,
        fields: (ct.fields || {}) as Record<string, any>,
        settings: {} as Record<string, any>,
        createdAt: ct.createdAt.toISOString(),
        updatedAt: ct.updatedAt.toISOString(),
        metadata: {
          extractedAt: new Date().toISOString(),
          source: 'prisma',
        },
      }));
    } catch (error) {
      console.error('Failed to extract content types:', error);
      throw new Error(`Database extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content types for a specific website
   */
  async extractContentTypesForWebsite(websiteId: string): Promise<ExtractedContentType[]> {
    try {
      const contentTypes = await prisma.contentType.findMany({
        where: {
          websiteId,
        },
        include: {
          website: true,
        },
      });

      return contentTypes.map(ct => ({
        id: ct.id,
        websiteId: ct.websiteId,
        websiteName: ct.website?.name || null,
        name: ct.name,
        category: ct.category as 'page' | 'component' | 'folder' | undefined,
        fields: (ct.fields || {}) as Record<string, any>,
        settings: {} as Record<string, any>,
        createdAt: ct.createdAt.toISOString(),
        updatedAt: ct.updatedAt.toISOString(),
        metadata: {
          extractedAt: new Date().toISOString(),
          source: 'prisma',
        },
      }));
    } catch (error) {
      console.error(`Failed to extract content types for website ${websiteId}:`, error);
      throw new Error(`Database extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract all websites from the database
   */
  async extractWebsites(): Promise<Website[]> {
    try {
      const websites = await prisma.website.findMany();

      return websites.map(w => ({
        id: w.id,
        name: w.name,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Failed to extract websites:', error);
      throw new Error(`Database extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test database connection using Prisma
   */
  async testConnection(): Promise<boolean> {
    try {
      await prisma.$connect();
      console.log('✅ Successfully connected to database via Prisma');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      return false;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}