import { ExtractedContentType } from '../extractors/database-extractor';
import { SyncStorage, SyncState } from '../engine/sync-orchestrator';

/**
 * Database storage implementation that uses the actual database
 * This reads content types directly
 * from the database through the extractor.
 */
export class DatabaseStorage implements SyncStorage {
  private extractor: any; // DatabaseExtractor instance
  private syncState: SyncState = { contentTypes: {} };

  constructor(extractor: any) {
    this.extractor = extractor;
  }

  async loadAllContentTypes(): Promise<ExtractedContentType[]> {
    try {
      // Use the extractor to get content types from the actual database
      if (!this.extractor) {
        return [];
      }
      
      // Ensure connection
      await this.extractor.connect();
      const contentTypes = await this.extractor.extractContentTypes();
      return contentTypes || [];
    } catch (error) {
      console.error('Failed to load content types from database:', error);
      return [];
    }
  }

  async saveContentType(contentType: ExtractedContentType): Promise<void> {
    // In the real implementation, content types are saved through the website service
    // This is a no-op as we don't save back to database in the sync process
    console.log('Content type save requested for:', contentType.id);
  }

  async loadSyncState(): Promise<SyncState> {
    // Return the in-memory sync state
    // In production, this could be persisted to database
    return this.syncState;
  }

  async saveSyncState(state: SyncState): Promise<void> {
    // Save to in-memory for now
    // In production, this could be persisted to database
    this.syncState = state;
  }
}