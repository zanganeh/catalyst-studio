/**
 * Context Provider
 * 
 * Loads and manages website metadata and content structures
 * for AI tool execution with performance optimization.
 */

import { WebsiteService } from '@/lib/services/website-service';
import { getContentTypes } from '@/lib/services/content-type-service';
import type { Website, ContentType } from '@/lib/generated/prisma';

/**
 * Website context for AI operations
 */
export interface WebsiteContext {
  website: Website;
  contentTypes: ContentType[];
  businessRules?: BusinessRules;
  metadata: {
    loadTime: number;
    pruned: boolean;
    tokenEstimate?: number;
  };
}

/**
 * Business rules for different website types
 */
export interface BusinessRules {
  websiteType: string;
  rules: string[];
  constraints: Record<string, any>;
}

/**
 * Context loading options
 */
export interface ContextLoadOptions {
  includeContentTypes?: boolean;
  includeBusinessRules?: boolean;
  maxTokens?: number;
  pruneForTokens?: boolean;
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * Context provider class
 */
export class ContextProvider {
  private websiteService: WebsiteService;
  private cache: Map<string, { context: WebsiteContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_LOAD_TIME = 500; // 500ms requirement

  constructor() {
    this.websiteService = new WebsiteService();
  }

  /**
   * Load website context with performance monitoring
   */
  async loadWebsiteContext(
    websiteId: string,
    options: ContextLoadOptions = {}
  ): Promise<WebsiteContext> {
    const monitor = new PerformanceMonitor();
    monitor.start();

    try {
      // Check cache first
      const cached = this.getCachedContext(websiteId);
      if (cached) {
        return cached;
      }

      // Load website data
      const website = await this.websiteService.getWebsite(websiteId);
      if (!website) {
        throw new Error(`Website not found: ${websiteId}`);
      }

      // Initialize context - ensure metadata and settings are defined
      const context: WebsiteContext = {
        website: {
          ...website,
          metadata: website.metadata || {},
          settings: website.settings || {}
        } as Website,
        contentTypes: [],
        metadata: {
          loadTime: 0,
          pruned: false
        }
      };

      // Load content types if requested
      if (options.includeContentTypes !== false) {
        context.contentTypes = await this.loadContentStructure(websiteId);
      }

      // Load business rules if requested
      if (options.includeBusinessRules) {
        context.businessRules = await this.getBusinessRules(website.category);
      }

      // Prune context if needed
      if (options.pruneForTokens && options.maxTokens) {
        context.metadata.pruned = true;
        await this.pruneContext(context, options.maxTokens);
      }

      // Record load time
      const loadTime = monitor.end();
      context.metadata.loadTime = loadTime;

      // Warn if load time exceeds requirement
      if (loadTime > this.MAX_LOAD_TIME) {
        console.warn(`Context load time exceeded ${this.MAX_LOAD_TIME}ms: ${loadTime}ms`);
      }

      // Cache the context
      this.cacheContext(websiteId, context);

      return context;
    } catch (error) {
      const loadTime = monitor.end();
      console.error(`Failed to load context in ${loadTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Load content structure for a website
   */
  async loadContentStructure(websiteId: string): Promise<ContentType[]> {
    try {
      const contentTypes = await getContentTypes(websiteId);
      // Cast to any then ContentType[] to bypass type incompatibility
      return (contentTypes as any as ContentType[]) || [];
    } catch (error) {
      console.error('Failed to load content structure:', error);
      return [];
    }
  }

  /**
   * Get business rules for a website type (stub for now)
   */
  async getBusinessRules(websiteType: string): Promise<BusinessRules> {
    // Stub implementation - will be fully implemented in Story 5.2+
    const businessRules: BusinessRules = {
      websiteType,
      rules: [
        'Content must be unique and relevant',
        'Navigation must be intuitive',
        'SEO best practices should be followed'
      ],
      constraints: {
        maxMenuDepth: 3,
        maxContentLength: 10000,
        requiredMetaTags: ['title', 'description']
      }
    };

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return businessRules;
  }

  /**
   * Prune context to fit within token limit
   */
  private async pruneContext(context: WebsiteContext, maxTokens: number): Promise<void> {
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (obj: any): number => {
      const str = JSON.stringify(obj);
      return Math.ceil(str.length / 4);
    };

    let currentTokens = estimateTokens(context);
    context.metadata.tokenEstimate = currentTokens;

    if (currentTokens <= maxTokens) {
      return;
    }

    // Pruning strategy: Remove less critical data
    // 1. Remove detailed content type fields
    if (context.contentTypes.length > 0) {
      context.contentTypes = context.contentTypes.map(ct => {
        const parsedFields = typeof ct.fields === 'string' ? JSON.parse(ct.fields) : ct.fields;
        const fieldCount = Array.isArray(parsedFields) ? parsedFields.length : 0;
        return {
          ...ct,
          fields: JSON.stringify({
            summary: `${fieldCount} fields`
          })
        } as ContentType;
      });
      
      currentTokens = estimateTokens(context);
      context.metadata.tokenEstimate = currentTokens;
      
      if (currentTokens <= maxTokens) {
        return;
      }
    }

    // 2. Remove business rules if present
    if (context.businessRules) {
      delete context.businessRules;
      currentTokens = estimateTokens(context);
      context.metadata.tokenEstimate = currentTokens;
      
      if (currentTokens <= maxTokens) {
        return;
      }
    }

    // 3. Limit content types to essential ones
    if (context.contentTypes.length > 5) {
      context.contentTypes = context.contentTypes.slice(0, 5);
      currentTokens = estimateTokens(context);
      context.metadata.tokenEstimate = currentTokens;
    }
  }

  /**
   * Get cached context if still valid
   */
  private getCachedContext(websiteId: string): WebsiteContext | null {
    const cached = this.cache.get(websiteId);
    
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(websiteId);
      return null;
    }

    return cached.context;
  }

  /**
   * Cache context for future use
   */
  private cacheContext(websiteId: string, context: WebsiteContext): void {
    this.cache.set(websiteId, {
      context,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear cache for a specific website or all
   */
  clearCache(websiteId?: string): void {
    if (websiteId) {
      this.cache.delete(websiteId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Generate system prompt from context
   */
  generateSystemPrompt(context: WebsiteContext): string {
    const parts: string[] = [
      `You are assisting with website: ${context.website.name}`,
      `Website category: ${context.website.category}`,
      `Active: ${context.website.isActive}`,
      '',
      '=== CRITICAL BEHAVIOR RULES ===',
      '',
      '1. BE PROACTIVE:',
      '- When user creates a website, AUTOMATICALLY create content types that match the website purpose',
      '- For blogs: create Article/Post content type. For recipes: create Recipe content type. For e-commerce: create Product content type',
      '- ALWAYS add 2-3 sample content items WITHOUT being asked',
      '- Complete the entire setup in ONE go',
      '- Do NOT create generic placeholder content types like "NewContentType"',
      '',
      '2. BE CONCISE:',
      '- Use brief progress indicators: "✓ Created Recipe content type"',
      '- Group similar actions: "Creating 3 sample items..."',
      '- Keep responses under 10 lines unless asked for details',
      '- NO walls of text, NO listing every field',
      '',
      '3. OUTPUT FORMAT:',
      'Setting up [website type]...',
      '✓ Updated business requirements',
      '✓ Created [X] content type',
      '✓ Created [Y] content type',
      '',
      'Adding sample content...',
      '✓ Created [N] items',
      '',
      'Your [website] is ready with [N] content items.',
      '',
      '4. TOOL EXECUTION:',
      '- When you say you WILL do something, EXECUTE the tool immediately',
      '- Do not describe what you would do - DO IT',
      '- Execute ALL promised actions before responding',
      '',
      '5. CONTENT ITEM CREATION:',
      '- FIRST: Check the content type fields using getContentType or listContentTypes',
      '- Use EXACT field names from the content type (case-sensitive)',
      '- The "data" parameter must be an object with field names as keys',
      '- Match field types: text/textarea/richtext → string, number → number',
      '- For image fields: use placeholder like "https://placehold.co/600x400"',
      '- Example structure:',
      '  {',
      '    contentTypeId: "the-content-type-id",',
      '    slug: "unique-slug-here",',
      '    data: {',
      '      fieldName1: "value1",',
      '      fieldName2: 123,',
      '      // Include ALL required fields from the content type',
      '    }',
      '  }',
      '- Generate unique slugs for each item (e.g., "recipe-1", "recipe-2")',
      '',
      '6. ERROR HANDLING:',
      '- If a tool fails, show: "⚠ [Brief error description]"',
      '- Continue with remaining tasks after noting the error',
      '- Include error count in final summary if any occurred',
      '- Common errors to handle gracefully:',
      '  - Validation errors: Show which fields are missing/invalid',
      '  - Duplicate slugs: Generate unique slugs automatically',
      '  - Type mismatches: Check field types match requirements',
      '',
      '7. WEBSITE CREATION PATTERN:',
      'Step 1: Setup website → Step 2: Create content types → Step 3: Add sample content → Done',
      'All automatic, no questions, one complete flow.',
      '',
      '8. COMPLETION:',
      '- ALWAYS end with a brief summary: "Your [type] website is ready with [N] content types and [M] sample items."',
      '- Keep it to ONE line',
      '- Focus on what was created, not technical details',
      '',
      '=== END CRITICAL RULES ==='
    ];

    if (context.contentTypes.length > 0) {
      parts.push(`Available content types: ${context.contentTypes.map(ct => ct.name).join(', ')}`);
    }

    if (context.businessRules) {
      parts.push(`Business rules: ${context.businessRules.rules.join('; ')}`);
    }

    return parts.join('\n');
  }
}

// Lazy initialization for singleton instance
let contextProviderInstance: ContextProvider | null = null;

const getContextProvider = (): ContextProvider => {
  if (!contextProviderInstance) {
    contextProviderInstance = new ContextProvider();
  }
  return contextProviderInstance;
};

// Export convenience functions
export const loadWebsiteContext = (websiteId: string, options?: ContextLoadOptions) => 
  getContextProvider().loadWebsiteContext(websiteId, options);

export const loadContentStructure = (websiteId: string) => 
  getContextProvider().loadContentStructure(websiteId);

export const getBusinessRules = (websiteType: string) => 
  getContextProvider().getBusinessRules(websiteType);

export const generateSystemPrompt = (context: WebsiteContext) => 
  getContextProvider().generateSystemPrompt(context);