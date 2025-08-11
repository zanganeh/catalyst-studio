interface StorageStrategy {
  name: string;
  isAvailable(): Promise<boolean>;
  save(key: string, data: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getQuota(): Promise<{ usage: number; quota: number }>;
}

export class IndexedDBStorage implements StorageStrategy {
  name = 'IndexedDB';
  private dbName = 'catalyst-studio';
  private storeName = 'persistence';
  private version = 1;

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return 'indexedDB' in window;
  }

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async save(key: string, data: unknown): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(JSON.stringify(data), key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? JSON.parse(result) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSize(): Promise<number> {
    if ('estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    if ('estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }
}

export class LocalStorage implements StorageStrategy {
  name = 'LocalStorage';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async save(key: string, data: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (
        e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        throw new Error('LocalStorage quota exceeded');
      }
      throw e;
    }
  }

  async load<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('catalyst:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  async getSize(): Promise<number> {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size * 2; // Assuming 2 bytes per character
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    const size = await this.getSize();
    // LocalStorage typically has 5-10MB limit
    return {
      usage: size,
      quota: 10 * 1024 * 1024 // 10MB
    };
  }
}

export class SessionStorage implements StorageStrategy {
  name = 'SessionStorage';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async save(key: string, data: unknown): Promise<void> {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (
        e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        throw new Error('SessionStorage quota exceeded');
      }
      throw e;
    }
  }

  async load<T>(key: string): Promise<T | null> {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async remove(key: string): Promise<void> {
    sessionStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('catalyst:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  async getSize(): Promise<number> {
    let size = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        size += sessionStorage[key].length + key.length;
      }
    }
    return size * 2;
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    const size = await this.getSize();
    return {
      usage: size,
      quota: 10 * 1024 * 1024
    };
  }
}

export class MemoryStorage implements StorageStrategy {
  name = 'MemoryStorage';
  private store: Map<string, string> = new Map();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async save(key: string, data: unknown): Promise<void> {
    this.store.set(key, JSON.stringify(data));
  }

  async load<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    return item ? JSON.parse(item) : null;
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    const keysToDelete: string[] = [];
    this.store.forEach((_, key) => {
      if (key.startsWith('catalyst:')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.store.delete(key));
  }

  async getSize(): Promise<number> {
    let size = 0;
    this.store.forEach((value, key) => {
      size += value.length + key.length;
    });
    return size * 2;
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    const size = await this.getSize();
    return {
      usage: size,
      quota: Number.MAX_SAFE_INTEGER
    };
  }
}

export class StorageService {
  private strategies: StorageStrategy[] = [
    new IndexedDBStorage(),
    new LocalStorage(),
    new SessionStorage(),
    new MemoryStorage()
  ];
  
  private currentStrategy: StorageStrategy | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    for (const strategy of this.strategies) {
      try {
        if (await strategy.isAvailable()) {
          this.currentStrategy = strategy;
          console.log(`Storage initialized with ${strategy.name}`);
          this.initialized = true;
          return;
        }
      } catch (e) {
        console.warn(`Failed to initialize ${strategy.name}:`, e);
      }
    }

    throw new Error('No storage strategy available');
  }

  async save(key: string, data: unknown): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    let lastError: Error | null = null;
    
    for (const strategy of this.strategies) {
      try {
        if (await strategy.isAvailable()) {
          await strategy.save(key, data);
          
          if (strategy !== this.currentStrategy) {
            console.warn(`Fallback to ${strategy.name} for saving`);
            this.currentStrategy = strategy;
          }
          return;
        }
      } catch (e) {
        lastError = e as Error;
        console.warn(`Storage failed for ${strategy.name}, trying next...`, e);
      }
    }
    
    if (lastError) {
      throw lastError;
    }
  }

  async load<T>(key: string): Promise<T | null> {
    if (!this.initialized) await this.initialize();
    
    for (const strategy of this.strategies) {
      try {
        if (await strategy.isAvailable()) {
          const data = await strategy.load<T>(key);
          if (data !== null) {
            if (strategy !== this.currentStrategy) {
              console.warn(`Fallback to ${strategy.name} for loading`);
              this.currentStrategy = strategy;
            }
            return data;
          }
        }
      } catch (e) {
        console.warn(`Failed to load from ${strategy.name}:`, e);
      }
    }
    
    return null;
  }

  async remove(key: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    for (const strategy of this.strategies) {
      try {
        if (await strategy.isAvailable()) {
          await strategy.remove(key);
        }
      } catch (e) {
        console.warn(`Failed to remove from ${strategy.name}:`, e);
      }
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    for (const strategy of this.strategies) {
      try {
        if (await strategy.isAvailable()) {
          await strategy.clear();
        }
      } catch (e) {
        console.warn(`Failed to clear ${strategy.name}:`, e);
      }
    }
  }

  async getStorageInfo(): Promise<{
    currentStrategy: string;
    usage: number;
    quota: number;
    percentage: number;
  }> {
    if (!this.initialized) await this.initialize();
    
    if (this.currentStrategy) {
      const { usage, quota } = await this.currentStrategy.getQuota();
      return {
        currentStrategy: this.currentStrategy.name,
        usage,
        quota,
        percentage: quota > 0 ? (usage / quota) * 100 : 0
      };
    }
    
    return {
      currentStrategy: 'None',
      usage: 0,
      quota: 0,
      percentage: 0
    };
  }

  getCurrentStrategy(): string {
    return this.currentStrategy?.name || 'None';
  }
}

export const storageService = new StorageService();