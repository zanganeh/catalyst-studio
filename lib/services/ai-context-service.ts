import { prisma } from '@/lib/prisma';
import { AIContext, AIMessage, AIMetadata } from '@/types/ai-context';
import { ApiError } from '@/lib/api/errors';

const MAX_MESSAGES = 50;
const MAX_TOKENS = 8000;
const OLD_MESSAGE_DAYS = 30;

export class AIContextService {
  /**
   * Get all AI contexts for a website
   */
  static async getAIContexts(
    websiteId: string, 
    options?: { 
      limit?: number; 
      offset?: number; 
      isActive?: boolean;
    }
  ) {
    const { limit = 50, offset = 0, isActive } = options || {};
    
    const where = { 
      websiteId
    };
    
    const [contexts, total] = await Promise.all([
      prisma.aIContext.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.aIContext.count({ where })
    ]);
    
    // Filter by isActive in memory since it's stored in the context JSON
    let filteredContexts = contexts;
    if (isActive !== undefined) {
      filteredContexts = contexts.filter(c => {
        const contextData = c.context as any || {};
        return contextData.isActive === isActive;
      });
    }
    
    return {
      contexts: filteredContexts.map(this.transformContext),
      total: filteredContexts.length,
      limit,
      offset
    };
  }
  
  /**
   * Get a specific AI context by sessionId
   */
  static async getAIContext(websiteId: string, sessionId: string): Promise<AIContext | null> {
    const context = await prisma.aIContext.findUnique({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      }
    });
    
