import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { generateWebsiteId } from '@/lib/utils/id-generator';
import { WebsiteMetadata, AIContext } from '@/lib/storage/types';

interface ProcessedPrompt {
  websiteName: string;
  description: string;
  category: string;
  suggestedFeatures: string[];
  technicalRequirements: string[];
  targetAudience: string;
}

interface WebsiteCreationData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  createdAt: Date;
  lastModified: Date;
  aiContext: {
    initialPrompt: ProcessedPrompt;
    suggestedFeatures: string[];
    technicalStack: string[];
  };
  config: {
    theme: any;
    features: string[];
    settings: Record<string, unknown>;
  };
}

export class AIPromptProcessor {
  private storageService: WebsiteStorageService;
  
  constructor() {
    this.storageService = new WebsiteStorageService();
  }
  
  async processPrompt(userPrompt: string): Promise<ProcessedPrompt> {
    // Analyze prompt using pattern matching and heuristics
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
  
  async createWebsiteFromPrompt(userPrompt: string, processedPrompt?: ProcessedPrompt): Promise<string> {
    // Use provided processed prompt or process it
    const prompt = processedPrompt || await this.processPrompt(userPrompt);
    
    // Initialize storage if needed
    await this.storageService.initializeDB();
    
    // Create website metadata
    const websiteMetadata: Omit<WebsiteMetadata, 'id'> = {
      name: prompt.websiteName,
      description: prompt.description,
      category: prompt.category,
      createdAt: new Date(),
      lastModified: new Date(),
      storageQuota: 100 * 1024 * 1024 // 100MB default
    };
    
    // Create the website in storage
    const websiteId = await this.storageService.createWebsite(websiteMetadata);
    
    // Save AI context and initial configuration
    const aiContext: AIContext = {
      brandIdentity: {
        name: prompt.websiteName,
        tagline: this.generateTagline(prompt),
      },
      contentStrategy: {
        targetAudience: prompt.targetAudience,
        topics: this.extractTopics(userPrompt),
        tone: this.detectTone(prompt.category)
      },
      history: [{
        id: generateWebsiteId(),
        timestamp: new Date(),
        prompt: userPrompt,
        response: JSON.stringify(prompt),
        context: { type: 'website_creation' }
      }]
    };
    
    const websiteData = {
      config: {
        id: websiteId,
        settings: {
          features: prompt.suggestedFeatures,
          techStack: this.suggestTechStack(prompt)
        },
        theme: this.suggestTheme(prompt.category)
      },
      content: {
        pages: [],
        components: [],
        templates: []
      },
      assets: {
        images: [],
        videos: [],
        documents: []
      },
      aiContext
    };
    
    await this.storageService.saveWebsiteData(websiteId, websiteData);
    
    return websiteId;
  }
  
  private async analyzePrompt(prompt: string): Promise<{ name?: string; description?: string }> {
    // Basic pattern analysis for name extraction
    const namePatterns = [
      /(?:create|build|make)\s+(?:a|an)?\s*([^,\.]+?)(?:\s+for|\s+with|\s+that|$)/i,
      /^([^,\.]+?)(?:\s+for|\s+with|\s+that)/i,
      /(?:want|need)\s+(?:a|an)?\s*([^,\.]+?)(?:\s+for|\s+with|\s+that|$)/i
    ];
    
    let extractedName = '';
    for (const pattern of namePatterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        extractedName = match[1].trim();
        break;
      }
    }
    
    return {
      name: this.cleanExtractedName(extractedName),
      description: prompt
    };
  }
  
