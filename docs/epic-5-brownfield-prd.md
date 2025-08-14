# Epic 5: AI-Powered Content Management Tool Integration - Brownfield PRD

## Executive Summary

**CRITICAL UPDATE**: After thorough POC analysis and codebase review, the scope of this epic has been significantly reduced. The infrastructure for AI tool calling is **already 80% complete**. What was estimated as a 4-week project is actually a 1-week enhancement.

### Key Discoveries
- ✅ **OpenRouter is already integrated** and working in production
- ✅ **Vercel AI SDK's streamText already supports tools** parameter
- ✅ **POC proves the exact pattern works** with current stack
- ✅ **Same AI model (claude-3.5-sonnet)** proven to work with tools
- ✅ **All dependencies are installed** and configured

**Actual Work Required**: Define 10 business domain tools and add them to the existing chat route. That's it.

---

## Problem Statement

### Current State
The existing Catalyst Studio has a working AI chat interface that:
- Successfully processes messages through OpenRouter
- Uses Vercel AI SDK's streamText for responses
- Provides content management advice (read-only)
- Cannot execute database operations

### Desired State
Enhance the existing chat to:
- Execute database operations through tools
- Maintain advisory mode as fallback
- Complete actions in <2 seconds
- Provide streaming feedback

### The Gap
**Previously Thought**: Need to build complete tool infrastructure
**Actually**: Just need to add `tools` parameter to existing streamText call

---

## Solution Overview

### Minimal Enhancement Approach

#### What We're NOT Doing
- ❌ Building new infrastructure
- ❌ Creating new API endpoints
- ❌ Modifying database schema
- ❌ Changing existing services
- ❌ Rebuilding chat interface

#### What We ARE Doing
- ✅ Adding tool definitions using existing patterns
- ✅ Adding tools parameter to streamText call (1 line)
- ✅ Creating context provider for website data
- ✅ Adding error handling and retry logic
- ✅ Testing with existing services

### Implementation Pattern (From POC)
```javascript
// POC proven pattern at proof-of-concept/test-ai-tools.js
const tool = tool({
  description: 'Tool description',
  parameters: z.object({ /* Zod schema */ }),
  execute: async (params) => { /* Direct DB access */ }
});

// Just add to existing streamText call
const result = streamText({
  model,  // EXISTING
  messages,  // EXISTING
  tools: { tool1, tool2, ... },  // NEW - Just add this
  maxSteps: 5  // NEW - Enable multi-step
});
```

---

## Requirements

### Functional Requirements

#### Story 5.1: Foundation (2 days)
**Previous Estimate**: 1 week
**Actual Work**:
1. Create `/lib/ai-tools/` directory
2. Copy POC pattern and adapt for websites
3. Add tools parameter to chat route
4. Test with simple tools

#### Story 5.2: Website Tools (1 day)
**Previous Estimate**: 3 days
**Actual Work**:
1. Define 3 website tools using POC pattern
2. Implement business rules
3. Test with WebsiteService

#### Story 5.3-5.4: Content Tools (2 days)
**Previous Estimate**: 1 week
**Actual Work**:
1. Define 7 content tools
2. Test with existing services

#### Story 5.5: Polish (1 day)
**Previous Estimate**: 3 days
**Actual Work**:
1. Add retry logic
2. Performance optimization
3. Integration testing

### Non-Functional Requirements

#### Performance
- Context loading: <500ms (achievable - just DB queries)
- Tool execution: <2s (proven in POC)
- No degradation of existing chat

#### Reliability
- Graceful fallback to advisory mode
- Transaction rollback on failures
- Retry with exponential backoff

---

## Technical Specification

### Architecture Changes

#### Before
```
Chat UI → /api/chat → streamText → AI Response
```

#### After
```
Chat UI → /api/chat → streamText (+ tools) → AI Response
                              ↓
                         Tool Execution
                              ↓
                         Database Operations
```

### Code Changes Required

#### 1. Chat Route Enhancement (5 lines)
```typescript
// /app/api/chat/route.ts
import { allTools } from '@/lib/ai-tools';  // NEW LINE 1

const result = streamText({
  model,
  messages,
  tools: allTools,      // NEW LINE 2
  maxSteps: 5,          // NEW LINE 3
  onStepFinish: log     // NEW LINE 4
});
```

#### 2. Tool Definitions (New Files)
```typescript
// /lib/ai-tools/website/get-website-context.ts
export const getWebsiteContextTool = tool({
  description: 'Get website metadata',
  parameters: z.object({ websiteId: z.string() }),
  execute: async ({ websiteId }) => {
    return await prisma.website.findUnique({ where: { id: websiteId } });
  }
});
```

### Testing Strategy

#### Unit Tests
- Test each tool in isolation
- Mock Prisma operations
- Verify Zod schemas

#### Integration Tests
- Test tool execution through chat
- Verify database operations
- Test rollback scenarios

#### Performance Tests
- Measure context loading time
- Measure tool execution time
- Test with large datasets

---

