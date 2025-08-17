import { PrismaClient } from '../../generated/prisma';
import { ContentTypeHasher } from './ContentTypeHasher';

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
    contentType: any,
    source: 'UI' | 'AI' | 'SYNC',
    author?: string,
    message?: string
  ): Promise<void> {
    try {
      // Calculate hash for the new version
      const newHash = this.hasher.calculateHash(contentType);
      
      // Get the current version to link as parent
      const currentVersion = await this.getCurrentVersion(contentType.key || contentType.name);
      
      // Create new version record
      await this.prisma.contentTypeVersion.create({
        data: {
          typeKey: contentType.key || contentType.name || 'unknown',
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
      console.error(`Version history tracking failed for ${contentType.key || contentType.name}:`, error);
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
  private async logError(error: any, errorType: string, contentType: any): Promise<void> {
    // In production, this would log to a proper error tracking service
    // For MVP, just console log with structured format
    console.error({
      errorType,
      contentTypeKey: contentType.key || contentType.name,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get version history for a content type
   * @param typeKey - The content type key
   * @param limit - Maximum number of versions to return
   * @returns Array of version records
   */
  async getVersionHistory(typeKey: string, limit: number = 10) {
    try {
      return await this.prisma.contentTypeVersion.findMany({
        where: { typeKey },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error(`Failed to get version history for ${typeKey}:`, error);
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