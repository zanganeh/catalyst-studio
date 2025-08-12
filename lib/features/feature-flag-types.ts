// Type definitions for Feature Flag System
export interface FeatureFlagEnvironment {
  NEXT_PUBLIC_MULTI_WEBSITE?: string;
  NEXT_PUBLIC_DASHBOARD?: string;
  NEXT_PUBLIC_AI_CREATION?: string;
  NEXT_PUBLIC_ROLLOUT_PERCENTAGE?: string;
  NEXT_PUBLIC_BETA_USERS?: string;
}

export interface UserContext {
  userId?: string;
  email?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlagEvaluationContext {
  user?: UserContext;
  timestamp?: Date;
  environment?: 'development' | 'staging' | 'production';
}

export interface FeatureFlagResult {
  enabled: boolean;
  reason?: 'disabled' | 'date_range' | 'blocklist' | 'allowlist' | 'rollout' | 'enabled';
  metadata?: Record<string, any>;
}