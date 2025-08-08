# Catalyst Studio Documentation

Welcome to the Catalyst Studio documentation repository. This directory contains all technical documentation, specifications, and guides for the AI-powered website builder platform.

## 📚 Documentation Overview

### Core Documents

#### [Product Requirements Document (PRD)](./prd.md)
**Catalyst Studio Brownfield Enhancement PRD**  
Comprehensive requirements document outlining the MVP implementation strategy for transforming the existing prototype into a production-ready application. Includes functional requirements, non-functional requirements, compatibility requirements, and technical specifications for the three-column interface with AI chat capabilities.

#### [Project Brief](./project-brief.md)
**Executive Vision & Strategy**  
High-level strategic document defining Catalyst Studio's market positioning, target users, and core value proposition. Details the problem statement, proposed solution, and business model for the AI-powered website builder that bridges ideation to CMS deployment.

#### [Frontend Specification](./front-end-spec.md)
**UI/UX Specification Document**  
Complete design system and user experience guidelines including information architecture, user flows, wireframes, component library specifications, and the Catalyst X visual identity. Defines the three-column layout, glass morphism design, and interaction patterns.

#### [AI UI Generation Prompt](./ai-ui-generation-prompt.md)
**Master Prompt for AI-Driven Development**  
Optimized prompt template for use with AI frontend generation tools (v0, Lovable.ai, Cursor). Contains detailed instructions for generating the Catalyst Studio interface with exact specifications, component structures, and implementation guidelines.

#### [Architecture Document](./architecture.md)
**Brownfield Enhancement Architecture**  
Comprehensive technical architecture for the MVP implementation, defining component structure, integration strategies, and technology decisions. Details the preservation of existing chat functionality while building new features with shadcn/ui components and maintaining the Catalyst X visual identity.

## 🎯 Quick Start Guide

1. **New to the project?** Start with the [Project Brief](./project-brief.md) for strategic context
2. **Implementing features?** Reference the [PRD](./prd.md) for detailed requirements
3. **Building UI components?** Follow the [Frontend Specification](./front-end-spec.md)
4. **Understanding architecture?** Review the [Architecture Document](./architecture.md)
5. **Using AI tools?** Leverage the [AI Generation Prompt](./ai-ui-generation-prompt.md)

## 🏗️ Architecture Overview

```
Catalyst Studio
├── AI Chat Interface (Left Panel - 360px)
│   ├── OpenRouter Integration
│   ├── Vercel AI SDK v4
│   └── Conversational Website Building
├── Navigation Sidebar (Center - 260px)
│   ├── Content Management
│   ├── Analytics & Insights
│   └── Development Tools
└── Main Content Area (Right - Flexible)
    ├── Content Type Builder
    ├── Preview Frame
    └── Source Code Editor
```

## 🎨 Visual Identity

- **Primary Color**: #FF5500 (Catalyst Orange)
- **Typography**: Inter (200, 400, 500, 600, 700)
- **Design Language**: Glass morphism with 45-degree geometric patterns
- **Animation**: 200-300ms cubic-bezier transitions

## 🚀 Key Features

- **Natural Language to Website**: Transform text descriptions into complete prototypes
- **Visual Content Modeling**: Drag-and-drop field management with live preview
- **Multi-Device Preview**: Responsive testing across desktop, tablet, and mobile
- **CMS Integration Ready**: Built for deployment to Optimizely, Contentful, and Strapi
- **Zero Lock-in**: Complete ownership of generated code and content

## 📋 Documentation Standards

All documentation in this directory follows these principles:
- **User-Focused**: Written for developers, designers, and product managers
- **Action-Oriented**: Clear steps and implementation guidance
- **Version Controlled**: Change logs track all major updates
- **Cross-Referenced**: Documents link to related specifications

## 🔄 Version History

| Document | Version | Last Updated | Primary Author |
|----------|---------|--------------|----------------|
| PRD | 1.0 | 2025-01-08 | PM |
| Project Brief | 1.0 | 2025-01-08 | Product Team |
| Frontend Spec | 1.0 | 2025-01-08 | Sally (UX Expert) |
| AI Prompt | 1.0 | 2025-01-08 | Development Team |
| Architecture | 1.0 | 2025-01-08 | Winston (Architect) |

## 📝 Contributing

When updating documentation:
1. Maintain the existing structure and formatting
2. Update version numbers and change logs
3. Ensure cross-references remain valid
4. Test any code examples or prompts
5. Review for consistency with other documents

---

*For the latest updates and implementation status, check the main project repository.*