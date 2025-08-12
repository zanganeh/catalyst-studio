import { AIPromptProcessor } from '../ai-prompt-processor';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';

// Mock the storage service
jest.mock('@/lib/storage/website-storage.service');

describe('AIPromptProcessor', () => {
  let processor: AIPromptProcessor;
  let mockStorageService: jest.Mocked<WebsiteStorageService>;
  
  beforeEach(() => {
    processor = new AIPromptProcessor();
    mockStorageService = WebsiteStorageService as any;
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('processPrompt', () => {
    it('should extract website name from prompt', async () => {
      const prompt = 'Create a CRM for small businesses with lead tracking';
      const result = await processor.processPrompt(prompt);
      
      expect(result.websiteName).toBeTruthy();
      expect(result.websiteName).not.toBe('My Website');
    });
    
    it('should detect CRM category', async () => {
      const prompt = 'A customer relationship management system with sales pipeline';
      const result = await processor.processPrompt(prompt);
      
      expect(result.category).toBe('crm');
    });
    
    it('should detect e-commerce category', async () => {
      const prompt = 'An online store with shopping cart and product catalog';
      const result = await processor.processPrompt(prompt);
      
      expect(result.category).toBe('ecommerce');
    });
    
    it('should detect education category', async () => {
      const prompt = 'Educational platform for students with course management';
      const result = await processor.processPrompt(prompt);
      
      expect(result.category).toBe('education');
    });
    
    it('should extract authentication feature', async () => {
      const prompt = 'A platform with user login and authentication';
      const result = await processor.processPrompt(prompt);
      
      expect(result.suggestedFeatures).toContain('authentication');
    });
    
    it('should extract payment feature', async () => {
      const prompt = 'An app with subscription billing and payment processing';
      const result = await processor.processPrompt(prompt);
      
      expect(result.suggestedFeatures).toContain('payments');
    });
    
    it('should extract multiple features', async () => {
      const prompt = 'A SaaS platform with user authentication, payment processing, analytics dashboard, and email notifications';
      const result = await processor.processPrompt(prompt);
      
      expect(result.suggestedFeatures).toContain('authentication');
      expect(result.suggestedFeatures).toContain('payments');
      expect(result.suggestedFeatures).toContain('analytics');
      expect(result.suggestedFeatures).toContain('notifications');
    });
    
    it('should identify target audience for small businesses', async () => {
      const prompt = 'CRM for small businesses and startups';
      const result = await processor.processPrompt(prompt);
      
      expect(result.targetAudience).toBe('small businesses');
    });
    
    it('should identify developer audience', async () => {
      const prompt = 'Developer productivity tools with code snippets';
      const result = await processor.processPrompt(prompt);
      
      expect(result.targetAudience).toBe('developers');
    });
    
    it('should extract technical requirements', async () => {
      const prompt = 'Real-time chat app with offline support and fast performance';
      const result = await processor.processPrompt(prompt);
      
      expect(result.technicalRequirements).toContain('real-time');
      expect(result.technicalRequirements).toContain('offline');
      expect(result.technicalRequirements).toContain('performance');
    });
    
    it('should handle empty prompt gracefully', async () => {
      const prompt = '';
      const result = await processor.processPrompt(prompt);
      
      expect(result.websiteName).toBe('My New Website');
      expect(result.category).toBe('general');
      expect(result.suggestedFeatures).toEqual([]);
    });
    
    it('should handle very long prompts', async () => {
      const longPrompt = 'A '.repeat(500) + 'website with features';
      const result = await processor.processPrompt(longPrompt);
      
      expect(result).toBeDefined();
      expect(result.websiteName).toBeTruthy();
    });
  });
  
  describe('createWebsiteFromPrompt', () => {
    beforeEach(() => {
      // Mock storage service methods
      mockStorageService.prototype.initializeDB = jest.fn().mockResolvedValue(undefined);
      mockStorageService.prototype.createWebsite = jest.fn().mockResolvedValue('test-website-id');
      mockStorageService.prototype.saveWebsiteData = jest.fn().mockResolvedValue(undefined);
    });
    
    it('should create website with processed prompt data', async () => {
      const prompt = 'Create a CRM for small businesses';
      const websiteId = await processor.createWebsiteFromPrompt(prompt);
      
      expect(websiteId).toBe('test-website-id');
      expect(mockStorageService.prototype.createWebsite).toHaveBeenCalled();
      expect(mockStorageService.prototype.saveWebsiteData).toHaveBeenCalled();
    });
    
    it('should initialize database before creating website', async () => {
      const prompt = 'Test website';
      await processor.createWebsiteFromPrompt(prompt);
      
      expect(mockStorageService.prototype.initializeDB).toHaveBeenCalledBefore(
        mockStorageService.prototype.createWebsite as any
      );
    });
    
    it('should save AI context with initial prompt', async () => {
      const prompt = 'E-commerce store with payment processing';
      await processor.createWebsiteFromPrompt(prompt);
      
      const saveCall = (mockStorageService.prototype.saveWebsiteData as jest.Mock).mock.calls[0];
      const savedData = saveCall[1];
      
      expect(savedData.aiContext).toBeDefined();
      expect(savedData.aiContext.history).toHaveLength(1);
      expect(savedData.aiContext.history[0].prompt).toBe(prompt);
    });
    
    it('should set appropriate theme based on category', async () => {
      const crmPrompt = 'CRM system for sales teams';
      await processor.createWebsiteFromPrompt(crmPrompt);
      
      const saveCall = (mockStorageService.prototype.saveWebsiteData as jest.Mock).mock.calls[0];
      const savedData = saveCall[1];
      
      expect(savedData.config.theme).toBeDefined();
      expect(savedData.config.theme.primary).toBe('#3B82F6'); // Blue for CRM
    });
    
    it('should suggest appropriate tech stack', async () => {
      const prompt = 'Platform with user authentication and payment processing';
      await processor.createWebsiteFromPrompt(prompt);
      
      const saveCall = (mockStorageService.prototype.saveWebsiteData as jest.Mock).mock.calls[0];
      const savedData = saveCall[1];
      
      expect(savedData.config.settings.techStack).toContain('NextAuth.js');
      expect(savedData.config.settings.techStack).toContain('Stripe');
    });
    
    it('should handle storage errors gracefully', async () => {
      mockStorageService.prototype.createWebsite = jest.fn().mockRejectedValue(
        new Error('Storage quota exceeded')
      );
      
      await expect(processor.createWebsiteFromPrompt('Test')).rejects.toThrow('Storage quota exceeded');
    });
  });
  
  describe('Category Detection', () => {
    it('should detect all supported categories correctly', async () => {
      const testCases = [
        { prompt: 'CRM for managing customer relationships', expected: 'crm' },
        { prompt: 'Online store with products', expected: 'ecommerce' },
        { prompt: 'Educational course platform', expected: 'education' },
        { prompt: 'Portfolio to showcase my work', expected: 'portfolio' },
        { prompt: 'SaaS dashboard with analytics', expected: 'saas' },
        { prompt: 'Developer tools and code snippets', expected: 'dev' },
        { prompt: 'Blog for writing articles', expected: 'blog' },
        { prompt: 'Social network for communities', expected: 'social' },
        { prompt: 'Business consulting website', expected: 'business' },
        { prompt: 'Random website about cats', expected: 'general' }
      ];
      
      for (const testCase of testCases) {
        const result = await processor.processPrompt(testCase.prompt);
        expect(result.category).toBe(testCase.expected);
      }
    });
  });
  
  describe('Feature Extraction', () => {
    it('should extract all supported features', async () => {
      const featureMap = {
        'user authentication system': ['authentication'],
        'payment and billing': ['payments'],
        'email notifications': ['notifications'],
        'analytics and metrics': ['analytics'],
        'API integration': ['api'],
        'search functionality': ['search'],
        'chat messaging': ['messaging'],
        'image and video upload': ['media'],
        'contact forms': ['forms'],
        'calendar scheduling': ['calendar'],
        'map and location': ['maps'],
        'social sharing': ['social']
      };
      
      for (const [prompt, expectedFeatures] of Object.entries(featureMap)) {
        const result = await processor.processPrompt(prompt);
        for (const feature of expectedFeatures) {
          expect(result.suggestedFeatures).toContain(feature);
        }
      }
    });
  });
});