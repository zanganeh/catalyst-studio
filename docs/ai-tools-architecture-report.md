# AI Tools Architecture & Implementation Report for CMS Content Management

## Executive Summary

This report provides a comprehensive architecture and implementation guide for extending your CMS website builder with AI-powered content management capabilities. Based on research of industry leaders (bolt.diy, Cursor, GitHub Copilot) and modern AI frameworks (Vercel AI SDK, LangChain), it presents the correct patterns for implementing AI tool calling, context management, and testing.

**Key Finding**: Modern AI systems don't describe tools in prompts - they pass tools as structured code objects that AI models understand natively through SDKs.

## Current State Analysis

### Existing Architecture
- **Framework**: Next.js 14 with App Router
- **AI Integration**: OpenRouter with Vercel AI SDK
- **Database**: SQLite with Prisma ORM
- **Content Storage**: JSON fields in database for flexible schema
- **Chat Interface**: Basic streaming chat at `/api/chat/route.ts`

### Key Findings
1. Content types are already migrated to database (Story 4.4)
2. Existing AI integration is basic - only chat without tools
3. Strong foundation with Prisma and typed services
4. No current tool/function calling implementation

## Part 1: How Modern AI Systems Actually Work

### 1.1 Tool Exposure - The Correct Pattern

#### ❌ WRONG: Describing Tools in System Prompt
```typescript
// This is NOT how modern systems work
const systemPrompt = `
You have these tools available:
- createContentType: Creates a content type
- updateContentType: Updates a content type
`;
```

#### ✅ CORRECT: Tools as Structured Objects (Vercel AI SDK)
```typescript
import { tool } from 'ai';
import { z } from 'zod';

// Tools are defined with schemas and execute functions
const createContentType = tool({
  description: 'Create a new content type with fields',
  parameters: z.object({
    websiteId: z.string(),
    name: z.string().describe('Content type name'),
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'number', 'boolean', 'date', 'richtext']),
      required: z.boolean()
    }))
  }),
  execute: async ({ websiteId, name, fields }) => {
    // Actual implementation that creates in database
    return await contentTypeService.create({ websiteId, name, fields });
  }
});

// Pass tools to AI model - NOT in system prompt
const result = await streamText({
  model: openai('gpt-4'),
  tools: {
    createContentType,
    updateContentType,
    deleteContentType,
    listContentTypes
  },
  toolChoice: 'auto', // AI decides when to use tools
  messages
});
```

### 1.2 How AI Gets Application Context

#### A. Dynamic Database Context (Your CMS Needs)
```typescript
class CMSContextProvider {
  async getContext(websiteId: string) {
    // Load fresh context from database
    const [website, contentTypes, stats] = await Promise.all([
      db.website.findUnique({ where: { id: websiteId }}),
      db.contentType.findMany({ where: { websiteId }}),
      this.getContentStatistics(websiteId)
    ]);
    
    return {
      website: {
        id: website.id,
        name: website.name,
        category: website.category, // blog, ecommerce, portfolio
        metadata: JSON.parse(website.metadata || '{}')
      },
      existingContentTypes: contentTypes.map(ct => ({
        id: ct.id,
        name: ct.name,
        fieldCount: JSON.parse(ct.fields).length
      })),
      statistics: stats
    };
  }
}
```

#### B. Codebase Indexing (How Cursor/Copilot Work)
```typescript
// These tools index entire codebases for context
class CodebaseIndexer {
  private vectorStore: VectorDatabase;
  
  async indexProject() {
    // Scan all files
    // Extract imports, exports, functions
    // Build dependency graph
    // Store in vector database for similarity search
  }
  
  async getRelevantContext(query: string) {
    // Use embedding similarity to find relevant code
    return this.vectorStore.search(query, limit: 10);
  }
}
```

