import { prisma } from '@/lib/prisma';
import { SiteStructureService } from './site-structure/site-structure-service';
import { PageOrchestrator } from './site-structure/page-orchestrator';
import { createTypeSystem, TypeSystem } from '@/lib/providers/universal';
import { openai } from '@/lib/ai/openai';
import { z } from 'zod';

// Configuration constants for MVP
export const AI_SITE_GENERATOR_CONFIG = {
  MAX_PAGES: 10,          // MVP limit for site size
  MAX_DEPTH: 3,           // Maximum hierarchy depth
  MAX_RETRIES: 3,         // Retry limit for AI operations
  CHUNK_SIZE: 10,         // Pages per chunk for context management
  MAX_CONTEXT_TOKENS: 8000,
  RETRY_DELAY: 2000,      // ms between retries
  MAX_BREADTH: 20,        // Maximum children per node
  GENERATION_TIMEOUT: 20000, // 20 seconds for MVP scope
} as const;

// Interfaces for generation phases
export interface GenerationResult {
  id: string;
  sitemap: SiteNode[];
  contentTypes: ContentType[];
  pages: Page[];
  status: 'success' | 'partial' | 'failed';
  errors?: GenerationError[];
}

export interface SiteNode {
  title: string;
  slug: string;
  type: string; // content type name
  children?: SiteNode[];
  metadata?: Record<string, any>;
  description?: string;
  seoKeywords?: string[];
}

export interface GenerationProgress {
  phase: 'sitemap' | 'types' | 'pages' | 'content' | 'complete';
  percentage: number;
  message: string;
  errors: string[];
}

export interface GenerationError {
  phase: string;
  message: string;
  details?: any;
}

export interface ContentType {
  id: string;
  name: string;
  fields: any[];
  category: 'page' | 'component';
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  parentId?: string;
  contentTypeId: string;
  metadata?: Record<string, any>;
}

export interface TypeRequirement {
  name: string;
  category: 'page' | 'component';
  suggestedFields?: string[];
  purpose?: string;
}

export interface TypeMap {
  [typeName: string]: string; // maps type name to content type ID
}

// Sitemap validation schema
const SiteNodeSchema: z.ZodType<SiteNode> = z.lazy(() =>
  z.object({
    title: z.string().min(1).max(100),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    type: z.string().min(1),
    children: z.array(SiteNodeSchema).optional(),
    metadata: z.record(z.any()).optional(),
    description: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
  })
);

const SitemapSchema = z.array(SiteNodeSchema);

