# Epic 5: AI-Powered Content Management Tool Integration - Brownfield Enhancement Architecture (UPDATED)

## Executive Summary

This updated architecture document reflects critical findings from POC analysis showing that **80% of the required infrastructure already exists**. The existing OpenRouter integration and Vercel AI SDK's `streamText` function already support tool calling - we just need to add tool definitions.

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

## Conclusion

The architecture is simpler than originally anticipated. The POC proves the pattern works, and the existing infrastructure supports it. Focus should be on:

1. **Adapting the POC pattern** - Not reinventing it
2. **Defining business tools** - Not building infrastructure
3. **Testing thoroughly** - The foundation is already solid

**Key Insight**: This is not a infrastructure project, it's a tool definition project. The heavy lifting is already done.

---

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-14 | 3.0 | Complete rewrite based on POC analysis and existing infrastructure assessment | Winston (Architect) |

---

*End of Updated Epic 5 Architecture*