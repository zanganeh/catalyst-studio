import { PrismaClient } from '../../generated/prisma';
import { ContentTypeHasher } from './ContentTypeHasher';

export interface VersionHistoryOptions {
  author?: string;
  dateRange?: {
    start: string | Date;
    end: string | Date;
  };
  source?: 'UI' | 'AI' | 'SYNC';
  limit?: number;
}

export class VersionHistoryManager {
  private hasher: ContentTypeHasher;

  constructor(private prisma: PrismaClient) {
    this.hasher = new ContentTypeHasher();
  }

  /**
   * Record a content type change with version history
   * @param contentType - The content type that changed
   * @param source - Source of the change (UI, AI, or SYNC)
   * @param author - Optional author of the change
   * @param message - Optional change message
   */
  async onDataChange(
    contentType: Record<string, unknown>,
    source: 'UI' | 'AI' | 'SYNC',
    author?: string,
    message?: string
  ): Promise<void> {
    try {
      // Calculate hash for the new version
      const newHash = this.hasher.calculateHash(contentType);
      
      // Get the current version to link as parent
      const currentVersion = await this.getCurrentVersion((contentType.key || contentType.name) as string);
      
      // Create new version record
      await this.prisma.contentTypeVersion.create({
        data: {
          typeKey: (contentType.key || contentType.name || 'unknown') as string,
          versionHash: newHash,
          parentHash: currentVersion?.versionHash || null,
          contentSnapshot: JSON.stringify(contentType),
          changeSource: source,
          author: author || 'system',
          message: message || null
        }
      });
    } catch (error) {
      // Log error but don't stop the sync process (as per Story 6.1 pattern)
      console.error(`Version history tracking failed for ${(contentType.key || contentType.name) as string}:`, error);
      await this.logError(error, 'VERSION_HISTORY_FAILED', contentType);
    }
  }

  /**
   * Get the current (most recent) version for a content type
   * @param typeKey - The content type key
   * @returns The most recent version or null if none exists
   */
  private async getCurrentVersion(typeKey: string) {
    try {
      return await this.prisma.contentTypeVersion.findFirst({
        where: { typeKey },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error(`Failed to get current version for ${typeKey}:`, error);
      return null;
    }
  }

  /**
   * Log error for tracking (following Story 6.1 pattern)
   * @param error - The error that occurred
   * @param errorType - Type of error
   * @param contentType - The content type involved
   */
  private async logError(error: unknown, errorType: string, contentType: Record<string, unknown>): Promise<void> {
    // In production, this would log to a proper error tracking service
    // For MVP, just console log with structured format
    console.error({
      errorType,
      contentTypeKey: contentType.key || contentType.name,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get version history for a content type with filtering options
   * @param typeKey - The content type key
   * @param options - Filtering options
   * @returns Array of version records
   */
  async getVersionHistory(typeKey: string, options: VersionHistoryOptions = {}) {
    try {
      const { author, dateRange, source, limit = 10 } = options;
      
      const where: Record<string, unknown> = { typeKey };
      
      if (author) {
        where.author = author;
      }
      
      if (source) {
        where.changeSource = source;
      }
      
      if (dateRange) {
        where.createdAt = {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        };
      }
      
      return await this.prisma.contentTypeVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          parentVersions: true
        }
      });
    } catch (error) {
      console.error(`Failed to get version history for ${typeKey}:`, error);
      return [];
    }
  }

  /**
   * Get versions by date range
   * @param typeKey - The content type key
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of version records
   */
  async getVersionsByDateRange(typeKey: string, startDate: string | Date, endDate: string | Date) {
    try {
      return await this.prisma.contentTypeVersion.findMany({
        where: {
          typeKey,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          parentVersions: true
        }
      });
    } catch (error) {
      console.error(`Failed to get versions by date range for ${typeKey}:`, error);
      return [];
    }
  }

  /**
   * Get versions by author
   * @param author - The author name
   * @returns Array of version records
   */
  async getVersionsByAuthor(author: string) {
    try {
      return await this.prisma.contentTypeVersion.findMany({
        where: { author },
        orderBy: { createdAt: 'desc' },
        include: {
          parentVersions: true
        }
      });
    } catch (error) {
      console.error(`Failed to get versions by author ${author}:`, error);
      return [];
    }
  }

  /**
   * Get versions by change source
   * @param source - The change source (UI, AI, or SYNC)
   * @returns Array of version records
   */
  async getVersionsByChangeSource(source: 'UI' | 'AI' | 'SYNC') {
    try {
      return await this.prisma.contentTypeVersion.findMany({
        where: { changeSource: source },
        orderBy: { createdAt: 'desc' },
        include: {
          parentVersions: true
        }
      });
    } catch (error) {
      console.error(`Failed to get versions by source ${source}:`, error);
      return [];
    }
  }

  /**
   * Get a specific version by hash
   * @param versionHash - The version hash
   * @returns The version record or null
   */
  async getVersionByHash(versionHash: string) {
    try {
      return await this.prisma.contentTypeVersion.findUnique({
        where: { versionHash }
      });
    } catch (error) {
      console.error(`Failed to get version ${versionHash}:`, error);
      return null;
    }
  }
}