// State machine for orchestration
export enum GenerationPhase {
  INITIALIZING = 'initializing',
  GENERATING_SITEMAP = 'generating_sitemap',
  DISCOVERING_TYPES = 'discovering_types',
  CREATING_TYPES = 'creating_types',
  CREATING_PAGES = 'creating_pages',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class AISiteGeneratorService {
  private siteStructureService: SiteStructureService;
  private pageOrchestrator: PageOrchestrator;
  private typeSystem: TypeSystem;
  private progressMap: Map<string, GenerationProgress> = new Map();
  private currentPhase: GenerationPhase = GenerationPhase.INITIALIZING;

  constructor() {
    this.siteStructureService = new SiteStructureService();
    this.pageOrchestrator = new PageOrchestrator();
    this.typeSystem = createTypeSystem();
  }

  /**
   * Main entry point for site generation
   */
  async generateSite(requirements: string, websiteId: string): Promise<GenerationResult> {
    const generationId = this.createGenerationId();
    const errors: GenerationError[] = [];
    
    try {
      // Initialize progress tracking
      this.initializeProgress(generationId);
      
      // Phase 1: Generate sitemap from requirements
      this.updateProgress(generationId, GenerationPhase.GENERATING_SITEMAP, 10, 'Generating site structure...');
      const sitemap = await this.generateSitemap(requirements);
      
      // Phase 2: Discover required content types
      this.updateProgress(generationId, GenerationPhase.DISCOVERING_TYPES, 30, 'Discovering content types...');
      const typeRequirements = await this.discoverContentTypes(sitemap);
      
      // Phase 3: Create content types
      this.updateProgress(generationId, GenerationPhase.CREATING_TYPES, 50, 'Creating content types...');
      const contentTypes = await this.createContentTypes(typeRequirements, websiteId);
      
      // Phase 4: Create pages with hierarchy
      this.updateProgress(generationId, GenerationPhase.CREATING_PAGES, 70, 'Creating pages...');
      const typeMap = this.createTypeMap(contentTypes);
      const pages = await this.createPages(sitemap, typeMap, websiteId);
      
      // Complete
      this.updateProgress(generationId, GenerationPhase.COMPLETED, 100, 'Site generation complete');
      
      return {
        id: generationId,
        sitemap,
        contentTypes,
        pages,
        status: 'success',
      };
    } catch (error) {
      this.currentPhase = GenerationPhase.FAILED;
      errors.push({
        phase: this.currentPhase,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      });
      
      // Attempt rollback
      await this.rollback(generationId).catch(console.error);
      
      return {
        id: generationId,
        sitemap: [],
        contentTypes: [],
        pages: [],
        status: 'failed',
        errors,
      };
    }
  }

  /**
   * Generate sitemap from business requirements using AI
   */
  async generateSitemap(requirements: string): Promise<SiteNode[]> {
    const prompt = this.buildSitemapPrompt(requirements);
    let retries = 0;
    
    while (retries < AI_SITE_GENERATOR_CONFIG.MAX_RETRIES) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a website architect. Generate a hierarchical site structure as valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty AI response');

        const parsed = JSON.parse(content);
        const sitemap = parsed.sitemap || parsed.pages || parsed;
        
        // Validate sitemap structure
        const validated = SitemapSchema.parse(Array.isArray(sitemap) ? sitemap : [sitemap]);
        const validationResult = this.validateSitemap(validated);
        
        if (!validationResult.valid) {
          throw new Error(validationResult.error);
        }
        
        return validated;
      } catch (error) {
        retries++;
        if (retries >= AI_SITE_GENERATOR_CONFIG.MAX_RETRIES) {
          throw new Error(`Failed to generate sitemap after ${retries} attempts: ${error}`);
        }
        await this.delay(AI_SITE_GENERATOR_CONFIG.RETRY_DELAY * retries);
      }
    }
    
