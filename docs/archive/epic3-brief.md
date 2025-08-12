# Project Brief: Catalyst Studio Multi-Website Support

## Executive Summary

Catalyst Studio Multi-Website Management Enhancement - A feature expansion that transforms the current single-website studio interface into a comprehensive multi-website management platform. This enhancement introduces a centralized dashboard for managing multiple websites, allowing users to create, access, and switch between different website projects seamlessly while maintaining the existing studio functionality for individual site management.

## Problem Statement

Currently, Catalyst Studio operates as a single-website management tool, limiting users to working with one website at a time. This creates significant workflow inefficiencies for users managing multiple web properties - they cannot easily switch between projects, compare configurations, or maintain a centralized view of all their websites. The absence of multi-website support means users must either run multiple instances of the studio or manually reconfigure the application for each website they want to manage. This limitation becomes increasingly problematic as users scale their operations, manage client websites, or oversee multiple brands. The current architecture's dependency on a single context without ID-based routing prevents natural growth and adoption by professional users and agencies who inherently work with multiple websites.

## Proposed Solution

Implement a two-tier architecture with a new dashboard layer that serves as the entry point for website management. The dashboard will display all available websites in a card-based grid layout (similar to the provided screenshot reference), allowing users to create new websites or select existing ones. Each website selection will route to the current studio interface at `/studio/{id}`, where the ID parameter enables loading of website-specific configurations and data from browser storage. The existing studio functionality remains intact but becomes context-aware through ID-based routing. This approach preserves all current studio features while adding multi-website capabilities through a minimal, elegant architectural extension that leverages the existing codebase.

## Target Users

### Primary User Segment: Web Development Professionals

Professional web developers and designers managing multiple client websites or personal projects. These users typically work with 5-20 active websites, switching between them frequently throughout their workday. They need quick access to different projects, clear visual organization of their website portfolio, and seamless context switching without losing work state. Their workflow involves frequent updates, deployments, and configuration changes across multiple sites. They value efficiency, visual clarity, and the ability to maintain a bird's-eye view of all their projects while diving deep into individual site management when needed.

### Secondary User Segment: Digital Agencies and Teams

Small to medium digital agencies and development teams collaborating on multiple client websites. These users manage 20-100+ websites with varying levels of activity, requiring robust organization, potential access controls, and efficient navigation. They need to quickly onboard new projects, archive completed ones, and potentially share access across team members. Their workflow emphasizes project organization, client separation, and the ability to standardize processes across multiple websites while maintaining individual site customization.

## Goals & Success Metrics

### Business Objectives
- Enable management of multiple websites within a single Catalyst Studio instance, supporting 10+ websites per user within 3 months of launch
- Reduce context-switching time by 75% when moving between different website projects
- Increase user retention by 40% through improved workflow efficiency for multi-site users
- Support 90% of existing studio features without modification when accessed via ID-based routing

### User Success Metrics
- Time to switch between websites reduced from current workflow to under 3 seconds
- Users can create a new website project in under 30 seconds
- 95% of users successfully navigate between dashboard and studio without confusion
- Zero data loss when switching between website contexts

### Key Performance Indicators (KPIs)
- **Average Websites Per User**: Track adoption of multi-site capability, target 3+ sites per active user
- **Dashboard Load Time**: Page load under 1 second with 20 websites displayed
- **Context Switch Success Rate**: 99%+ successful loads when navigating to studio with website ID
- **New Website Creation Rate**: 2+ new websites created per user per month indicating active usage

## MVP Scope

### Core Features (Must Have)
- **AI-Powered Dashboard:** Landing page with "What would you build today?" prompt interface for describing website ideas
- **Website Creation via Prompt:** Text input where users describe their website concept, which then creates a new website project
- **Quick Category Tags:** Clickable suggestion tags (CRM, Dev productivity, Educational, etc.) for common website types
- **Recent Apps Display:** Grid/list view showing previously created websites with name, icon, and brief description
- **Prompt-to-Studio Flow:** After prompt submission, automatically create website and navigate to `/studio/{id}/ai` panel
- **AI Panel Integration:** Ensure the studio's AI panel receives and processes the initial prompt to begin website generation
- **Local Database:** Store website metadata, initial prompts, and creation history in browser storage

### Out of Scope for MVP
- Website templates library (beyond category suggestions)
- Manual website creation without AI prompt
- Bulk operations on multiple websites
- Website archiving or soft-delete capabilities
- Advanced search and filtering
- Team collaboration features
- Import/export of configurations
- Styling instructions expansion (keep it simple initially)
- Website analytics or detailed metrics
- Server-side database (future migration not part of this task)

### MVP Success Criteria
The MVP is successful when a user can: (1) Land on a clean dashboard with a prominent "What would you build today?" prompt, (2) Describe their website idea in natural language or select a category tag, (3) Submit the prompt which creates a new website entry and immediately routes to `/studio/{id}/ai`, (4) Have the AI panel receive and begin processing their website concept, (5) Return to dashboard to see their new website in "Recent Apps" and access it again later, and (6) Click any recent app to re-enter its studio context.

## Post-MVP Vision

### Phase 2 Features
Enhanced AI capabilities including prompt refinement suggestions, multi-step website generation workflows, and template library based on successful creations. Add website cloning and variation generation ("Create similar website but for [different industry]"). Implement smart categorization that learns from user patterns and suggests relevant features based on website type. Include collaborative features allowing team members to contribute to the same website project with role-based access. Add website comparison tools to analyze differences between similar projects and apply successful patterns across websites.

### Long-term Vision
Transform Catalyst Studio into an AI-first website development platform where natural language becomes the primary interface for website creation and modification. Build a marketplace of AI-generated components and patterns that users can share and monetize. Develop intelligent website optimization that continuously improves sites based on usage patterns and performance metrics. Create an ecosystem where the AI learns from all created websites to provide increasingly sophisticated suggestions and automatically implement industry best practices. Enable voice-driven development where users can describe changes verbally while viewing their website.