## Project Timeline

### Original Estimate: 4 Weeks
### Revised Estimate: 1 Week

#### Day 1-2: Foundation
- Set up tool directory structure
- Implement first 3 tools
- Test with chat integration

#### Day 3-4: Remaining Tools
- Implement remaining 7 tools
- Add business rules
- Integration testing

#### Day 5: Polish & Deploy
- Add error handling
- Performance optimization
- Documentation
- Deployment

---

## Risk Analysis

### Risks Mitigated by POC Analysis

1. **Technical Feasibility** ✅ RESOLVED
   - POC proves 100% success rate
   - Same stack already working

2. **Integration Complexity** ✅ RESOLVED
   - streamText already supports tools
   - No infrastructure changes needed

3. **Performance Concerns** ✅ RESOLVED
   - POC shows <2s execution
   - Simple parameter addition

### Remaining Risks

1. **Business Logic Complexity** (Low)
   - Mitigation: Start with simple tools, iterate

2. **Database Transaction Management** (Medium)
   - Mitigation: Use Prisma's built-in transactions

---

## Success Metrics

### Technical Success
- [ ] All 10 tools implemented
- [ ] <500ms context loading
- [ ] <2s tool execution
- [ ] Zero breaking changes

### Business Success
- [ ] Users can modify content via chat
- [ ] Reduced manual operations by 80%
- [ ] Maintain advisory mode compatibility

---

## Cost-Benefit Analysis

### Original Projection
- **Cost**: 4 weeks × $10,000/week = $40,000
- **Benefit**: Automated content management
- **ROI**: 6 months

### Revised Projection
- **Cost**: 1 week × $10,000/week = $10,000
- **Benefit**: Same as original
- **ROI**: 1.5 months

**75% cost reduction with same benefits**

---

## User Experience

### Chat Interface (No Changes)
- Existing chat UI remains unchanged
- Same message input/output format
- Streaming responses continue working

### New Capabilities
- Natural language commands execute actions
- Real-time feedback during operations
- Clear success/failure messages

### Example Interactions
```
User: "Create a blog post content type with title, body, and tags"
AI: [Creates content type] ✓ Created content type 'BlogPost' with 3 fields

User: "List all content types for this website"
AI: [Lists types] Found 5 content types: BlogPost, Page, Product...
```

---

## Acceptance Criteria

### Story 5.1
- [ ] Tools directory created
- [ ] First tool working with chat
- [ ] Context provider implemented
- [ ] Performance <500ms

### Story 5.2
- [ ] 3 website tools implemented
- [ ] Business rules working
- [ ] Integration with WebsiteService

### Story 5.3-5.4
- [ ] 7 content tools implemented
- [ ] All CRUD operations working
- [ ] Error handling complete

### Story 5.5
- [ ] Retry logic implemented
- [ ] All tests passing
- [ ] Documentation complete

---

## Documentation Requirements

### Developer Documentation
- Tool implementation guide
- POC pattern reference
- Testing procedures

### User Documentation
- Available commands list
- Example interactions
- Troubleshooting guide

---

## Deployment Strategy

### Environment Variables
```env
OPENROUTER_API_KEY=xxx  # Already configured
ENABLE_AI_TOOLS=true    # Feature flag
```

### Rollout Plan
1. Deploy to staging with feature flag off
2. Test with internal team
3. Enable feature flag
4. Monitor performance
5. Deploy to production

---

## Conclusion

The Epic 5 enhancement is significantly simpler than originally scoped. The existing infrastructure already supports AI tool calling - we just need to use it. The POC at `proof-of-concept/test-ai-tools.js` provides a working template that uses the exact same technology stack already in production.

**Recommendation**: Proceed immediately with implementation using the POC pattern. This is a low-risk, high-reward enhancement that can be completed in 1 week instead of 4.

---

## Appendix A: POC Validation Results

The proof-of-concept (`test-ai-tools.js`) demonstrated:
- **100% test success rate** (6/6 tests passed)
- **Working with current stack** (OpenRouter + Vercel AI SDK)
- **Multi-step operations** working correctly
- **Pattern directly applicable** to production code

Key insight: The POC uses `generateText` while production uses `streamText`, but both support the same `tools` parameter.

---

## Appendix B: Existing Infrastructure Assessment

### Already Working
- OpenRouter integration (`@openrouter/ai-sdk-provider`: 0.0.5)
- Vercel AI SDK (`ai`: 4.3.19)
- Claude 3.5 Sonnet model configuration
- Environment variables (OPENROUTER_API_KEY)
- Streaming responses
- Chat UI components

### Needs Addition
- Tool definitions (10 files)
- Context provider (1 file)
- Tools parameter in chat route (1 line)
- Error handling improvements

---

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-13 | 1.0 | Initial brownfield PRD for Epic 5 | Product Owner |
| 2025-01-14 | 2.0 | Complete rewrite based on POC analysis showing 80% infrastructure exists | Winston (Architect) |

---

*End of Brownfield PRD for Epic 5*