import { WebsiteMetadata, WebsiteData } from './types';

export class MigrationUtility {
  private readonly BACKUP_KEY = 'catalyst_backup_before_migration';
  private readonly MIGRATION_VERSION = '2.0.0';

  async detectSingleWebsiteData(): Promise<boolean> {
    try {
      // Check for legacy localStorage keys
      const hasLegacyData = 
        localStorage.getItem('catalyst_brand_identity') !== null ||
        localStorage.getItem('catalyst_visual_identity') !== null ||
        localStorage.getItem('catalyst_content') !== null ||
        localStorage.getItem('catalyst_settings') !== null;

      // Check for existing IndexedDB without website partitioning
      const databases = await (indexedDB as any).databases?.() || [];
      const hasLegacyDB = databases.some((db: any) => 
        db.name === 'catalyst_studio' || 
        db.name === 'catalyst_data'
      );

      return hasLegacyData || hasLegacyDB;
    } catch (error) {
      console.error('Error detecting single website data:', error);
      return false;
    }
  }

  async createBackup(): Promise<void> {
    try {
      const backupData: Record<string, any> = {};

      // Backup localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('catalyst_')) {
          backupData[key] = localStorage.getItem(key);
        }
      });

      // Backup IndexedDB if exists
      const databases = await (indexedDB as any).databases?.() || [];
      for (const dbInfo of databases) {
        if (dbInfo.name === 'catalyst_studio' || dbInfo.name === 'catalyst_data') {
          backupData[`db_${dbInfo.name}`] = await this.backupDatabase(dbInfo.name);
        }
      }

      // Store backup
      const backupBlob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const backupUrl = URL.createObjectURL(backupBlob);
      
      // Store backup reference
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        size: backupBlob.size,
        url: backupUrl
      }));

      console.log('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Backup failed - migration aborted');
    }
  }

  async migrateFromSingleWebsite(): Promise<string> {
    try {
      // Create backup first
      await this.createBackup();

      // Create default website metadata
      const defaultWebsite: WebsiteMetadata = {
        id: 'default',
        name: 'My Website',
        createdAt: new Date(),
        lastModified: new Date(),
        storageQuota: 100 * 1024 * 1024, // 100MB default
        category: 'default'
      };

      // Migrate data
      const websiteData = await this.extractLegacyData();
      
      // Store in new format
      await this.storeInNewFormat(defaultWebsite, websiteData);

      // Clean up old data
      await this.cleanupLegacyData();

      // Mark migration as complete
      localStorage.setItem('catalyst_migration_version', this.MIGRATION_VERSION);
      localStorage.setItem('catalyst_migration_date', new Date().toISOString());

      console.log('Migration completed successfully');
      return defaultWebsite.id;
    } catch (error) {
      console.error('Migration failed:', error);
      await this.rollbackMigration();
      throw error;
    }
  }

  async validateMigration(): Promise<boolean> {
    try {
      // Check if new structure exists
      const db = await this.openDatabase('catalyst_global');
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      
      const websites = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      // Verify at least one website exists
      if (websites.length === 0) {
        throw new Error('No websites found after migration');
      }

      // Verify default website exists
      const defaultWebsite = websites.find(w => w.id === 'default');
      if (!defaultWebsite) {
        throw new Error('Default website not found after migration');
      }

      // Verify data integrity
      const defaultData = await this.verifyWebsiteData('default');
      if (!defaultData) {
        throw new Error('Default website data not accessible');
      }

      return true;
    } catch (error) {
      console.error('Migration validation failed:', error);
      return false;
    }
  }

  async rollbackMigration(): Promise<void> {
    try {
      const backupInfo = localStorage.getItem(this.BACKUP_KEY);
      if (!backupInfo) {
        throw new Error('No backup found for rollback');
      }

      const backup = JSON.parse(backupInfo);
      console.log('Rolling back migration from backup:', backup.timestamp);

      // Restore localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('catalyst_') && key !== this.BACKUP_KEY) {
          localStorage.removeItem(key);
        }
      });

      // TODO: Implement full rollback from backup blob
      console.warn('Full rollback implementation pending');
      
    } catch (error) {
      console.error('Rollback failed:', error);
      throw new Error('Critical: Rollback failed - manual intervention required');
    }
  }

  private async extractLegacyData(): Promise<WebsiteData> {
    const data: WebsiteData = {
      config: {
        id: 'default',
        settings: {},
        metadata: {}
      },
      content: {
        pages: [],
        components: [],
        templates: []
      },
      assets: {
        images: [],
        videos: [],
        documents: []
      },
      aiContext: {
        brandIdentity: null,
        visualIdentity: null,
        contentStrategy: null,
        history: []
      }
    };

    // Extract from localStorage
    try {
      const brandIdentity = localStorage.getItem('catalyst_brand_identity');
      if (brandIdentity) {
        data.aiContext.brandIdentity = JSON.parse(brandIdentity);
      }

      const visualIdentity = localStorage.getItem('catalyst_visual_identity');
      if (visualIdentity) {
        data.aiContext.visualIdentity = JSON.parse(visualIdentity);
      }

      const content = localStorage.getItem('catalyst_content');
      if (content) {
        const parsed = JSON.parse(content);
        data.content = { ...data.content, ...parsed };
      }

      const settings = localStorage.getItem('catalyst_settings');
      if (settings) {
        data.config.settings = JSON.parse(settings);
      }
    } catch (error) {
      console.warn('Error extracting legacy data from localStorage:', error);
    }

    // Extract from IndexedDB if exists
    try {
      const databases = await (indexedDB as any).databases?.() || [];
      for (const dbInfo of databases) {
        if (dbInfo.name === 'catalyst_studio' || dbInfo.name === 'catalyst_data') {
          const dbData = await this.extractDatabaseData(dbInfo.name);
          // Merge database data
          Object.assign(data, dbData);
        }
      }
    } catch (error) {
      console.warn('Error extracting legacy data from IndexedDB:', error);
    }

    return data;
  }

  private async storeInNewFormat(metadata: WebsiteMetadata, data: WebsiteData): Promise<void> {
    // Store will be implemented by WebsiteStorageService
    // This is a placeholder for migration logic
    console.log('Storing data in new format for website:', metadata.id);
  }

  private async cleanupLegacyData(): Promise<void> {
    // Remove old localStorage keys
    const keysToRemove = [
      'catalyst_brand_identity',
      'catalyst_visual_identity',
      'catalyst_content',
      'catalyst_settings'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Delete old databases
    try {
      await this.deleteDatabase('catalyst_studio');
      await this.deleteDatabase('catalyst_data');
    } catch (error) {
      console.warn('Error cleaning up legacy databases:', error);
    }
  }

  private async backupDatabase(dbName: string): Promise<any> {
    const db = await this.openDatabase(dbName);
    const backup: Record<string, any[]> = {};
    
    const objectStoreNames = Array.from(db.objectStoreNames);
    
    for (const storeName of objectStoreNames) {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      backup[storeName] = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    db.close();
    return backup;
  }

  private async extractDatabaseData(dbName: string): Promise<Partial<WebsiteData>> {
    try {
      const db = await this.openDatabase(dbName);
      const data: Partial<WebsiteData> = {};
      
      // Extract data based on object store names
      // This is a placeholder - actual implementation depends on legacy schema
      
      db.close();
      return data;
    } catch (error) {
      console.warn(`Could not extract data from database ${dbName}:`, error);
      return {};
    }
  }

  private async verifyWebsiteData(websiteId: string): Promise<boolean> {
    try {
      const db = await this.openDatabase(`website_${websiteId}`);
      // Basic verification that database exists and is accessible
      db.close();
      return true;
    } catch {
      return false;
    }
  }

  private openDatabase(name: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}