### Expansion Opportunities
Integration with external AI models for specialized content generation (copy, images, code). White-label solution for agencies to offer AI-powered website creation under their brand. API platform allowing third-party developers to build on top of the AI website generation engine. Mobile companion app for website management and quick edits on the go. Enterprise features including compliance checking, accessibility validation, and automated testing based on website purpose. Global template marketplace where successful website patterns can be packaged and sold to other users.

## Technical Considerations

### Platform Requirements
- **Target Platforms:** Web-based application accessible via modern browsers (Chrome, Firefox, Safari, Edge)
- **Browser/OS Support:** Support for latest two versions of major browsers, responsive design for desktop (primary) and tablet (secondary) viewports
- **Performance Requirements:** Dashboard load under 1.5 seconds, prompt submission to studio redirect under 3 seconds, support 100+ websites in dashboard without performance degradation

### Technology Preferences
- **Frontend:** Maintain existing studio tech stack (likely React/Next.js based on localhost:3001), consistent UI component library between dashboard and studio
- **Backend:** Local Node.js server with API endpoints for website CRUD operations, integrate with existing studio backend architecture
- **Database:** Browser-based storage (IndexedDB or localStorage) matching existing studio's storage approach - server migration is not part of this project
- **Hosting/Infrastructure:** Local development environment, maintaining current deployment approach

### Architecture Considerations
- **Repository Structure:** Add `/dashboard` route at same level as `/studio`, shared components library for consistent UI, maintain existing studio structure with ID parameterization
- **Service Architecture:** Separate service for AI prompt processing that can be called from both dashboard and studio, maintain consistency with existing browser storage patterns
- **Integration Requirements:** Studio must accept website ID parameter and load appropriate context from browser storage, AI panel must receive initial prompt through props or context, dashboard must use same browser storage API as studio for consistency
- **Security/Compliance:** Ensure website data isolation between different IDs in browser storage, validate all ID parameters to prevent injection, maintain existing security patterns

## Constraints & Assumptions

### Constraints
- **Budget:** Development within existing team resources, no additional third-party services or paid APIs required
- **Timeline:** MVP delivery expected within current development sprint cycle
- **Resources:** Single development team maintaining both dashboard and studio, reusing existing codebase and patterns
- **Technical:** Browser storage limitations (typically 5-10MB for localStorage, 50MB+ for IndexedDB), must maintain compatibility with existing studio architecture, no server-side database changes in this phase

### Key Assumptions
- The existing studio at `/studio` can be parameterized with an ID without major refactoring
- Browser-based storage is sufficient for storing website metadata and configurations for typical usage (10-50 websites)
- The studio already has a functional AI panel that can receive and process prompts programmatically
- Users will primarily create websites through AI prompts rather than manual configuration
- The existing authentication and session management (if any) can be extended to support multiple websites
- Current studio features will continue to work when accessed with a website ID parameter
- The prompt-to-website generation flow is the primary value proposition for users

## Risks & Open Questions

### Key Risks
- **Browser Storage Limits:** IndexedDB/localStorage may hit capacity with extensive website data, causing data loss or preventing new website creation
- **ID Parameter Refactoring:** Existing studio may require deeper changes than anticipated to properly support ID-based routing and context switching
- **AI Panel Integration:** The studio's AI panel may not be designed to receive external prompts, requiring additional development
- **Performance Degradation:** Loading multiple websites in dashboard cards could slow down initial page load if not properly optimized
- **Data Migration Complexity:** When eventually moving to server storage (future), migrating browser-stored data could be complex
- **User Confusion:** Switching from single to multi-website paradigm might confuse existing users without proper onboarding

### Open Questions
- What is the current structure of the studio's browser storage and how easily can it be extended for multiple websites?
- Does the AI panel at `/studio/ai` already exist and can it accept prompts programmatically?
- What should happen to the existing single-website data when multi-website support is introduced?
- Should there be a limit on the number of websites a user can create in the MVP?
- How should website thumbnails/icons be generated or selected for the dashboard display?
- What metadata should be stored for each website beyond name and creation date?

### Areas Needing Further Research
- Optimal browser storage strategy (IndexedDB vs localStorage) for website metadata
- Best practices for ID-based routing in the existing framework (Next.js or similar)
- AI prompt processing capabilities and integration points in current studio
- Performance benchmarks for loading multiple website cards in dashboard view

## Appendices

### A. Research Summary
*Not applicable for initial brief - no formal research conducted yet*

### B. Stakeholder Input
*To be gathered during project kickoff*

### C. References
- Base44 Dashboard Pattern: Screenshot reference showing prompt-first website creation interface
- Existing Studio URL: http://localhost:3001/studio
- Dashboard Concept: C:\Users\Admin\Pictures\Screenshots\Screenshot 2025-08-12 094809.png
- Base44 Creation Flow: C:\Users\Admin\Downloads\Screenshot 2025-08-12 at 10-04-02 Base44.png

## Next Steps

### Immediate Actions
1. Validate that the studio's AI panel exists and can receive prompts programmatically
2. Analyze current browser storage schema to plan multi-website extension
3. Create proof-of-concept for ID-based routing in studio (test with `/studio/test-id`)
4. Design browser storage schema for website metadata (id, name, prompt, created_at, updated_at)
5. Mock up dashboard UI based on Base44 pattern with "What would you build today?" prompt
6. Test browser storage limits with realistic website data to confirm capacity
7. Document existing studio routes and identify all places needing ID parameterization

### PM Handoff
This Project Brief provides the full context for Catalyst Studio Multi-Website Support. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.