#### C. WebContainer Approach (bolt.diy)
```typescript
// AI gets direct control over environment
class AIEnvironmentController {
  filesystem: FileSystemAPI;     // Direct file manipulation
  terminal: TerminalAPI;         // Run commands
  packageManager: PackageManagerAPI; // Install packages
  browser: BrowserAPI;           // See output
  
  // AI executes actions directly, no description needed
  async executeAction(action: AIAction) {
    return await this[action.type].execute(action.params);
  }
}
```

## Part 2: Proposed Architecture for Your CMS

### 2.1 Enhanced Context Management System

```typescript
interface CMSAIContext {
  // Website Business Context
  website: {
    id: string;
    name: string;
    category: 'blog' | 'ecommerce' | 'portfolio' | 'saas' | 'corporate';
    businessType: string; // "Technology Blog", "Fashion Store", etc.
    targetAudience: string;
    primaryGoals: string[];
    requirements: {
      seo: boolean;
      multilingual: boolean;
      accessibility: 'basic' | 'WCAG21AA' | 'WCAG21AAA';
      performance: 'standard' | 'high' | 'critical';
    };
  };
  
  // Current Content Structure
  contentStructure: {
    types: Array<{
      id: string;
      name: string;
      fields: Field[];
      itemCount: number;
    }>;
    totalItems: number;
    relationships: Relationship[];
  };
  
  // Business Rules (NOT tool descriptions)
  validationRules: {
    [contentType: string]: ValidationRule[];
  };
}
```

### 2.2 Tool System Architecture

#### Tool Categories and Implementation

```typescript
// 1. Website Management Tools
const websiteTools = {
  getWebsiteContext: tool({
    description: 'Get current website configuration and requirements',
    parameters: z.object({ websiteId: z.string() }),
    execute: async ({ websiteId }) => {
      return await contextProvider.getFullContext(websiteId);
    }
  }),
  
  updateWebsiteRequirements: tool({
    description: 'Update business requirements and goals',
    parameters: z.object({
      websiteId: z.string(),
      requirements: z.object({
        seo: z.boolean().optional(),
        multilingual: z.boolean().optional(),
        accessibility: z.enum(['basic', 'WCAG21AA']).optional()
      })
    }),
    execute: async (params) => {
      return await websiteService.updateRequirements(params);
    }
  })
};

// 2. Content Type Tools
const contentTypeTools = {
  createContentType: tool({
    description: 'Create a content type with validation rules',
    parameters: z.object({
      websiteId: z.string(),
      name: z.string(),
      fields: z.array(fieldSchema)
    }),
    execute: async (params) => {
      // Apply business rules based on website category
      const rules = await getValidationRulesForCategory(params.websiteId);
      const enrichedFields = applyBusinessRules(params.fields, rules);
      return await contentTypeService.create({
        ...params,
        fields: enrichedFields
      });
    }
  })
};

// 3. Content Item Tools  
const contentItemTools = {
  createContentItem: tool({
    description: 'Create content with automatic validation',
    parameters: z.object({
      contentTypeId: z.string(),
      data: z.record(z.any())
    }),
    execute: async ({ contentTypeId, data }) => {
      // Validate against content type schema
      const contentType = await getContentType(contentTypeId);
      const validated = await validateContent(data, contentType);
      return await contentItemService.create(validated);
    }
  }),
  
  generateMockContent: tool({
    description: 'Generate realistic sample content',
    parameters: z.object({
      contentTypeId: z.string(),
      count: z.number().min(1).max(100)
    }),
    execute: async ({ contentTypeId, count }) => {
      const contentType = await getContentType(contentTypeId);
      return await mockDataGenerator.generate(contentType, count);
    }
  })
};
```

### 2.3 The Correct Pipeline Implementation

```typescript
// app/api/chat/enhanced/route.ts
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export async function POST(req: Request) {
  const { messages, websiteId } = await req.json();
  
  // 1. Load dynamic context (NOT static prompt)
  const context = await cmsContext.getContext(websiteId);
  
  // 2. Build system prompt with business context ONLY
  const systemPrompt = `
You are managing a ${context.website.category} website: "${context.website.name}".
Business Type: ${context.website.businessType}
Target Audience: ${context.website.targetAudience}

