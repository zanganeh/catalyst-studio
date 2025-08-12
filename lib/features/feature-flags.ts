import { useState, useEffect } from 'react';

export enum FeatureFlag {
  MULTI_WEBSITE_SUPPORT = 'multi_website_support',
  AI_WEBSITE_CREATION = 'ai_website_creation',
  DASHBOARD_VIEW = 'dashboard_view'
}

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number;
  allowedUsers?: string[];
  blockedUsers?: string[];
  startDate?: Date;
  endDate?: Date;
  description: string;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<FeatureFlag, FeatureFlagConfig>;
  
  private constructor() {
    this.flags = new Map([
      [FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: process.env.NEXT_PUBLIC_MULTI_WEBSITE === 'true',
        rolloutPercentage: this.parseRolloutPercentage(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE),
        description: 'Enables multi-website management capabilities',
        startDate: new Date('2025-02-01'),
        allowedUsers: this.parseUserList(process.env.NEXT_PUBLIC_BETA_USERS)
      }],
      [FeatureFlag.AI_WEBSITE_CREATION, {
        enabled: process.env.NEXT_PUBLIC_AI_CREATION === 'true',
        rolloutPercentage: 100,
        description: 'AI-powered website creation from natural language'
      }],
      [FeatureFlag.DASHBOARD_VIEW, {
        enabled: process.env.NEXT_PUBLIC_DASHBOARD === 'true',
        rolloutPercentage: 100,
        description: 'New dashboard interface for website management'
      }]
    ]);
  }
  
  private parseRolloutPercentage(value?: string): number {
    const parsed = parseInt(value || '0');
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  }
  
  private parseUserList(value?: string): string[] {
    if (!value) return [];
    return value.split(',').map(u => u.trim()).filter(u => u.length > 0);
  }
  
  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }
  
  isEnabled(flag: FeatureFlag, userId?: string): boolean {
    const config = this.flags.get(flag);
    if (!config || !config.enabled) return false;
    
    // Check date range
    const now = new Date();
    if (config.startDate && now < config.startDate) return false;
    if (config.endDate && now > config.endDate) return false;
    
    // Check user allowlist/blocklist
    if (userId) {
      if (config.blockedUsers?.includes(userId)) return false;
      if (config.allowedUsers && config.allowedUsers.length > 0 && config.allowedUsers.includes(userId)) return true;
    }
    
    // Check rollout percentage
    if (config.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId || 'anonymous');
      return hash < config.rolloutPercentage;
    }
    
    return true;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100; // Ensure result is 0-99
  }
  
  // Admin functions
  setFlag(flag: FeatureFlag, config: Partial<FeatureFlagConfig>): void {
    const existing = this.flags.get(flag);
    if (existing) {
      this.flags.set(flag, { ...existing, ...config });
    }
  }
  
  getAllFlags(): Map<FeatureFlag, FeatureFlagConfig> {
    return new Map(this.flags);
  }
}

// React Hook
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    // Get user ID from session/context - placeholder for now
    const getUserId = () => {
      // Implementation depends on auth system
      // For now, check localStorage or session storage
      if (typeof window !== 'undefined') {
        return localStorage.getItem('userId') || undefined;
      }
      return undefined;
    };
    
    const userId = getUserId();
    const service = FeatureFlagService.getInstance();
    setIsEnabled(service.isEnabled(flag, userId));
  }, [flag]);
  
  return isEnabled;
}