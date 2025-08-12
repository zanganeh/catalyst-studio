import { 
  WebsiteMetadata, 
  WebsiteData, 
  WebsiteConfig, 
  ContentData, 
  AssetReferences, 
  AIContext,
  StorageQuota,
  GlobalSettings
} from './types';
import { QuotaMonitor } from './quota-monitor';
import { MigrationUtility } from './migration';

export class WebsiteStorageService {
  private db: IDBDatabase | null = null;
  private quotaMonitor: QuotaMonitor;
  private migrationUtility: MigrationUtility;
  private readonly DB_NAME = 'catalyst_global';
  private readonly DB_VERSION = 1;

  constructor() {
    this.quotaMonitor = new QuotaMonitor();
    this.migrationUtility = new MigrationUtility();
  }

  async initializeDB(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
        // Check for migration needs
        const needsMigration = await this.migrationUtility.detectSingleWebsiteData();
        if (needsMigration) {
          console.log('Legacy data detected, starting migration...');
          await this.migrationUtility.migrateFromSingleWebsite();
          const isValid = await this.migrationUtility.validateMigration();
          if (!isValid) {
            throw new Error('Migration validation failed');
          }
        }

        // Open main database
        await this.openGlobalDatabase();

        // Initialize quota monitoring
        await this.quotaMonitor.checkQuota();

        console.log('WebsiteStorageService initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize WebsiteStorageService:', error);
      throw error;
    }
  }

  async getWebsiteData(websiteId: string): Promise<WebsiteData> {
    this.validateWebsiteId(websiteId);

    try {
      const [config, content, assets, aiContext] = await Promise.all([
        this.getWebsiteStore(websiteId, 'config'),
        this.getWebsiteStore(websiteId, 'content'),
        this.getWebsiteStore(websiteId, 'assets'),
        this.getWebsiteStore(websiteId, 'ai_context')
      ]);

      return {
        config: config || this.getDefaultConfig(websiteId),
        content: content || this.getDefaultContent(),
        assets: assets || this.getDefaultAssets(),
        aiContext: aiContext || this.getDefaultAIContext()
      };
    } catch (error) {
      console.error(`Failed to get website data for ${websiteId}:`, error);
      throw error;
    }
  }

  async saveWebsiteData(websiteId: string, data: Partial<WebsiteData>): Promise<void> {
    this.validateWebsiteId(websiteId);

    try {
      const promises: Promise<void>[] = [];

      if (data.config) {
        promises.push(this.saveWebsiteStore(websiteId, 'config', data.config));
      }
      if (data.content) {
        promises.push(this.saveWebsiteStore(websiteId, 'content', data.content));
      }
      if (data.assets) {
        promises.push(this.saveWebsiteStore(websiteId, 'assets', data.assets));
      }
      if (data.aiContext) {
        promises.push(this.saveWebsiteStore(websiteId, 'ai_context', data.aiContext));
      }

      await Promise.all(promises);

      // Update last modified timestamp
      await this.updateWebsiteMetadata(websiteId, { lastModified: new Date() });

      // Check quota after save
      await this.quotaMonitor.checkQuota();
    } catch (error) {
      console.error(`Failed to save website data for ${websiteId}:`, error);
      throw error;
    }
  }

  async deleteWebsiteData(websiteId: string): Promise<void> {
    this.validateWebsiteId(websiteId);

    try {
      // Delete all website-specific databases
      const stores = ['config', 'content', 'assets', 'ai_context'];
      
      for (const store of stores) {
        const dbName = `website_${websiteId}_${store}`;
        await this.deleteDatabase(dbName);
      }

      // Remove from global metadata
      await this.removeWebsiteFromMetadata(websiteId);

      console.log(`Website ${websiteId} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete website ${websiteId}:`, error);
      throw error;
    }
  }

  async listWebsites(): Promise<WebsiteMetadata[]> {
    try {
      if (!this.db) {
        await this.openGlobalDatabase();
      }

      const transaction = this.db!.transaction(['websites'], 'readonly');
      const store = transaction.objectStore('websites');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to list websites:', error);
      throw error;
    }
  }

  async createWebsite(metadata: Omit<WebsiteMetadata, 'id'>): Promise<string> {
    try {
      // Generate unique ID
      const id = this.generateWebsiteId();
      
      const websiteMetadata: WebsiteMetadata = {
        ...metadata,
        id,
        createdAt: new Date(),
        lastModified: new Date(),
        storageQuota: metadata.storageQuota || 100 * 1024 * 1024 // 100MB default
      };

      // Add to global metadata
      await this.addWebsiteToMetadata(websiteMetadata);

      // Initialize empty stores for the website
      await this.initializeWebsiteStores(id);

      console.log(`Website ${id} created successfully`);
      return id;
    } catch (error) {
      console.error('Failed to create website:', error);
      throw error;
    }
  }

  async updateWebsiteMetadata(id: string, updates: Partial<WebsiteMetadata>): Promise<void> {
    this.validateWebsiteId(id);

    try {
      if (!this.db) {
        await this.openGlobalDatabase();
      }

      const transaction = this.db!.transaction(['websites'], 'readwrite');
      const store = transaction.objectStore('websites');
      
      // Get existing metadata
      const existing = await new Promise<WebsiteMetadata>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!existing) {
        throw new Error(`Website ${id} not found`);
      }

      // Update metadata
      const updated = {
        ...existing,
        ...updates,
        id: existing.id, // Prevent ID change
        lastModified: new Date()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(updated);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to update website metadata for ${id}:`, error);
      throw error;
    }
  }

  async exportWebsite(websiteId: string): Promise<Blob> {
    this.validateWebsiteId(websiteId);

    try {
      const data = await this.getWebsiteData(websiteId);
      const metadata = await this.getWebsiteMetadata(websiteId);
      
      const exportData = {
        version: '1.0.0',
        exported: new Date().toISOString(),
        metadata,
        data
      };

      return new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
    } catch (error) {
      console.error(`Failed to export website ${websiteId}:`, error);
      throw error;
    }
  }

  async importWebsite(data: Blob): Promise<string> {
    try {
      const text = await data.text();
      const importData = JSON.parse(text);

      if (!importData.metadata || !importData.data) {
        throw new Error('Invalid import data format');
      }

      // Create new website with imported metadata
      const newId = await this.createWebsite({
        name: importData.metadata.name + ' (Imported)',
        icon: importData.metadata.icon,
        storageQuota: importData.metadata.storageQuota,
        category: importData.metadata.category,
        createdAt: new Date(),
        lastModified: new Date()
      });

      // Import website data
      await this.saveWebsiteData(newId, importData.data);

      console.log(`Website imported successfully with ID: ${newId}`);
      return newId;
    } catch (error) {
      console.error('Failed to import website:', error);
      throw error;
    }
  }

  async checkStorageQuota(): Promise<StorageQuota> {
    const status = await this.quotaMonitor.checkQuota();
    return status.total;
  }

  async getWebsiteStorageSize(websiteId: string): Promise<number> {
    this.validateWebsiteId(websiteId);

    try {
      const stores = ['config', 'content', 'assets', 'ai_context'];
      let totalSize = 0;

      for (const store of stores) {
        const data = await this.getWebsiteStore(websiteId, store);
        if (data) {
          const size = new Blob([JSON.stringify(data)]).size;
          totalSize += size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`Failed to get storage size for website ${websiteId}:`, error);
      return 0;
    }
  }

  async cleanupOldData(websiteId: string): Promise<void> {
    this.validateWebsiteId(websiteId);

    try {
      const suggestions = await this.quotaMonitor.suggestCleanup(websiteId);
      
      // Implement cleanup based on suggestions
      if (suggestions.suggestions.includes('Clear old AI conversation history (keep last 50 entries)')) {
        await this.cleanupAIHistory(websiteId, 50);
      }

      if (suggestions.suggestions.includes('Remove unreferenced asset files')) {
        await this.cleanupUnreferencedAssets(websiteId);
      }

      if (suggestions.suggestions.includes('Clear old content versions and drafts')) {
        await this.cleanupOldContentVersions(websiteId);
      }

      console.log(`Cleanup completed for website ${websiteId}`);
    } catch (error) {
      console.error(`Failed to cleanup data for website ${websiteId}:`, error);
      throw error;
    }
  }

  private async openGlobalDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('websites')) {
          db.createObjectStore('websites', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('version')) {
          db.createObjectStore('version', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async getWebsiteStore(websiteId: string, storeName: string): Promise<any> {
    const dbName = `website_${websiteId}_${storeName}`;
    
    try {
      const db = await this.openWebsiteDatabase(dbName);
      const transaction = db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      
      const data = await new Promise((resolve, reject) => {
        const request = store.get('main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      return data;
    } catch (error) {
      // Database doesn't exist yet, return null
      return null;
    }
  }

  private async saveWebsiteStore(websiteId: string, storeName: string, data: any): Promise<void> {
    const dbName = `website_${websiteId}_${storeName}`;
    
    const db = await this.openWebsiteDatabase(dbName);
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...data, id: 'main' });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  }

  private async openWebsiteDatabase(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async addWebsiteToMetadata(metadata: WebsiteMetadata): Promise<void> {
    if (!this.db) {
      await this.openGlobalDatabase();
    }

    const transaction = this.db!.transaction(['websites'], 'readwrite');
    const store = transaction.objectStore('websites');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeWebsiteFromMetadata(websiteId: string): Promise<void> {
    if (!this.db) {
      await this.openGlobalDatabase();
    }

    const transaction = this.db!.transaction(['websites'], 'readwrite');
    const store = transaction.objectStore('websites');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(websiteId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getWebsiteMetadata(websiteId: string): Promise<WebsiteMetadata | null> {
    if (!this.db) {
      await this.openGlobalDatabase();
    }

    const transaction = this.db!.transaction(['websites'], 'readonly');
    const store = transaction.objectStore('websites');
    
    return new Promise((resolve, reject) => {
      const request = store.get(websiteId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async initializeWebsiteStores(websiteId: string): Promise<void> {
    const stores = ['config', 'content', 'assets', 'ai_context'];
    
    for (const storeName of stores) {
      let initialData: any;
      
      switch (storeName) {
        case 'config':
          initialData = this.getDefaultConfig(websiteId);
          break;
        case 'content':
          initialData = this.getDefaultContent();
          break;
        case 'assets':
          initialData = this.getDefaultAssets();
          break;
        case 'ai_context':
          initialData = this.getDefaultAIContext();
          break;
      }
      
      await this.saveWebsiteStore(websiteId, storeName, initialData);
    }
  }

  private async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanupAIHistory(websiteId: string, keepCount: number): Promise<void> {
    const aiContext = await this.getWebsiteStore(websiteId, 'ai_context');
    if (aiContext && aiContext.history && aiContext.history.length > keepCount) {
      aiContext.history = aiContext.history.slice(-keepCount);
      await this.saveWebsiteStore(websiteId, 'ai_context', aiContext);
    }
  }

  private async cleanupUnreferencedAssets(websiteId: string): Promise<void> {
    // Implementation would check content for asset references
    // and remove unreferenced ones
    console.log(`Cleaning up unreferenced assets for website ${websiteId}`);
  }

  private async cleanupOldContentVersions(websiteId: string): Promise<void> {
    // Implementation would remove old content versions
    console.log(`Cleaning up old content versions for website ${websiteId}`);
  }

  private validateWebsiteId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid website ID');
    }
    
    // Prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error('Website ID contains invalid characters');
    }
  }

  private generateWebsiteId(): string {
    return `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultConfig(websiteId: string): WebsiteConfig {
    return {
      id: websiteId,
      settings: {},
      metadata: {}
    };
  }

  private getDefaultContent(): ContentData {
    return {
      pages: [],
      components: [],
      templates: []
    };
  }

  private getDefaultAssets(): AssetReferences {
    return {
      images: [],
      videos: [],
      documents: []
    };
  }

  private getDefaultAIContext(): AIContext {
    return {
      brandIdentity: null,
      visualIdentity: null,
      contentStrategy: null,
      history: []
    };
  }
}