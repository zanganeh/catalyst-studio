# Story 3.4: AI-Powered Website Creation

## Story Metadata
- **Epic**: Epic 3 - Multi-Website Support Enhancement
- **Story ID**: 3.4
- **Branch**: `feature/epic-3-story-3.4-ai-creation`
- **Estimated Points**: 8
- **Priority**: P0 (Core Feature - Required for Value Delivery)
- **Dependencies**: Story 3.1 (Storage), Story 3.2 (Routing), Story 3.3 (Dashboard) must be complete
- **Status**: Done

## User Story
As a **user**,  
I want **to create new websites by describing them in natural language**,  
so that **I can quickly start new projects without manual configuration**.

## Context from PRD
This story implements the revolutionary AI-first approach to website creation. Users can describe their website concept in natural language through the "What would you build today?" prompt, which intelligently creates a fully configured website entry. The prompt is then passed to the AI panel for immediate context-aware development. This transforms the traditionally complex website setup process into a single conversational interaction.

## Technical Requirements

### 1. AI Prompt Interface Component
**Location**: `components/dashboard/ai-prompt-section.tsx`

```typescript
interface AIPromptSectionProps {
  onWebsiteCreated: (websiteId: string) => void;
  isCreating: boolean;
}

export function AIPromptSection({ onWebsiteCreated, isCreating }: AIPromptSectionProps) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  return (
    <div className="ai-prompt-container">
      <h2 className="text-3xl font-bold mb-4">What would you build today?</h2>
      
      <div className="prompt-input-wrapper">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your website idea... (e.g., 'A CRM for small businesses with lead tracking and email automation')"
          className="w-full h-32 p-4 border rounded-lg resize-none"
          disabled={isProcessing}
        />
        
        <div className="flex justify-between items-center mt-4">
          <QuickCategoryTags onTagClick={handleTagClick} />
          <button
            onClick={handleCreate}
            disabled={!prompt.trim() || isProcessing}
            className="btn-primary"
          >
            {isProcessing ? <Spinner /> : 'Create Website'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Quick Category Tags Component
**Location**: `components/dashboard/quick-category-tags.tsx`

```typescript
interface CategoryTag {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType;
  color: string;
}

const CATEGORY_TAGS: CategoryTag[] = [
  {
    id: 'crm',
    label: 'CRM',
    prompt: 'A customer relationship management system with contact tracking, deal pipeline, and analytics',
    icon: UsersIcon,
    color: 'blue'
  },
  {
    id: 'dev-tools',
    label: 'Dev Productivity',
    prompt: 'A developer productivity tool with code snippets, project management, and collaboration features',
    icon: CodeIcon,
    color: 'purple'
  },
  {
    id: 'education',
    label: 'Educational',
    prompt: 'An educational platform with course management, student tracking, and interactive learning',
    icon: AcademicCapIcon,
    color: 'green'
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    prompt: 'An online store with product catalog, shopping cart, and payment processing',
    icon: ShoppingBagIcon,
    color: 'orange'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt: 'A professional portfolio website showcasing projects, skills, and contact information',
    icon: BriefcaseIcon,
    color: 'indigo'
  },
  {
    id: 'saas',
    label: 'SaaS Platform',
    prompt: 'A software-as-a-service platform with user authentication, subscription billing, and dashboard',
    icon: CloudIcon,
    color: 'cyan'
  }
];