    throw new Error('Failed to generate sitemap');
  }

  /**
   * Discover required content types from sitemap
   */
  async discoverContentTypes(sitemap: SiteNode[]): Promise<TypeRequirement[]> {
    const typeMap = new Map<string, TypeRequirement>();
    
    // Traverse sitemap and collect unique types
    const traverse = (nodes: SiteNode[], depth = 0) => {
      for (const node of nodes) {
        if (!typeMap.has(node.type)) {
          typeMap.set(node.type, {
            name: node.type,
            category: this.determineCategory(node, depth),
            purpose: node.description,
            suggestedFields: this.suggestFieldsForType(node),
          });
        }
        if (node.children) {
          traverse(node.children, depth + 1);
        }
      }
    };
    
    traverse(sitemap);
    return Array.from(typeMap.values());
  }

  /**
   * Create content types using Universal Type System
   */
  async createContentTypes(requirements: TypeRequirement[], websiteId: string): Promise<ContentType[]> {
    const created: ContentType[] = [];
    
    for (const requirement of requirements) {
      try {
        // Check if type already exists
        const existing = await prisma.contentType.findFirst({
          where: {
            name: requirement.name,
            websiteId,
          },
        });
        
        if (existing) {
          created.push({
            id: existing.id,
            name: existing.name,
            fields: existing.fields as any[],
            category: existing.category as 'page' | 'component',
          });
          continue;
        }
        
        // Generate new type
        const typeDefinition = await this.generateContentType(requirement);
        
        // Create in database
        const contentType = await prisma.contentType.create({
          data: {
            name: typeDefinition.name,
            key: typeDefinition.name.toLowerCase().replace(/\s+/g, '-'),
            pluralName: typeDefinition.name + 's',
            displayField: 'title',
            category: typeDefinition.category,
            fields: typeDefinition.fields as any,
            websiteId,
          },
        });
        
        created.push({
          id: contentType.id,
          name: contentType.name,
          fields: contentType.fields as any[],
          category: contentType.category as 'page' | 'component',
        });
      } catch (error) {
        console.error(`Failed to create content type ${requirement.name}:`, error);
        // Continue with other types
      }
    }
    
    return created;
  }

  /**
   * Create pages with proper hierarchy using PageOrchestrator
   */
  async createPages(sitemap: SiteNode[], typeMap: TypeMap, websiteId: string): Promise<Page[]> {
    const pages: Page[] = [];
    
    // Create pages recursively maintaining hierarchy
    const createPageRecursive = async (nodes: SiteNode[], parentId?: string, parentPath = '') => {
      for (const node of nodes) {
        try {
          const contentTypeId = typeMap[node.type];
          if (!contentTypeId) {
            console.warn(`Content type ${node.type} not found, skipping page ${node.title}`);
            continue;
          }
          
          // Generate full slug path
          const fullSlug = parentPath ? `${parentPath}/${node.slug}` : node.slug;
          
          // Create page using PageOrchestrator
          const pageData = await this.pageOrchestrator.createPage({
            title: node.title,
            slug: fullSlug,
            contentTypeId,
            parentId,
            metadata: {
              ...node.metadata,
              description: node.description,
              seoKeywords: node.seoKeywords,
            },
          }, websiteId);
          
          pages.push({
            id: pageData.contentItem.id,
            title: pageData.contentItem.title,
            slug: pageData.contentItem.slug,
            parentId: pageData.siteStructure.parentId || undefined,
            contentTypeId: pageData.contentItem.contentTypeId,
            metadata: pageData.contentItem.metadata as Record<string, any>,
          });
          
          // Create child pages
          if (node.children && node.children.length > 0) {
            await createPageRecursive(node.children, pageData.contentItem.id, fullSlug);
          }
        } catch (error) {
          console.error(`Failed to create page ${node.title}:`, error);
          // Continue with other pages
        }
      }
    };
    
    await createPageRecursive(sitemap);
    return pages;
  }

  /**
   * Get generation progress
   */
  getProgress(generationId: string): GenerationProgress {
    return this.progressMap.get(generationId) || {
      phase: 'sitemap',
      percentage: 0,
      message: 'Not started',
      errors: [],
    };
  }

  /**
   * Cancel ongoing generation
   */
  async cancelGeneration(generationId: string): Promise<void> {
    // Mark as cancelled and trigger rollback
    this.updateProgress(generationId, GenerationPhase.FAILED, 0, 'Generation cancelled');
    await this.rollback(generationId);
  }

  /**
   * Rollback failed generation
   */
  async rollback(generationId: string): Promise<void> {
    // Implementation would delete created pages and types
    // For MVP, we'll log the attempt
    console.log(`Rollback initiated for generation ${generationId}`);
  }

  // Helper methods
  
  private buildSitemapPrompt(requirements: string): string {
    return `Generate a website sitemap based on these business requirements:

${requirements}

Constraints:
- Maximum ${AI_SITE_GENERATOR_CONFIG.MAX_PAGES} pages total
- Maximum depth of ${AI_SITE_GENERATOR_CONFIG.MAX_DEPTH} levels
- Each page needs a type (e.g., HomePage, AboutPage, ServicePage, BlogPost)
- Include SEO-friendly slugs
- Keep it simple and focused for an MVP

Return as JSON with this structure:
{
  "sitemap": [
    {
      "title": "Home",
      "slug": "home",
      "type": "HomePage",
      "description": "Main landing page",
      "children": [
        {
          "title": "About Us",
          "slug": "about",
          "type": "AboutPage",
          "description": "Company information"
        }
      ]
    }
  ]
}`;
  }

  private validateSitemap(sitemap: SiteNode[], depth = 0): { valid: boolean; error?: string } {
    if (depth > AI_SITE_GENERATOR_CONFIG.MAX_DEPTH) {
      return { valid: false, error: `Exceeds maximum depth of ${AI_SITE_GENERATOR_CONFIG.MAX_DEPTH}` };
    }
    
    const nodeCount = this.countNodes(sitemap);
    if (nodeCount > AI_SITE_GENERATOR_CONFIG.MAX_PAGES) {
      return { valid: false, error: `Exceeds maximum page count of ${AI_SITE_GENERATOR_CONFIG.MAX_PAGES}` };
    }
    
    // Check for circular references (simplified check for MVP)
    const slugs = new Set<string>();
    const checkDuplicates = (nodes: SiteNode[]): boolean => {
      for (const node of nodes) {
        if (slugs.has(node.slug)) return true;
        slugs.add(node.slug);
        if (node.children && checkDuplicates(node.children)) return true;
      }
      return false;
    };
    
    if (checkDuplicates(sitemap)) {
      return { valid: false, error: 'Duplicate slugs detected' };
    }
    
    // Validate children recursively
    for (const node of sitemap) {
      if (node.children && node.children.length > AI_SITE_GENERATOR_CONFIG.MAX_BREADTH) {
        return { valid: false, error: `Node ${node.title} exceeds maximum breadth` };
      }
      if (node.children) {
        const childValidation = this.validateSitemap(node.children, depth + 1);
        if (!childValidation.valid) return childValidation;
      }
    }
    
    return { valid: true };
  }

  private countNodes(sitemap: SiteNode[]): number {
    let count = 0;
    const traverse = (nodes: SiteNode[]) => {
      for (const node of nodes) {
        count++;
        if (node.children) traverse(node.children);
      }
    };
    traverse(sitemap);
    return count;
  }

  private determineCategory(node: SiteNode, depth: number): 'page' | 'component' {
    // Simple heuristic: top-level and named *Page are pages
    if (depth === 0 || node.type.endsWith('Page')) {
      return 'page';
    }
    // If it has children, likely a page
    if (node.children && node.children.length > 0) {
      return 'page';
    }
    // Otherwise could be a component
    return node.type.endsWith('Component') || node.type.endsWith('Section') ? 'component' : 'page';
  }

  private suggestFieldsForType(node: SiteNode): string[] {
    const baseFields = ['title', 'slug'];
    
    // Add fields based on type hints
    if (node.type.includes('Blog') || node.type.includes('Article')) {
      return [...baseFields, 'content', 'author', 'publishDate', 'tags'];
    }
    if (node.type.includes('Product')) {
      return [...baseFields, 'description', 'price', 'images', 'features'];
    }
    if (node.type.includes('Service')) {
      return [...baseFields, 'description', 'features', 'pricing'];
    }
    
    // Default page fields
    return [...baseFields, 'content', 'metaDescription'];
  }

  private async generateContentType(requirement: TypeRequirement): Promise<ContentType> {
    // For MVP, create simple type definitions
    const fields = requirement.suggestedFields || ['title', 'content'];
    
    return {
      id: '', // Will be set by database
      name: requirement.name,
      category: requirement.category,
      fields: fields.map(field => ({
        name: field,
        type: this.mapFieldType(field),
        required: ['title', 'slug'].includes(field),
      })),
    };
  }

  private mapFieldType(fieldName: string): string {
    const typeMap: Record<string, string> = {
      title: 'Text',
      slug: 'Text',
      content: 'LongText',
      description: 'LongText',
      metaDescription: 'Text',
      author: 'Text',
      publishDate: 'Date',
      tags: 'Text',
      price: 'Decimal',
      images: 'Media',
      features: 'LongText',
      pricing: 'LongText',
    };
    
    return typeMap[fieldName] || 'Text';
  }

  private createTypeMap(contentTypes: ContentType[]): TypeMap {
    const map: TypeMap = {};
    for (const type of contentTypes) {
      map[type.name] = type.id;
    }
    return map;
  }

  private createGenerationId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeProgress(generationId: string): void {
    this.progressMap.set(generationId, {
      phase: 'sitemap',
      percentage: 0,
      message: 'Initializing...',
      errors: [],
    });
  }

  private updateProgress(
    generationId: string,
    phase: GenerationPhase,
    percentage: number,
    message: string
  ): void {
    const progress = this.progressMap.get(generationId) || {
      phase: 'sitemap',
      percentage: 0,
      message: '',
      errors: [],
    };
    
    progress.phase = phase.replace('_', ' ').toLowerCase() as any;
    progress.percentage = percentage;
    progress.message = message;
    
    this.progressMap.set(generationId, progress);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}