Current content structure:
${context.contentStructure.types.map(t => 
  `- ${t.name}: ${t.fieldCount} fields, ${t.itemCount} items`
).join('\n')}

Requirements:
- SEO: ${context.website.requirements.seo ? 'Required' : 'Optional'}
- Accessibility: ${context.website.requirements.accessibility}
- Performance: ${context.website.requirements.performance}

When creating content, apply these business rules:
${getBusinessRulesForCategory(context.website.category)}
`;
  
  // 3. Tools are passed as objects, NOT described in prompt
  const allTools = {
    ...websiteTools,
    ...contentTypeTools,
    ...contentItemTools
  };
  
  // 4. Stream response with native tool support
  const result = await streamText({
    model: openrouter('anthropic/claude-3.5-sonnet'),
    system: systemPrompt,
    messages,
    tools: allTools,
    toolChoice: 'auto',
    maxSteps: 5, // Allow multi-step tool execution
    onToolCall: async ({ toolName, args }) => {
      // Optional: Log tool usage for analytics
      console.log(`Tool called: ${toolName}`, args);
    }
  });
  
  return result.toDataStreamResponse();
}
```

### 2.4 Context-Aware Validation Rules

```typescript
function getValidationRulesForCategory(category: string): ValidationRule[] {
  const rules: Record<string, ValidationRule[]> = {
    blog: [
      { field: 'title', type: 'required', message: 'Blog posts must have titles' },
      { field: 'slug', type: 'pattern', value: '^[a-z0-9-]+$', message: 'SEO-friendly URLs required' },
      { field: 'seoTitle', type: 'maxLength', value: 60, message: 'SEO title max 60 chars' },
      { field: 'seoDescription', type: 'range', min: 120, max: 160, message: 'SEO description 120-160 chars' },
      { field: 'publishDate', type: 'required', message: 'Publication date required' },
      { field: 'author', type: 'required', message: 'Author attribution required' }
    ],
    ecommerce: [
      { field: 'sku', type: 'unique', message: 'Product SKU must be unique' },
      { field: 'price', type: 'min', value: 0, message: 'Price must be positive' },
      { field: 'inventory', type: 'required', message: 'Inventory tracking required' },
      { field: 'images', type: 'minCount', value: 1, message: 'At least one product image required' },
      { field: 'description', type: 'required', message: 'Product description required for SEO' }
    ],
    portfolio: [
      { field: 'projectName', type: 'required', message: 'Project name required' },
      { field: 'clientName', type: 'required', message: 'Client attribution required' },
      { field: 'completionDate', type: 'required', message: 'Project date required' },
      { field: 'technologies', type: 'minCount', value: 1, message: 'List technologies used' }
    ]
  };
  
  return rules[category] || [];
}
```

## Part 3: Testing Strategy

### 3.1 Unit Testing Tools
```typescript
describe('Content Type Tools', () => {
  it('should create content type with business rules', async () => {
    const tool = contentTypeTools.createContentType;
    
    // Test execute function directly
    const result = await tool.execute({
      websiteId: 'blog_site',
      name: 'Article',
      fields: [
        { name: 'title', type: 'text', required: true }
      ]
    });
    
    // Verify business rules were applied
    expect(result.fields).toContainEqual(
      expect.objectContaining({ name: 'seoTitle' }) // Auto-added for blogs
    );
  });
});
```

### 3.2 Integration Testing
```typescript
describe('AI Pipeline Integration', () => {
  it('should handle content creation request', async () => {
    const response = await fetch('/api/chat/enhanced', {
      method: 'POST',
      body: JSON.stringify({
        websiteId: 'test_blog',
        messages: [{
          role: 'user',
          content: 'Create a blog post content type with all necessary fields'
        }]
      })
    });
    
    const stream = response.body;
    const reader = stream.getReader();
    
    // Verify tool was called
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
    
    const content = chunks.join('');
    expect(content).toContain('createContentType');
    
    // Verify database changes
    const contentType = await db.contentType.findFirst({
      where: { name: 'Blog Post' }
    });
    expect(contentType).toBeDefined();
    expect(JSON.parse(contentType.fields)).toContainEqual(
      expect.objectContaining({ name: 'seoTitle' })
    );
  });
});
```