    return context ? this.transformContext(context) : null;
  }
  
  /**
   * Create a new AI context session
   */
  static async createAIContext(
    websiteId: string, 
    initialMessage?: AIMessage,
    sessionId?: string
  ): Promise<AIContext> {
    // First check if the website exists
    const websiteExists = await prisma.website.findUnique({
      where: { id: websiteId },
      select: { id: true }
    });
    
    if (!websiteExists) {
      throw new ApiError(400, `Referenced record not found: Website with ID '${websiteId}' does not exist`);
    }
    
    const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messages: AIMessage[] = initialMessage ? [initialMessage] : [];
    const metadata: AIMetadata = {
      totalMessages: messages.length,
      tokens: await this.estimateTokens(messages)
    };
    
    try {
      const context = await prisma.aIContext.create({
        data: {
          websiteId,
          sessionId: newSessionId,
          context: {
            messages,
            isActive: true
          },
          metadata
        }
      });
      
      return this.transformContext(context);
    } catch (error: any) {
      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        throw new ApiError(400, `Referenced record not found: Website with ID '${websiteId}' does not exist`);
      }
      throw error;
    }
  }
  
  /**
   * Append a message to the conversation
   */
  static async appendMessage(
    websiteId: string,
    sessionId: string, 
    message: AIMessage,
    pruneIfNeeded = true
  ): Promise<AIContext> {
    const context = await this.getAIContext(websiteId, sessionId);
    
    if (!context) {
      throw new ApiError(404, 'AI context not found');
    }
    
    if (!context.isActive) {
      throw new ApiError(400, 'Context session is not active');
    }
    
    let messages = [...context.messages, message];
    
    // Prune if needed
    if (pruneIfNeeded) {
      const tokens = await this.estimateTokens(messages);
      if (messages.length > MAX_MESSAGES || tokens > MAX_TOKENS) {
        messages = await this.pruneContext(messages, context.summary);
      }
    }
    
    const metadata: AIMetadata = {
      ...context.metadata,
      totalMessages: messages.length,
      tokens: await this.estimateTokens(messages)
    };
    
    const updated = await prisma.aIContext.update({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      },
      data: {
        context: {
          messages,
          summary: context.summary,
          isActive: true
        },
        metadata,
        updatedAt: new Date()
      }
    });
    
    return this.transformContext(updated);
  }
  
  /**
   * Prune old messages from context
   * Note: This duplicates logic from ai-context-pruning.ts - should be refactored to use that utility
   */
  static async pruneContext(
    messages: AIMessage[], 
    existingSummary?: string | null
  ): Promise<AIMessage[]> {
    // Import pruning utility to avoid duplication
    const { pruneMessages } = await import('@/lib/utils/ai-context-pruning');
    
    const result = pruneMessages(messages, existingSummary, {
      maxMessages: MAX_MESSAGES,
      maxTokens: MAX_TOKENS,
      preserveSystemMessages: true,
      preserveRecentCount: 30
    });
    
    return result.messages;
  }
  
  /**
   * Summarize a long conversation context
   */
  static async summarizeContext(
    websiteId: string,
    sessionId: string
  ): Promise<string> {
    const context = await this.getAIContext(websiteId, sessionId);
    
    if (!context) {
      throw new ApiError(404, 'AI context not found');
    }
    
    // In production, this would call an AI API to create a summary
    // For now, return a placeholder
    const summary = `Conversation summary: ${context.messages.length} messages exchanged`;
    
    await prisma.aIContext.update({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      },
      data: {
        summary
      }
    });
    
    return summary;
  }
  
  /**
   * Clear messages from a context (keep session)
   */
  static async clearContext(websiteId: string, sessionId: string): Promise<AIContext> {
    const context = await this.getAIContext(websiteId, sessionId);
    
    if (!context) {
      throw new ApiError(404, 'AI context not found');
    }
    
    const updated = await prisma.aIContext.update({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      },
      data: {
        context: {
          messages: [],
          summary: null,
          isActive: true
        },
        metadata: { totalMessages: 0, tokens: 0 }
      }
    });
    
    return this.transformContext(updated);
  }
  
  /**
   * Soft delete a context session
   */
  static async deleteContext(websiteId: string, sessionId: string): Promise<void> {
    const existing = await prisma.aIContext.findUnique({
      where: {
        websiteId_sessionId: {
          websiteId,
          sessionId
        }
      }
    });
    
    if (existing) {
      await prisma.aIContext.update({
        where: {
          websiteId_sessionId: {
            websiteId,
            sessionId
          }
        },
        data: {
          context: {
            ...(existing.context as any || {}),
            isActive: false
          }
        }
      });
    }
  }
  
  /**
   * Transform database record to typed AIContext
   */
  private static transformContext(record: any): AIContext {
    const contextData = record.context || {};
    const metadata = record.metadata || { totalMessages: 0, tokens: 0 };
    
    return {
      id: record.id,
      websiteId: record.websiteId,
      sessionId: record.sessionId,
      messages: contextData.messages || [],
      metadata: metadata,
      summary: contextData.summary || undefined,
      isActive: contextData.isActive !== false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
  
  /**
   * Estimate token count for messages
   */
  private static async estimateTokens(messages: AIMessage[]): Promise<number> {
    // Use the improved estimation from pruning utility
    const { estimateTokenCount } = await import('@/lib/utils/ai-context-pruning');
    return estimateTokenCount(messages);
  }
  
  /**
   * Clean up old inactive sessions
   */
  static async cleanupOldSessions(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - OLD_MESSAGE_DAYS);
    
    // First find all inactive sessions
    const oldInactiveSessions = await prisma.aIContext.findMany({
      where: {
        updatedAt: {
          lt: cutoffDate
        }
      }
    });
    
    // Filter for truly inactive sessions based on context.isActive
    const toDelete = oldInactiveSessions.filter(session => {
      const contextData = session.context as any || {};
      return contextData.isActive === false;
    });
    
    // Delete the inactive sessions
    if (toDelete.length > 0) {
      const result = await prisma.aIContext.deleteMany({
        where: {
          id: {
            in: toDelete.map(s => s.id)
          }
        }
      });
      return result.count;
    }
    
    return 0;
  }
}