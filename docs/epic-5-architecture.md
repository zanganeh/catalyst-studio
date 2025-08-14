# Epic 5: AI-Powered Content Management Tool Integration - Brownfield Enhancement Architecture

## Executive Summary

This architecture document reflects critical findings from POC analysis showing that **80% of the required infrastructure already exists**. The existing OpenRouter integration and Vercel AI SDK's `streamText` function already support tool calling - we just need to add tool definitions.

### 🚨 Critical Architecture Findings

**INFRASTRUCTURE IS MOSTLY IN PLACE:**
- ✅ OpenRouter is ALREADY integrated and working in `/app/api/chat/route.ts`
- ✅ The `streamText` function ALREADY supports the `tools` parameter
- ✅ The same model (claude-3.5-sonnet) is proven to work with tools in POC
- ✅ Environment variables and authentication are already configured
- ✅ POC at `proof-of-concept/test-ai-tools.js` proves the exact pattern works

**Tools are NOT API endpoints - they are server-side functions:**
- Tools are JavaScript/TypeScript objects passed directly to the AI model
- Tools execute on the server with direct database access via Prisma
- The ONLY public endpoint is the enhanced `/api/chat` route
- Client never sees or calls tools directly - only sends chat messages

### Actual Work Required

Instead of building infrastructure, we need to:
1. **Define business domain tools** (website, content-type, content-item operations)
2. **Add tools parameter** to existing streamText call
3. **Implement context provider** for loading website data
4. **Add error handling** and retry logic
5. **Test the integration** with existing services

**Estimated effort reduction: From 4 weeks to 1 week**

---

## Existing Infrastructure Analysis

### What's Already Working

#### OpenRouter Integration
```typescript
// Current working implementation in /app/api/chat/route.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || ''
});

const model = openrouter('anthropic/claude-3.5-sonnet');

const result = streamText({
  model,
  messages,
  // Just needs: tools, maxSteps, onStepFinish parameters added
});
```

#### POC Validation
The POC at `proof-of-concept/test-ai-tools.js` demonstrates:
- Tool definition using `tool()` function from Vercel AI SDK
- Zod schema validation working perfectly
- Multi-step operations with `maxSteps` parameter
- Both `generateText` and `streamText` support tools
- 100% success rate with 6 automated tests

### What Needs to Be Added

#### 1. Tool Definitions (NEW)
```typescript
// /lib/ai-tools/website/update-website.ts
import { tool } from 'ai';
import { z } from 'zod';

export const updateWebsiteTool = tool({
  description: 'Update website metadata and settings',
  parameters: z.object({
    websiteId: z.string(),
    metadata: z.record(z.any())
  }),
  execute: async ({ websiteId, metadata }) => {
    // Direct database access via existing Prisma client
    const website = await prisma.website.update({
      where: { id: websiteId },
      data: { metadata: JSON.stringify(metadata) }
    });
    return { success: true, data: website };
  }
});
```

#### 2. Enhanced Chat Route (MINIMAL CHANGES)
```typescript
// /app/api/chat/route.ts - Just add these lines to existing code
import { allTools } from '@/lib/ai-tools';  // NEW
import { loadWebsiteContext } from '@/lib/ai-tools/context-provider';  // NEW

export async function POST(request: Request) {
  const { messages, websiteId } = await request.json();
  
  // NEW: Optional context loading
  const context = websiteId ? await loadWebsiteContext(websiteId) : null;
  
  const result = streamText({
    model,  // EXISTING
    messages,  // EXISTING
    system: context ? generateSystemPrompt(context) : undefined,  // NEW
    tools: allTools,  // NEW: Just add this parameter
    maxSteps: 5,  // NEW: Enable multi-step (proven in POC)
    onStepFinish: (step) => console.log('Tool executed:', step)  // NEW: Optional
  });
  
  return result.toDataStreamResponse();  // EXISTING
}
```

---

## Implementation Strategy

### Phase 1: Foundation (Story 5.1) - 2 Days
1. Create `/lib/ai-tools/` directory structure
2. Copy POC pattern and adapt for business domain
3. Add tools parameter to existing chat route
4. Test with simple read-only tools first

### Phase 2: Website Tools (Story 5.2) - 1 Day
1. Implement 3 website management tools
2. Add business rule engine
3. Test with existing WebsiteService

### Phase 3: Content Tools (Stories 5.3-5.4) - 2 Days
1. Implement content type tools (4 tools)
2. Implement content item tools (3 tools)
3. Test with existing services

### Phase 4: Polish (Story 5.5) - 1 Day
1. Add retry logic and error handling
2. Performance optimization
3. Integration testing

---

## Technical Architecture

### Component Diagram
```mermaid
graph TD
    A[Chat UI - EXISTING] -->|messages| B[/api/chat - EXISTING]
    B -->|+ tools param| C[streamText - EXISTING]
    C -->|tool calling| D[AI Tools - NEW]
    D -->|direct access| E[Prisma - EXISTING]
    E -->|queries| F[SQLite - EXISTING]
    D -->|uses| G[Services - EXISTING]
```

### File Structure
```
catalyst-studio/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts  # EXISTING - Just add tools parameter
├── lib/
│   ├── services/  # EXISTING - No changes needed
│   └── ai-tools/  # NEW - Tool definitions only
│       ├── index.ts
│       ├── context-provider.ts
│       ├── website/
│       │   ├── get-website-context.ts
│       │   ├── update-business-requirements.ts
│       │   └── validate-content.ts
│       ├── content-types/
│       │   ├── list-content-types.ts
│       │   ├── get-content-type.ts
│       │   ├── create-content-type.ts
│       │   └── update-content-type.ts
│       └── content-items/
│           ├── list-content-items.ts
│           ├── create-content-item.ts
│           └── update-content-item.ts
```

