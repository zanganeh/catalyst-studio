export interface WebsiteMetadata {
  id: string;
  name: string;
  icon?: string;
  createdAt: Date;
  lastModified: Date;
  storageQuota: number;
  category?: string;
}

export interface GlobalSettings {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultQuota?: number;
}

export interface WebsiteConfig {
  id: string;
  settings?: Record<string, unknown>;
  theme?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ContentData {
  pages?: unknown[];
  components?: unknown[];
  templates?: unknown[];
}

export interface AssetReferences {
  images?: string[];
  videos?: string[];
  documents?: string[];
}

export interface AIContext {
  brandIdentity?: unknown;
  visualIdentity?: unknown;
  contentStrategy?: unknown;
  history?: unknown[];
}

export interface WebsiteData {
  config: WebsiteConfig;
  content: ContentData;
  assets: AssetReferences;
  aiContext: AIContext;
}

export interface StorageArchitecture {
  catalyst_global: {
    version: string;
    websites: WebsiteMetadata[];
    settings: GlobalSettings;
  };
  [key: `website_${string}_config`]: WebsiteConfig;
  [key: `website_${string}_content`]: ContentData;
  [key: `website_${string}_assets`]: AssetReferences;
  [key: `website_${string}_ai_context`]: AIContext;
}

export interface StorageQuota {
  usage: number;
  quota: number;
  percentUsed: number;
}

export interface QuotaStatus {
  total: StorageQuota;
  byWebsite: Map<string, number>;
  warning: boolean;
  critical: boolean;
}

export interface CleanupSuggestions {
  websiteId: string;
  suggestions: string[];
  potentialSavings: number;
}