export function QuickCategoryTags({ onTagClick }: { onTagClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_TAGS.map(tag => (
        <button
          key={tag.id}
          onClick={() => onTagClick(tag.prompt)}
          className={`tag-${tag.color} flex items-center gap-1 px-3 py-1 rounded-full`}
        >
          <tag.icon className="w-4 h-4" />
          <span>{tag.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### 3. AI Prompt Processing Service
**Location**: `lib/services/ai-prompt-processor.ts`

```typescript
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { generateUniqueId } from '@/lib/utils/id-generator';

interface ProcessedPrompt {
  websiteName: string;
  description: string;
  category: string;
  suggestedFeatures: string[];
  technicalRequirements: string[];
  targetAudience: string;
}

export class AIPromptProcessor {
  private storageService: WebsiteStorageService;
  
  constructor() {
    this.storageService = new WebsiteStorageService();
  }
  
  async processPrompt(userPrompt: string): Promise<ProcessedPrompt> {
    // Analyze prompt using AI or pattern matching
    const processed = await this.analyzePrompt(userPrompt);
    
    return {
      websiteName: processed.name || this.generateDefaultName(userPrompt),
      description: processed.description || userPrompt,
      category: this.detectCategory(userPrompt),
      suggestedFeatures: this.extractFeatures(userPrompt),
      technicalRequirements: this.extractTechnicalNeeds(userPrompt),
      targetAudience: this.identifyAudience(userPrompt)
    };
  }
  
  async createWebsiteFromPrompt(prompt: ProcessedPrompt): Promise<string> {
    const websiteId = generateUniqueId();
    
    const websiteData = {
      id: websiteId,
      name: prompt.websiteName,
      description: prompt.description,
      category: prompt.category,
      createdAt: new Date(),
      lastModified: new Date(),
      aiContext: {
        initialPrompt: prompt,
        suggestedFeatures: prompt.suggestedFeatures,
        technicalStack: this.suggestTechStack(prompt)
      },
      config: {
        theme: this.suggestTheme(prompt.category),
        features: prompt.suggestedFeatures,
        settings: {}
      }
    };
    
    await this.storageService.createWebsite(websiteData);
    return websiteId;
  }
  
  private analyzePrompt(prompt: string): Promise<any> {
    // AI analysis logic here
    // Can integrate with OpenAI/Anthropic for enhanced processing
  }
  
  private detectCategory(prompt: string): string {
    const categories = {
      crm: /crm|customer|relationship|sales|lead/i,
      ecommerce: /store|shop|ecommerce|product|cart/i,
      education: /course|learn|teach|student|education/i,
      portfolio: /portfolio|showcase|projects|work/i,
      saas: /saas|platform|subscription|dashboard/i,
      dev: /developer|code|programming|tools/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(prompt)) return category;
    }
    
    return 'general';
  }
  
  private extractFeatures(prompt: string): string[] {
    const features = [];
    
    // Feature detection patterns
    if (/auth|login|user/i.test(prompt)) features.push('authentication');
    if (/payment|billing|subscription/i.test(prompt)) features.push('payments');
    if (/email|notification/i.test(prompt)) features.push('notifications');
    if (/analytics|dashboard|metrics/i.test(prompt)) features.push('analytics');
    if (/api|integration/i.test(prompt)) features.push('api');
    if (/search/i.test(prompt)) features.push('search');
    if (/chat|message/i.test(prompt)) features.push('messaging');
    
    return features;
  }
  
  private generateDefaultName(prompt: string): string {
    // Extract potential name from prompt or generate one
    const words = prompt.split(' ').slice(0, 3);
    return words.join(' ').substring(0, 30);
  }
  
  private suggestTechStack(prompt: ProcessedPrompt): string[] {
    // Suggest appropriate tech stack based on requirements
    const stack = ['React', 'TypeScript', 'Tailwind CSS'];
    
    if (prompt.suggestedFeatures.includes('authentication')) {
      stack.push('NextAuth.js');
    }
    if (prompt.suggestedFeatures.includes('payments')) {
      stack.push('Stripe');
    }
    if (prompt.category === 'ecommerce') {
      stack.push('Commerce.js');
    }
    
    return stack;
  }
  
  private suggestTheme(category: string): any {
    // Return theme configuration based on category
    const themes = {
      crm: { primary: 'blue', style: 'professional' },
      ecommerce: { primary: 'green', style: 'modern' },
      education: { primary: 'purple', style: 'friendly' },
      portfolio: { primary: 'black', style: 'minimal' },
      saas: { primary: 'indigo', style: 'tech' }
    };
    
    return themes[category] || { primary: 'blue', style: 'default' };
  }
}
```

### 4. Navigation and Context Passing
**Location**: `components/dashboard/website-creator.tsx`

```typescript
import { useRouter } from 'next/navigation';
import { AIPromptProcessor } from '@/lib/services/ai-prompt-processor';
import { useToast } from '@/components/ui/use-toast';

export function WebsiteCreator() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const processor = new AIPromptProcessor();
  
  const handleWebsiteCreation = async (userPrompt: string) => {
    setIsCreating(true);
    
    try {
      // Process the prompt
      const processedPrompt = await processor.processPrompt(userPrompt);
      
      // Create website with processed data
      const websiteId = await processor.createWebsiteFromPrompt(processedPrompt);
      
      // Store prompt in session for AI panel
      sessionStorage.setItem(`ai_prompt_${websiteId}`, JSON.stringify({
        original: userPrompt,
        processed: processedPrompt,
        timestamp: Date.now()
      }));
      
      // Navigate to AI panel with new website
      router.push(`/studio/${websiteId}/ai`);
      
      toast({
        title: 'Website Created!',
        description: `${processedPrompt.websiteName} is ready for development`,
        status: 'success'
      });
      
    } catch (error) {
      console.error('Website creation failed:', error);
      toast({
        title: 'Creation Failed',
        description: 'Unable to create website. Please try again.',
        status: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="website-creator">
      <AIPromptSection 
        onWebsiteCreated={handleWebsiteCreation}
        isCreating={isCreating}
      />
    </div>
  );
}
```

### 5. AI Panel Integration
**Location**: `app/studio/[id]/ai/page.tsx`

```typescript
export default function AIPanel({ params }: { params: { id: string } }) {
  const [initialPrompt, setInitialPrompt] = useState<any>(null);
  
  useEffect(() => {
    // Retrieve prompt from session storage
    const storedPrompt = sessionStorage.getItem(`ai_prompt_${params.id}`);
    
    if (storedPrompt) {
      const promptData = JSON.parse(storedPrompt);
      setInitialPrompt(promptData);
      
      // Clean up after retrieval (one-time use)
      sessionStorage.removeItem(`ai_prompt_${params.id}`);
      
      // Auto-populate AI panel with context
      populateAIPanel(promptData);
    }
  }, [params.id]);
  
  const populateAIPanel = (promptData: any) => {
    // Set AI panel context with the initial prompt
    // This allows immediate continuation of the website creation flow
  };
  
  return (
    <div className="ai-panel">
      {initialPrompt && (
        <div className="initial-prompt-context">
          <h3>Continuing from your idea:</h3>
          <p>{initialPrompt.original}</p>
          <div className="suggested-features">
            {initialPrompt.processed.suggestedFeatures.map(feature => (
              <span key={feature} className="feature-tag">{feature}</span>
            ))}
          </div>
        </div>
      )}
      {/* Rest of AI panel */}
    </div>
  );
}
```

## Acceptance Criteria

### AC1: Prompt Interface Implementation ✓
- [x] "What would you build today?" heading prominently displayed
- [x] Multi-line text input accepts natural language descriptions
- [x] Placeholder text provides helpful examples
- [x] Create button disabled when prompt is empty
- [x] Loading state shown during processing

### AC2: Quick Category Tags ✓
- [x] At least 6 category tags displayed (CRM, Dev Tools, Educational, E-Commerce, Portfolio, SaaS)
- [x] Each tag has distinctive icon and color
- [x] Clicking tag populates prompt with pre-written description
- [x] Tags are responsive and wrap on smaller screens
- [x] Visual feedback on hover/click

### AC3: Prompt Processing ✓
- [x] Natural language prompt analyzed for key concepts
- [x] Website name extracted or generated from prompt
- [x] Category automatically detected
- [x] Features identified from description
- [x] Processing completes within 2 seconds

### AC4: Website Creation ✓
- [x] Unique website ID generated
- [x] Website metadata stored in browser storage
- [x] Initial configuration based on prompt analysis
- [x] AI context preserved for studio use
- [x] Creation timestamp recorded

### AC5: Navigation Flow ✓
- [x] After creation, auto-navigate to `/studio/{id}/ai`
- [x] Prompt data passed to AI panel via session storage
- [x] Loading transition smooth and informative
- [x] Success toast notification displayed
- [x] Error handling for failed creation

## Integration Verification

### IV1: Storage Integration
- [x] Website created using WebsiteStorageService from Story 3.1
- [x] Storage quota checked before creation
- [x] Proper error handling for storage failures
- [x] Website appears in dashboard grid immediately

### IV2: AI Panel Context
- [x] AI panel receives initial prompt correctly
- [x] Prompt context available in AI panel on first load
- [x] Suggested features populate AI configuration
- [x] Session storage cleaned after retrieval

### IV3: Dashboard Updates
- [x] New website appears in grid without refresh
- [x] Recent apps section updates immediately
- [x] Website count increments correctly
- [x] Grid layout adjusts for new card

## Implementation Steps

### Step 1: Create AI Prompt Components
1. Build AIPromptSection component with textarea
2. Implement QuickCategoryTags with icons
3. Add styling matching dashboard design
4. Connect state management

### Step 2: Implement Prompt Processing
1. Create AIPromptProcessor service
2. Add prompt analysis logic
3. Implement category detection
4. Extract features and requirements

### Step 3: Website Creation Flow
1. Generate unique IDs
2. Create website data structure
3. Store in browser storage
4. Handle errors gracefully

### Step 4: Navigation and Context
1. Implement router navigation
2. Store prompt in session storage
3. Add loading states
4. Create success/error toasts

### Step 5: AI Panel Integration
1. Retrieve prompt from session
2. Populate AI panel context
3. Clean up session storage
4. Test full flow

## Testing Requirements

### Unit Tests
- [ ] AIPromptProcessor service methods
- [ ] Category detection accuracy
- [ ] Feature extraction logic
- [ ] ID generation uniqueness
- [ ] Prompt validation

### Integration Tests
- [ ] Complete creation flow from prompt to studio
- [ ] Session storage persistence
- [ ] Navigation with context
- [ ] Error recovery scenarios

### E2E Tests
- [ ] User enters prompt and creates website
- [ ] Quick tag selection flow
- [ ] Navigation to AI panel with context
- [ ] Multiple website creation
- [ ] Storage quota scenarios

### Performance Tests
- [ ] Prompt processing < 2 seconds
- [ ] Navigation < 3 seconds total
- [ ] No memory leaks with multiple creations
- [ ] Session storage cleanup verified

## Dependencies
- Story 3.1 (Storage Schema) - MUST be complete
- Story 3.2 (Studio Routing) - MUST be complete  
- Story 3.3 (Dashboard Foundation) - MUST be complete
- AI SDK for enhanced prompt processing (optional)
- Icon library for category tags

## Risks and Mitigations

1. **Risk**: AI prompt processing accuracy
   - **Mitigation**: Fallback to keyword matching if AI unavailable
   
2. **Risk**: Session storage limitations
   - **Mitigation**: Compress prompt data, implement cleanup
   
3. **Risk**: Creation failures leaving orphaned data
   - **Mitigation**: Atomic operations with rollback capability

4. **Risk**: User confusion with natural language input
   - **Mitigation**: Clear examples and category suggestions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] QA sign-off

## Dev Agent Record

### Agent Model Used
- Claude 3 Opus (claude-opus-4-1-20250805)

### Debug Log References
- No critical errors encountered during implementation
- Linting warnings resolved
- TypeScript errors fixed

### Completion Notes
- All acceptance criteria implemented and tested
- Components created: AIPromptSection, QuickCategoryTags, WebsiteCreator
- Service created: AIPromptProcessor with full prompt analysis capabilities
- AI Panel integration completed with context passing
- Session storage used for one-time prompt transfer
- Comprehensive tests written for all components and services
- TypeScript strict mode compliance achieved

### File List
**Created:**
- components/dashboard/ai-prompt-section.tsx
- components/dashboard/quick-category-tags.tsx
- components/dashboard/website-creator.tsx
- lib/services/ai-prompt-processor.ts
- lib/utils/id-generator.ts
- app/studio/[id]/ai/ai-panel-with-context.tsx
- components/dashboard/__tests__/quick-category-tags.test.tsx
- components/dashboard/__tests__/ai-prompt-section.test.tsx
- components/dashboard/__tests__/website-creator.test.tsx
- lib/services/__tests__/ai-prompt-processor.test.ts

**Modified:**
- app/dashboard/page.tsx
- app/studio/[id]/ai/page.tsx

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-12 | 1.0 | Initial implementation of Story 3.4 | James (Dev) |
| 2025-01-12 | 1.1 | Fixed lint and TypeScript errors | James (Dev) |

## Notes for Developer
- Use existing prompt processing patterns from AI panel
- Ensure TypeScript strict mode compliance
- Follow dashboard component patterns from Story 3.3
- Consider implementing prompt history for future enhancement
- Add analytics tracking for prompt categories
- Implement proper error boundaries
- Consider offline capability for prompt storage

## QA Focus Areas
- Test with various prompt lengths and complexity
- Verify category detection accuracy
- Check session storage cleanup
- Test creation with storage near quota
- Validate navigation timing
- Test with special characters in prompts
- Verify toast notifications appear correctly
- Test browser back button behavior

## UI/UX Considerations
- Prompt textarea should auto-resize up to max height
- Category tags should have clear visual hierarchy
- Loading states must be informative
- Success feedback should be celebratory
- Error messages should be actionable
- Mobile responsiveness for prompt input
- Keyboard shortcuts for power users (Ctrl+Enter to create)

---
*Story prepared by Bob, Scrum Master*
*Ready for implementation by AI Developer*

## QA Results

### Review Date: 2025-01-12

### Reviewed By: Quinn (Senior Developer QA)

### Code Quality Assessment

The implementation is solid and meets all acceptance criteria. The code demonstrates good architectural decisions with clear separation of concerns, proper TypeScript typing, and comprehensive error handling. The UI is polished with excellent attention to detail including gradient effects, dark mode support, and keyboard shortcuts. The developer has successfully created a compelling AI-first website creation experience.

### Refactoring Performed

- **File**: components/dashboard/website-creator.tsx
  - **Change**: Moved AIPromptProcessor instantiation inside try block
  - **Why**: Better scoping and cleaner error handling
  - **How**: Ensures processor is only created when needed

- **File**: lib/services/ai-prompt-processor.ts
  - **Change**: Added optional processedPrompt parameter to createWebsiteFromPrompt
  - **Why**: Avoid double processing of the same prompt
  - **How**: Reuses already processed prompt data, improving performance

- **File**: components/dashboard/ai-prompt-section.tsx
  - **Change**: Added proper error handling in handleCreate
  - **Why**: Ensure errors are caught locally even though parent handles them
  - **How**: Added try-catch to prevent unhandled promise rejections

- **File**: components/dashboard/ai-prompt-section.tsx
  - **Change**: Added character limit (1000) and counter for prompt input
  - **Why**: Prevent unreasonably long prompts and improve UX
  - **How**: Added maxLength attribute and character counter that appears at 800+ chars

### Compliance Check

- Coding Standards: ✓ Excellent TypeScript usage, proper React patterns
- Project Structure: ✓ Files properly organized in correct directories
- Testing Strategy: ✓ Comprehensive test coverage with unit tests for all components
- All ACs Met: ✓ All 5 acceptance criteria fully implemented

### Improvements Checklist

[x] Optimized double prompt processing in website creation flow
[x] Added input validation with character limit for prompts
[x] Enhanced error handling in AI prompt section
[x] Added character counter for better UX
[ ] Consider adding prompt history/suggestions based on past creations
[ ] Consider implementing debounce on prompt processing for real-time preview
[ ] Add telemetry for tracking popular website categories

### Security Review

No security issues found. The implementation properly:
- Sanitizes user input
- Uses session storage appropriately with cleanup
- No hardcoded secrets or sensitive data
- Proper error message handling without exposing internals

### Performance Considerations

- Prompt processing is efficient with pattern matching
- Session storage cleanup prevents memory leaks
- Auto-hide context banner after 10 seconds reduces DOM overhead
- Character limit prevents processing extremely long prompts
- Optimized to avoid double prompt processing

### Final Status

✓ Approved - Ready for Done

Excellent implementation of the AI-powered website creation feature. The code is clean, well-tested, and provides a delightful user experience. The refactoring improvements enhance performance and maintainability without changing functionality. All acceptance criteria are met and the feature is production-ready.