  private cleanExtractedName(name: string): string {
    // Remove common filler words and clean up the name
    const fillerWords = ['website', 'site', 'app', 'application', 'platform', 'system', 'tool'];
    let cleanedName = name;
    
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedName = cleanedName.replace(regex, '').trim();
    });
    
    // Capitalize first letter of each word
    cleanedName = cleanedName.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return cleanedName || 'My Website';
  }
  
  private detectCategory(prompt: string): string {
    const categories = {
      crm: /crm|customer|relationship|sales|lead|contact|deal|pipeline/i,
      ecommerce: /store|shop|ecommerce|e-commerce|product|cart|checkout|payment|catalog/i,
      education: /course|learn|teach|student|education|training|tutorial|lesson|quiz/i,
      portfolio: /portfolio|showcase|projects|work|gallery|exhibition|resume/i,
      saas: /saas|platform|subscription|dashboard|analytics|metrics|users|billing/i,
      blog: /blog|article|post|content|writing|journal|news/i,
      social: /social|community|forum|discussion|chat|message|network/i,
      business: /business|company|corporate|agency|consulting|service/i,
      dev: /developer|code|programming|tools|api|documentation/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(prompt)) return category;
    }
    
    return 'general';
  }
  
  private extractFeatures(prompt: string): string[] {
    const features = [];
    
    // Feature detection patterns
    const featurePatterns = {
      authentication: /auth|login|sign|user|account|register|password/i,
      payments: /payment|billing|subscription|checkout|stripe|paypal|invoice/i,
      notifications: /email|notification|alert|remind|notify|message/i,
      analytics: /analytics|dashboard|metrics|report|chart|graph|statistics/i,
      api: /api|integration|webhook|rest|graphql|endpoint/i,
      search: /search|find|filter|query|lookup/i,
      messaging: /chat|message|comment|discussion|conversation|forum/i,
      media: /image|video|upload|gallery|media|photo|file/i,
      forms: /form|survey|quiz|questionnaire|feedback|input/i,
      calendar: /calendar|schedule|event|appointment|booking|date/i,
      maps: /map|location|address|geo|gps|direction/i,
      social: /share|like|follow|comment|social|feed/i
    };
    
    for (const [feature, pattern] of Object.entries(featurePatterns)) {
      if (pattern.test(prompt)) {
        features.push(feature);
      }
    }
    
    return features;
  }
  
  private extractTechnicalNeeds(prompt: string): string[] {
    const needs = [];
    
    const techPatterns = {
      'real-time': /real-time|realtime|live|instant|websocket/i,
      'database': /database|storage|data|crud|persist/i,
      'security': /secure|security|encrypt|protect|safe/i,
      'responsive': /responsive|mobile|tablet|device|screen/i,
      'performance': /fast|performance|optimize|speed|efficient/i,
      'scalable': /scale|scalable|growth|expand|large/i,
      'multilingual': /language|multilingual|i18n|translation|locale/i,
      'offline': /offline|pwa|cache|sync/i,
      'seo': /seo|search engine|optimize|ranking|meta/i,
      'accessibility': /accessible|a11y|wcag|disability|screen reader/i
    };
    
    for (const [need, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(prompt)) {
        needs.push(need);
      }
    }
    
    return needs;
  }
  
  private identifyAudience(prompt: string): string {
    const audiencePatterns = {
      'small businesses': /small business|smb|startup|entrepreneur/i,
      'enterprises': /enterprise|corporate|large company|organization/i,
      'developers': /developer|programmer|engineer|coder|technical/i,
      'students': /student|education|school|university|learn/i,
      'professionals': /professional|business|consultant|agency|freelance/i,
      'consumers': /consumer|customer|user|public|everyone/i,
      'creators': /creator|artist|designer|writer|content/i,
      'teams': /team|collaboration|group|department|company/i
    };
    
    for (const [audience, pattern] of Object.entries(audiencePatterns)) {
      if (pattern.test(prompt)) return audience;
    }
    
    return 'general users';
  }
  
  private generateDefaultName(prompt: string): string {
    // Extract first few meaningful words from the prompt
    const words = prompt
      .split(' ')
      .filter(word => word.length > 3 && !/^(with|that|for|and|the|this)$/i.test(word))
      .slice(0, 3);
    
    if (words.length > 0) {
      return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return 'My New Website';
  }
  
  private suggestTechStack(prompt: ProcessedPrompt): string[] {
    const stack = ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'];
    
    if (prompt.suggestedFeatures.includes('authentication')) {
      stack.push('NextAuth.js');
    }
    if (prompt.suggestedFeatures.includes('payments')) {
      stack.push('Stripe');
    }
    if (prompt.suggestedFeatures.includes('messaging')) {
      stack.push('Socket.io');
    }
    if (prompt.suggestedFeatures.includes('database')) {
      stack.push('Prisma', 'PostgreSQL');
    }
    if (prompt.category === 'ecommerce') {
      stack.push('Commerce.js');
    }
    if (prompt.technicalRequirements.includes('real-time')) {
      stack.push('WebSockets');
    }
    
    return [...new Set(stack)]; // Remove duplicates
  }
  
  private suggestTheme(category: string): { primary: string; secondary: string; style: string; darkMode: boolean } {
    const themes: Record<string, { primary: string; secondary: string; style: string; darkMode: boolean }> = {
      crm: { 
        primary: '#3B82F6', // blue
        secondary: '#1E40AF',
        style: 'professional',
        darkMode: true
      },
      ecommerce: { 
        primary: '#10B981', // green
        secondary: '#059669',
        style: 'modern',
        darkMode: true
      },
      education: { 
        primary: '#8B5CF6', // purple
        secondary: '#7C3AED',
        style: 'friendly',
        darkMode: true
      },
      portfolio: { 
        primary: '#000000', // black
        secondary: '#374151',
        style: 'minimal',
        darkMode: true
      },
      saas: { 
        primary: '#6366F1', // indigo
        secondary: '#4F46E5',
        style: 'tech',
        darkMode: true
      },
      blog: {
        primary: '#F59E0B', // amber
        secondary: '#D97706',
        style: 'content-focused',
        darkMode: true
      },
      social: {
        primary: '#EC4899', // pink
        secondary: '#DB2777',
        style: 'vibrant',
        darkMode: true
      }
    };
    
    return themes[category] || themes.saas;
  }
  
  private generateTagline(prompt: ProcessedPrompt): string {
    const taglines: Record<string, string> = {
      crm: 'Manage relationships, grow your business',
      ecommerce: 'Your products, beautifully presented',
      education: 'Learn, teach, and grow together',
      portfolio: 'Showcase your best work',
      saas: 'Software that scales with you',
      blog: 'Share your stories with the world',
      social: 'Connect and collaborate',
      general: 'Build something amazing'
    };
    
    return taglines[prompt.category] || taglines.general;
  }
  
  private extractTopics(prompt: string): string[] {
    // Extract key topics from the prompt
    const stopWords = new Set(['a', 'an', 'the', 'with', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of']);
    const words = prompt.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Get unique meaningful words as topics
    return [...new Set(words)].slice(0, 10);
  }
  
  private detectTone(category: string): string {
    const tones: Record<string, string> = {
      crm: 'professional',
      ecommerce: 'persuasive',
      education: 'informative',
      portfolio: 'creative',
      saas: 'technical',
      blog: 'conversational',
      social: 'friendly',
      business: 'formal'
    };
    
    return tones[category] || 'neutral';
  }
}