### 3.3 E2E Testing with Mock AI
```typescript
describe('Complete User Flow', () => {
  beforeEach(() => {
    // Mock AI responses for deterministic testing
    mockStreamText.mockImplementation(async ({ tools, messages }) => {
      if (messages[0].content.includes('blog')) {
        // Simulate AI calling createContentType tool
        await tools.createContentType.execute({
          websiteId: 'test',
          name: 'Blog Post',
          fields: blogFields
        });
      }
      return mockStreamResponse('Created Blog Post content type');
    });
  });
  
  it('should create blog structure from conversation', async () => {
    // User interaction
    await userChat.send('I need a blog structure');
    
    // Verify results
    const contentTypes = await db.contentType.findMany();
    expect(contentTypes).toHaveLength(1);
    expect(contentTypes[0].name).toBe('Blog Post');
  });
});
```

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Research modern AI tool patterns
- [ ] Set up Vercel AI SDK with tool support
- [ ] Create base tool definitions with Zod
- [ ] Implement context provider

### Phase 2: Core Tools (Week 2)
- [ ] Implement website management tools
- [ ] Implement content type CRUD tools
- [ ] Implement content item tools
- [ ] Add validation based on website category

### Phase 3: Context & Intelligence (Week 3)
- [ ] Build dynamic context loading
- [ ] Implement business rule engine
- [ ] Add mock data generation
- [ ] Create smart suggestions based on category

### Phase 4: Testing & Polish (Week 4)
- [ ] Unit tests for all tools
- [ ] Integration tests for pipeline
- [ ] E2E tests with mock AI
- [ ] Performance optimization
- [ ] Error recovery mechanisms

## Part 5: Key Architecture Decisions

### Why Vercel AI SDK Over LangChain
1. **Native Next.js integration** - Built for React/Next.js
2. **Streaming support** - Better UX for chat interfaces
3. **Type safety** - Full TypeScript with Zod validation
4. **Simpler abstraction** - Less complexity than LangChain agents

### Why Tools as Objects, Not Prompts
1. **Type safety** - Compile-time validation
2. **Maintainability** - Tools are code, not strings
3. **Testing** - Can unit test execute functions
4. **Native AI support** - Modern models understand tool schemas

### Why Dynamic Context Over Static
1. **Accuracy** - Always reflects current database state
2. **Scalability** - Context grows with content
3. **Flexibility** - Easy to add new context sources
4. **Performance** - Load only what's needed

## Part 6: Common Pitfalls to Avoid

### ❌ Don't Do This
1. **Static tool descriptions** in system prompts
2. **Hardcoded context** that gets stale
3. **Missing validation** in tool execute functions
4. **Synchronous tool execution** that blocks UI
5. **No error handling** in tool implementations
6. **Ignoring business rules** based on website type

### ✅ Do This Instead
1. **Structured tool objects** with schemas
2. **Dynamic context loading** from database
3. **Zod validation** in all tools
4. **Async execution** with streaming
5. **Try-catch with meaningful errors**
6. **Category-aware validation rules**

## Conclusion

This architecture provides a modern, scalable approach to AI-powered content management that:

1. **Uses industry best practices** from bolt.diy, Cursor, and Copilot
2. **Leverages native AI capabilities** through Vercel AI SDK
3. **Maintains type safety** with TypeScript and Zod
4. **Provides business context awareness** for intelligent decisions
5. **Supports comprehensive testing** at all levels
6. **Scales with your application** needs

The key insight: **Tools are code, not descriptions**. Modern AI models understand structured tool definitions natively through SDKs, making the system more robust, maintainable, and testable than prompt-based approaches.

---

*Report Version: 2.0*  
*Last Updated: December 2024*  
*Status: Implementation Ready*