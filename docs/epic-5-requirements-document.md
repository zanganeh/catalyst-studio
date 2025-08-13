# Epic-5: AI-Powered Content Management System Integration
## Requirements Document

### Document Information
- **Epic:** Epic-5
- **Version:** 1.0
- **Date:** January 2025
- **Status:** Ready for Implementation
- **Based on:** POC with 100% test validation

---

## Executive Summary

Transform Catalyst Studio's AI assistant from a passive advisor into an active content management system that directly creates and manages database content through structured tool execution. Users can describe what they need in natural language (e.g., "create a blog structure") and have it automatically executed with appropriate business rules and validation.

---

## Problem Statement

### Current State
The existing AI chat interface operates as a read-only advisor, requiring users to manually translate every AI suggestion into actual database operations. This creates a fragmented workflow where simple tasks require multiple manual steps across different interfaces.

### Impact
- Tasks that could take seconds require 5-10 minutes of manual work
- Manual translation of AI suggestions introduces human error
- Users avoid the AI assistant for complex tasks due to implementation overhead
- Context switching between AI chat and admin interfaces breaks workflow

### Why Now
- POC achieved 100% test success rate, proving technical feasibility
- Competitors rapidly adopting AI-powered content management
- Isolated POC demonstrates 4-week delivery timeline
- Industry research shows structured tool objects achieve 95%+ reliability vs 60-70% for text-based approaches

---

## Solution Overview

Implement AI tools as executable TypeScript functions using the Vercel AI SDK, where each tool directly manipulates the database through the existing Prisma ORM. The AI model receives these tools as structured code objects and dynamically loads current database context before each interaction.

### Key Components
- **Native tool execution** with 95%+ reliability
- **Business-aware context** automatically applying rules based on website type
- **Atomic operations** with automatic rollback on failure
- **Streaming responses** showing real-time progress
- **Category-specific intelligence** adding required fields automatically

---

## Target Users

### Primary: Content Managers
- Managing 10-50 content pieces weekly
- Spend 40% of time on repetitive content structure creation
- Need to quickly prototype content structures
- Want consistency across similar content types

### Secondary: Business Owners
- Limited technical expertise
- Managing their own website content
- Want self-service without developer dependency
- Need automatic application of industry best practices

---

## Success Metrics

### Business Objectives
- Reduce content setup time by 80% (15 min → 3 min)
- Achieve 95% first-attempt success rate
- Increase user engagement by 50% within 3 months
- Generate $10K additional MRR within 6 months

### Technical KPIs
- Tool execution speed < 2 seconds
- Context load time < 500ms
- Zero data corruption incidents
- < 5% operations require rollback

---

## MVP Scope

### Core Features (10 Tools)

#### Website Management (3 tools)
1. **get-website-context** - Load current website metadata and requirements
2. **update-business-requirements** - Modify website business rules
3. **validate-content** - Check content against requirements

#### Content Type Management (4 tools)
4. **list-content-types** - Retrieve all content types
5. **get-content-type** - Get specific type details
6. **create-content-type** - Create new type with fields
7. **update-content-type** - Modify existing type

#### Content Item Management (3 tools)
8. **list-content-items** - Retrieve content with filtering
9. **create-content-item** - Create new content
10. **update-content-item** - Modify existing content

### Core Capabilities
- Context provider system for dynamic data loading
- Business rule engine for category-specific validation
- Atomic transaction support with rollback
- Natural language interface
- Audit logging of all operations
- Streaming response UI
- Error recovery mechanisms

### Out of Scope for MVP
- Advanced mock data generation
- Bulk operations beyond basic creation
- Custom field types
- AI content writing
- Multi-language support
- Workflow automation

---

## Technical Architecture

### Technology Stack
- **Framework:** Existing Next.js 14 with React Server Components
- **AI SDK:** Vercel AI SDK (NOT LangChain)
- **AI Provider:** OpenRouter API
- **Validation:** Zod schemas
- **Database:** Existing Prisma ORM with PostgreSQL
- **Deployment:** Current Vercel infrastructure

### Implementation Structure
```
/app/api/ai-tools/
  ├── tools/
  │   ├── website/
  │   ├── content-types/
  │   └── content-items/
  ├── context/
  │   └── provider.ts
  ├── validation/
  │   └── schemas.ts
  └── lib/
      └── executor.ts
```

### Architecture Principles
- Stateless tool execution
- Context loaded per-request
- Tools co-located with API routes
- Parameter validation with Zod
- SQL injection prevention via Prisma
- Integration with existing auth system

---

## Business Rules

### Category-Specific Validation

| Website Type | Required Fields | Validation Rules |
|-------------|-----------------|------------------|
| Blog | Title, SEO description, Author, Date | Title ≤ 60 chars, Description 120-160 chars |
| E-commerce | SKU, Price, Inventory | Unique SKUs, Price > 0 |
| Portfolio | Project name, Client, Technologies | Valid completion date |

### Tool Execution Rules
- All operations wrapped in database transactions
- Automatic rollback on any failure
- Clear error messages for users
- Audit log for every operation
- Respect existing user permissions

---

## Implementation Plan

### Week 1: Foundation
- Set up OpenRouter API access
- Create tool directory structure
- Implement context provider
- Build first reference tool
- Create Zod schemas

### Week 2: Core Tools
- Implement remaining 9 tools
- Add business rule engine
- Integrate with Prisma
- Build streaming UI

### Week 3: Integration
- Connect to existing auth
- Add audit logging
- Implement error recovery
- Create rollback mechanisms

### Week 4: Testing & Polish
- Integration testing
- User acceptance testing
- Performance optimization
- Documentation

---

## Constraints & Dependencies

### Constraints
- $500/month API budget (~25,000 interactions)
- 4-week timeline
- Single developer resource
- Must work within existing Next.js architecture
- Cannot modify existing database schema

### Dependencies
- OpenRouter API availability
- Vercel AI SDK stability
- Existing Prisma models
- Current authentication system

### Assumptions
- POC patterns translate to production
- Users understand basic CMS concepts
- Current infrastructure handles load
- Vercel AI SDK tool calling remains stable

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucination | Medium | Strict Zod validation |
| Transaction conflicts | Low | Prisma isolation levels |
| User confusion | Medium | Example prompts & suggestions |
| Tool failures | Medium | Retry logic & clear errors |
| Data volume | Low | Operation limits (max 20 items) |

---

## Open Questions

1. Which AI model performs best for tool calling?
2. Should destructive operations require confirmation?
3. How to handle partial successes in multi-step operations?
4. Optimal context size without hitting token limits?
5. Should responses include explanations or just status?

---

## Next Steps

1. Review POC code in `/proof-of-concept/`
2. Set up OpenRouter API access
3. Create `/app/api/ai-tools/` structure
4. Define Zod schemas for 10 tools
5. Implement context provider
6. Build reference tool (list-content-types)
7. Create streaming UI component
8. Write integration tests
9. Implement remaining tools
10. Deploy to staging environment

---

## Success Criteria

MVP is successful when:
- User can say "create a blog structure" and have it execute in < 3 seconds
- All 10 tools execute with > 95% success rate
- Business rules correctly applied for 3 website categories
- Every operation can be rolled back
- System passes all 6 POC test scenarios

---

## References

- POC Location: `/proof-of-concept/`
- POC Test Results: 100% success rate (6/6 tests)
- Original Requirements: `docs/ai-tools-requirements-document.md`
- Vercel AI SDK Docs: https://sdk.vercel.ai/docs
- Industry patterns: Cursor, GitHub Copilot, bolt.diy

---

*End of Epic-5 Requirements Document*