---

## Component Architecture

### New Components

#### AI Tool Definitions
**Responsibility:** Define tools using Vercel AI SDK pattern from POC
**Integration:** Direct use of existing services and Prisma client

**Key Pattern:**
```typescript
export const toolName = tool({
  description: 'What this tool does',
  parameters: z.object({ /* Zod schema */ }),
  execute: async (params) => {
    // Use existing services or direct Prisma
    return result;
  }
});
```

#### Context Provider
**Responsibility:** Load website context for AI operations
**Integration:** Uses existing WebsiteService and ContentTypeService

```typescript
export async function loadWebsiteContext(websiteId: string) {
  const [website, contentTypes, items] = await Promise.all([
    prisma.website.findUnique({ where: { id: websiteId } }),
    prisma.contentType.findMany({ where: { websiteId } }),
    prisma.contentItem.count({ where: { websiteId } })
  ]);
  
  return { website, contentTypes, statistics: { totalItems: items } };
}
```

#### Business Rule Engine
**Responsibility:** Apply category-specific validation
**Integration:** Simple validation functions, no complex infrastructure

---

## Tech Stack (No Changes Required)

### Existing Technology Stack In Use
| Category | Technology | Version | Status |
|----------|------------|---------|--------|
| Framework | Next.js | 15.4.5 | ✅ Already supports our needs |
| AI SDK | Vercel AI SDK | 4.3.19 | ✅ Has tool support built-in |
| AI Provider | OpenRouter | 0.0.5 | ✅ Already integrated |
| Validation | Zod | 3.25.76 | ✅ Perfect for tool schemas |
| Database | Prisma + SQLite | 6.13.0 | ✅ Direct access available |

**No new dependencies required** - Everything needed is already installed!

---

## Risk Mitigation

### Identified Risks
1. **Overengineering** - Trying to rebuild what already works
   - **Mitigation**: Use existing infrastructure, just add tools parameter
   
2. **Breaking existing chat** - Advisory mode stops working
   - **Mitigation**: Tools are optional, fallback to advisory when no tools match

3. **Performance impact** - Tool execution slows down chat
   - **Mitigation**: Context loading <500ms, tool execution <2s targets

---

## Success Criteria

1. **Minimal Code Changes**
   - Existing chat route modified with <10 lines of code
   - No changes to existing services
   - No database schema changes

2. **Tool Functionality**
   - All 10 tools working with database operations
   - Multi-step operations successful
   - Error handling and rollback working

3. **Performance**
   - Context loading <500ms
   - Tool execution <2 seconds
   - No degradation of existing chat

---

## Testing Strategy

### Unit Tests
- Test each tool in isolation
- Mock Prisma operations
- Use existing Jest configuration

### Integration Tests
- Test tool execution through chat endpoint
- Verify database operations
- Test with existing services

### Performance Tests
- Measure context loading (<500ms requirement)
- Measure tool execution (<2s requirement)

---

## Security Considerations

### Existing Security (Maintained)
- Environment variables for secrets
- No authentication in MVP phase
- Prisma parameterization prevents SQL injection

### New Security Measures
- Zod validation on all tool inputs
- Audit logging for tool executions
- Transaction rollback on failures

---

## Implementation Sequence

### Story 5.1: Foundation (2 days)
```typescript
// Day 1: Setup and first tool
- Create /lib/ai-tools/ structure
- Implement get-website-context tool
- Add tools to chat route

// Day 2: Context and testing
- Implement context provider
- Add error handling
- Test integration
```

### Story 5.2: Website Tools (1 day)
```typescript
// All in one day using POC pattern
- update-business-requirements tool
- validate-content tool
- Business rule engine
```

### Stories 5.3-5.4: Content Tools (2 days)
```typescript
// Day 1: Content Type tools
- list-content-types
- get-content-type
- create-content-type
- update-content-type

// Day 2: Content Item tools
- list-content-items
- create-content-item
- update-content-item
```

### Story 5.5: Polish (1 day)
```typescript
// Final touches
- Retry logic with exponential backoff
- Performance optimization
- Integration test suite
```

---

## Conclusion

The architecture is simpler than originally anticipated. The POC proves the pattern works, and the existing infrastructure supports it. Focus should be on:

1. **Adapting the POC pattern** - Not reinventing it
2. **Defining business tools** - Not building infrastructure
3. **Testing thoroughly** - The foundation is already solid

**Key Insight**: This is not an infrastructure project, it's a tool definition project. The heavy lifting is already done.

---

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-13 | 1.0 | Created brownfield architecture for Epic 5 | Winston (Architect) |
| 2025-01-14 | 2.0 | Corrected tool implementation - server functions not API endpoints | Winston (Architect) |
| 2025-01-14 | 3.0 | Complete rewrite based on POC analysis showing existing infrastructure | Winston (Architect) |

---

## Next Steps

### For Development Team

1. **Start with Story 5.1** - Set up tools directory and add first tool
2. **Use POC as template** - Copy pattern from `test-ai-tools.js`
3. **Test incrementally** - Verify each tool before adding next
4. **Don't over-engineer** - The infrastructure already works

### Key Files to Reference
- **POC Implementation**: `proof-of-concept/test-ai-tools.js`
- **Current Chat Route**: `app/api/chat/route.ts`
- **Existing Services**: `lib/services/*.ts`

---

*End of Epic 5 Brownfield Enhancement Architecture*