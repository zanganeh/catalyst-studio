import { QuotaStatus, CleanupSuggestions, StorageQuota } from './types';

export class QuotaMonitor {
  private readonly WARNING_THRESHOLD = 0.8;  // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%
  private quotaWarningCallbacks: ((status: QuotaStatus) => void)[] = [];

  async checkQuota(): Promise<QuotaStatus> {
    try {
      // Check if navigator.storage is available
      if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
        return {
          total: {
            usage: 0,
            quota: 0,
            percentUsed: 0
          },
          byWebsite: new Map(),
          warning: false,
          critical: false
        };
      }
      
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) : 0;

      const status: QuotaStatus = {
        total: {
          usage,
          quota,
          percentUsed
        },
        byWebsite: await this.getUsageByWebsite(),
        warning: percentUsed >= this.WARNING_THRESHOLD,
        critical: percentUsed >= this.CRITICAL_THRESHOLD
      };

      if (status.warning || status.critical) {
        this.notifyWarningCallbacks(status);
      }

      return status;
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      throw error;
    }
  }

  async getUsageByWebsite(): Promise<Map<string, number>> {
    const usageMap = new Map<string, number>();
    
    try {
      const databases = await (indexedDB as any).databases?.() || [];
      
      for (const dbInfo of databases) {
        if (dbInfo.name?.startsWith('website_')) {
          const websiteId = dbInfo.name.split('_')[1];
          const size = await this.estimateDatabaseSize(dbInfo.name);
          usageMap.set(websiteId, size);
        }
      }
    } catch (error) {
      console.warn('Could not get per-website usage:', error);
    }

    return usageMap;
  }

  async suggestCleanup(websiteId: string): Promise<CleanupSuggestions> {
    const suggestions: string[] = [];
    let potentialSavings = 0;

    try {
      const db = await this.openDatabase(`website_${websiteId}`);
      
      // Check for old AI context history
      const aiStore = db.transaction(['ai_context'], 'readonly').objectStore('ai_context');
      const aiData = await this.getAll(aiStore);
      
      if (aiData.length > 100) {
        suggestions.push('Clear old AI conversation history (keep last 50 entries)');
        potentialSavings += this.estimateSize(aiData.slice(0, -50));
      }

      // Check for unused assets
      const assetStore = db.transaction(['assets'], 'readonly').objectStore('assets');
      const assets = await this.getAll(assetStore);
      
      if (assets.length > 0) {
        suggestions.push('Remove unreferenced asset files');
        potentialSavings += this.estimateSize(assets) * 0.3; // Estimate 30% are unused
      }

      // Check for old content versions
      const contentStore = db.transaction(['content'], 'readonly').objectStore('content');
      const content = await this.getAll(contentStore);
      
      if (content.length > 0) {
        suggestions.push('Clear old content versions and drafts');
        potentialSavings += this.estimateSize(content) * 0.2; // Estimate 20% are old versions
      }

      db.close();
    } catch (error) {
      console.warn('Could not generate cleanup suggestions:', error);
    }

    return {
      websiteId,
      suggestions,
      potentialSavings
    };
  }

  onQuotaWarning(callback: (status: QuotaStatus) => void): void {
    this.quotaWarningCallbacks.push(callback);
  }

  private notifyWarningCallbacks(status: QuotaStatus): void {
    this.quotaWarningCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Quota warning callback error:', error);
      }
    });
  }

  private async openDatabase(name: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async estimateDatabaseSize(dbName: string): Promise<number> {
    try {
      const db = await this.openDatabase(dbName);
      let totalSize = 0;
      
      const objectStoreNames = Array.from(db.objectStoreNames);
      
      for (const storeName of objectStoreNames) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const data = await this.getAll(store);
        totalSize += this.estimateSize(data);
      }
      
      db.close();
      return totalSize;
    } catch (error) {
      console.warn(`Could not estimate size for database ${dbName}:`, error);
      return 0;
    }
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }
}