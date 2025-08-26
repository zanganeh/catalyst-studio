# Epic 11: AI-Powered Website Import System - Implementation Plan

> **PREMIUM FEATURE** - All code under `/lib/premium/`

## Epic Overview

### Vision
Enable users to import any existing website and automatically rebuild it in our CMS using AI-powered component detection and content mapping.

### Business Value
- **Reduce onboarding friction** from weeks to hours
- **Competitive advantage** with AI-powered import
- **Premium feature** driving subscription revenue
- **Network effects** as imported sites attract more users

## ⚠️ Critical Reality Check

Based on POC analysis, we need to adjust expectations:
- **AI costs**: Likely $2-5 per site (not $0.40 initially estimated)
- **Accuracy**: 40-60% for full content (not 80% target)
- **Complexity**: Playwright adds too much complexity for MVP
- **Legal risks**: Copyright and content ownership issues

## Recommended Approach: Structure Import (Not Full Content)

### What We Import
```typescript
const importScope = {
  // YES - Import these
  siteStructure: true,      // Page hierarchy and navigation
  componentPatterns: true,   // Detected UI patterns
  designTokens: true,       // Colors, fonts, spacing
  pageTemplates: true,      // Layout structures
  
  // NO - Don't import these (MVP)
  actualContent: false,     // Legal/quality issues
  images: false,           // Copyright concerns
  specificText: false      // Let users add their own
};
```

## User Stories

### Story 11.1: Import URL Entry & Site Analysis
**As a** user  
**I want to** enter a website URL  
**So that** I can import its structure into the CMS

**Acceptance Criteria:**
- [ ] URL input with validation
- [ ] Site crawling to discover pages
- [ ] Site type detection (SPA vs static)
- [ ] Import cost & time estimation
- [ ] Preview of discovered structure

### Story 11.2: Structure Detection Pipeline
**As a** system  
**I want to** detect site structure efficiently  
**So that** I can recreate the hierarchy

**Acceptance Criteria:**
- [ ] Sitemap extraction or crawling
- [ ] Page hierarchy detection
- [ ] Navigation structure mapping
- [ ] Component pattern identification
- [ ] Design system extraction

### Story 11.3: Template Generation
**As a** system  
**I want to** generate templates from detected patterns  
**So that** users have a starting point

**Acceptance Criteria:**
- [ ] Component template creation
- [ ] Layout structure preservation
- [ ] Design token extraction
- [ ] Placeholder content generation
- [ ] Template customization

### Story 11.4: Review & Customization
**As a** user  
**I want to** review and customize imported structure  
**So that** I can adapt it to my needs

**Acceptance Criteria:**
- [ ] Structure preview interface
- [ ] Template selection and editing
- [ ] Component mapping review
- [ ] Manual adjustments
- [ ] Bulk approval workflow

## POC Test Plan (MUST DO FIRST)

### 3-Day Validation Sprint

#### Day 1: Scraping Service Evaluation
```javascript
// Test these services with 3 sample sites
const services = [
  { name: 'Firecrawl', cost: '$0.003/page' },
  { name: 'ScrapingBee', cost: '$0.001/page' },
  { name: 'Scrapfly', cost: '$0.0008/page' }
];

// Test sites
const testSites = [
  'https://www.solidjs.com',      // Simple static
  'https://stripe.com/pricing',   // Business site
  'https://overreacted.io'        // Blog
];
```

#### Day 2: Structure Detection Test
```javascript
// Test structure detection (no AI needed)
function detectStructure(html) {
  return {
    navigation: extractNavPattern(html),
    heroSection: detectHeroPattern(html),
    contentLayout: detectLayoutPattern(html),
    footer: extractFooterPattern(html)
  };
}
```

#### Day 3: Template Generation Test
```javascript
// Generate templates from patterns
function generateTemplate(patterns) {
  return {
    layout: mapToLayoutTemplate(patterns),
    components: mapToComponentTemplates(patterns),
    designTokens: extractDesignTokens(patterns)
  };
}
```

### Success Criteria for POC
- Structure detection >70% accuracy
- Cost <$0.50 per site
- Processing time <1 minute
- User value validation (5 test users)

## Technical Implementation

### Simplified Architecture (No Playwright for MVP)

```typescript
// Scraping Service (choose based on POC)
class ScrapingService {
  async scrapeStructure(url: string) {
    // Use ScrapingBee or Firecrawl
    const pages = await this.discoverPages(url);
    const structure = await this.extractStructure(pages);
    return structure;
  }
}

// Pattern Detection (Rule-based, minimal AI)
class PatternDetector {
  detectPatterns(html: string) {
    return {
      hasHero: this.detectHero(html),
      hasCards: this.detectCards(html),
      columnLayout: this.detectColumns(html),
      navigation: this.detectNavStyle(html)
    };
  }
}

// Template Generator
class TemplateGenerator {
  generateFromPatterns(patterns: Patterns) {
    return {
      pages: this.createPageTemplates(patterns),
      components: this.createComponentTemplates(patterns),
      styles: this.createStyleTemplate(patterns)
    };
  }
}
```

### Database Schema (Simplified)

```sql
-- Import jobs (simplified)
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id),
  source_url TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  structure_data JSONB,
  template_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Imported templates
CREATE TABLE imported_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID REFERENCES import_jobs(id),
  template_type VARCHAR(50),
  template_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Cost Analysis (Realistic)

```typescript
const realisticCosts = {
  structureOnly: {
    small: '$0.20 - $0.50',    // 10 pages
    medium: '$0.50 - $1.00',   // 50 pages
    large: '$1.00 - $2.00'     // 100+ pages
  },
  withAI: {
    small: '$1.50 - $3.00',
    medium: '$5.00 - $10.00',
    large: '$10.00 - $20.00'
  }
};
```

## Implementation Timeline

### Week 1: POC & Validation
- Run scraping service tests
- Test structure detection
- Validate with users
- Go/No-go decision

### Week 2-3: Core Structure Import
- Implement chosen scraping service
- Build pattern detection
- Create template generator
- Basic UI

### Week 4-5: Enhancement & Polish
- Add design token extraction
- Improve pattern detection
- Build review interface
- Error handling

### Week 6: Testing & Launch
- User testing
- Performance optimization
- Documentation
- Beta launch

## Risk Mitigation

### If POC Fails
**Pivot to "Template Inspiration" Feature:**
- User provides URL for inspiration
- System suggests similar templates from library
- No actual import, just template matching
- Much simpler, no legal issues

### If Costs Too High
**Limit Scope:**
- Import structure only (no AI)
- Maximum 20 pages per import
- Manual component mapping
- Focus on value over automation

## Success Metrics

### MVP Success Criteria
- Import success rate >70%
- Cost per import <$1
- User satisfaction >3.5/5
- Time saved >2 hours per site
- Support tickets <10%

### Go/No-Go Decision Matrix
| Metric | Go | No-Go |
|--------|-----|--------|
| Structure detection | >70% | <50% |
| Cost per site | <$1 | >$2 |
| Processing time | <2 min | >5 min |
| User interest | >60% | <40% |

---

*This plan reflects realistic expectations and provides a clear path to validation before full implementation.*