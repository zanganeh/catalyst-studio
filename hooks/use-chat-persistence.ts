import { useEffect, useRef, useCallback, useState } from 'react';
import { Message as AIMessage } from 'ai';
import {
  useAIContext,
  useCreateAIContext,
  useAppendMessage,
  useClearContext,
  useDeleteAIContext
} from '@/lib/api/hooks/use-ai-context';
import { AIMessage as ContextAIMessage } from '@/types/ai-context';

interface UseChatPersistenceOptions {
  websiteId: string | null;
  sessionId: string;
  enabled?: boolean;
  autoSaveDelay?: number;
  onLoadStart?: () => void;
  onLoadComplete?: (messages: ContextAIMessage[]) => void;
  onLoadError?: (error: Error) => void;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

interface UseChatPersistenceReturn {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  storageStrategy: string;
  storageUsage: { usage: number; quota: number; percentage: number } | null;
  error: Error | null;
  saveMessages: (messages: AIMessage[]) => Promise<void>;
  saveMessagesImmediate: (messages: AIMessage[]) => Promise<void>;
  loadMessages: () => Promise<ContextAIMessage[]>;
  clearMessages: () => Promise<void>;
  exportMessages: () => Promise<string>;
  importMessages: (jsonData: string) => Promise<void>;
  contextData?: any;
}

export function useChatPersistence({
  websiteId,
  sessionId,
  enabled = true,
  autoSaveDelay = 500,
  onLoadStart,
  onLoadComplete,
  onLoadError,
  onSaveStart,
  onSaveComplete,
  onSaveError
}: UseChatPersistenceOptions): UseChatPersistenceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessagesRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const hasCreatedContextRef = useRef(false);
  const isCreatingContextRef = useRef(false); // Mutex for context creation

  // Use the new AI Context API hooks - only if websiteId is valid
  const { data: contextData, isLoading: isContextLoading, error: contextError } = useAIContext(
    websiteId || 'skip',
    sessionId,
    { enabled: !!websiteId && websiteId !== 'default' }
  );
  
  const createContext = useCreateAIContext();
  const appendMessage = useAppendMessage(websiteId || '', sessionId);
  const clearContext = useClearContext(websiteId || '', sessionId);
  const deleteContextMutation = useDeleteAIContext();

  // Initialize context if needed
  useEffect(() => {
    if (!enabled || !websiteId || websiteId === 'default' || !sessionId || hasCreatedContextRef.current || isCreatingContextRef.current) return;
    
    const initContext = async () => {
      // Prevent concurrent creation attempts
      if (isCreatingContextRef.current) return;
      isCreatingContextRef.current = true;
      
      try {
        // Check if context exists, if not create it
        // Only create if we have loaded and there's no context
        if (!isContextLoading && !contextData) {
          // Check if it's a 404 error (context doesn't exist)
          if (contextError && contextError.message.includes('not found')) {
            await createContext.mutateAsync({
              websiteId,
              sessionId
            });
            hasCreatedContextRef.current = true;
          }
        } else if (contextData) {
          // Context already exists
          hasCreatedContextRef.current = true;
        }
        isInitializedRef.current = true;
      } catch (err) {
        // Ignore duplicate key errors since context already exists
        if (err instanceof Error && err.message.includes('already exists')) {
          hasCreatedContextRef.current = true;
          isInitializedRef.current = true;
        } else {
          console.error('Failed to initialize AI context:', err);
          setError(err as Error);
        }
      } finally {
        isCreatingContextRef.current = false;
      }
    };

    initContext();
  }, [enabled, websiteId, sessionId, contextData, isContextLoading, contextError, createContext]);

  // Update metadata from context
  useEffect(() => {
    if (contextData) {
      setLastSaved(contextData.updatedAt ? new Date(contextData.updatedAt) : null);
      setSaveCount(contextData.metadata?.totalMessages || 0);
      hasCreatedContextRef.current = true;
    }
  }, [contextData]);

  // Convert AI SDK messages to our Message format
  const convertMessages = useCallback((aiMessages: AIMessage[]): ContextAIMessage[] => {
    return aiMessages
      .filter(msg => msg.content && msg.content.trim().length > 0) // Skip empty messages
      .map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.createdAt || new Date(),
        metadata: msg.annotations as Record<string, any>
      }));
  }, []);

  // Save messages immediately (for critical paths like unmount)
  const saveMessagesImmediate = useCallback(async (messages: AIMessage[]) => {
    if (!enabled || !websiteId || websiteId === 'default' || !sessionId) return;

    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const messagesString = JSON.stringify(messages);
    if (messagesString === lastMessagesRef.current) {
      return; // No changes, skip save
    }

    setIsSaving(true);
    setError(null);
    onSaveStart?.();

    try {
      const convertedMessages = convertMessages(messages);
      
      // If context doesn't exist yet, create it with the first message
      if (!hasCreatedContextRef.current && !contextData && !isCreatingContextRef.current) {
        const firstMessage = convertedMessages[0];
        if (firstMessage) {
          isCreatingContextRef.current = true;
          try {
            await createContext.mutateAsync({
              websiteId,
              sessionId,
              initialMessage: firstMessage
            });
            hasCreatedContextRef.current = true;
            
            // Append remaining messages if any
            for (let i = 1; i < convertedMessages.length; i++) {
              await appendMessage.mutateAsync({
                message: convertedMessages[i]
              });
            }
          } catch (err) {
            // If context already exists, just mark it as created
            if (err instanceof Error && err.message.includes('already exists')) {
              hasCreatedContextRef.current = true;
              // Fall through to update existing context
            } else {
              throw err;
            }
          } finally {
            isCreatingContextRef.current = false;
          }
        }
      }
      
      // If context exists, update it
      if (hasCreatedContextRef.current || contextData) {
        // Only update if messages have actually changed
        const existingMessages = contextData?.messages || [];
        const hasChanges = convertedMessages.length !== existingMessages.length ||
          JSON.stringify(convertedMessages) !== JSON.stringify(existingMessages);
        
        if (hasChanges) {
          // Clear existing messages and append all new ones
          // This maintains the full conversation history
          await clearContext.mutateAsync();
          
          // Append all messages
          for (const msg of convertedMessages) {
            await appendMessage.mutateAsync({
              message: msg
            });
          }
        }
      }

      setLastSaved(new Date());
      setSaveCount(convertedMessages.length);
      lastMessagesRef.current = messagesString;
      onSaveComplete?.();
    } catch (err) {
      console.error('Failed to save messages:', err);
      setError(err as Error);
      onSaveError?.(err as Error);
    } finally {
      setIsSaving(false);
    }
  }, [
    enabled,
    websiteId,
    sessionId,
    convertMessages,
    createContext,
    appendMessage,
    clearContext,
    contextData,
    onSaveStart,
    onSaveComplete,
    onSaveError
  ]);

  // Save messages with debouncing
  const saveMessages = useCallback(async (messages: AIMessage[]) => {
    if (!enabled || !websiteId || websiteId === 'default' || !sessionId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if messages have changed
    const messagesString = JSON.stringify(messages);
    if (messagesString === lastMessagesRef.current) {
      return; // No changes, skip save
    }

    // Debounce the save operation - call immediate save after delay
    saveTimeoutRef.current = setTimeout(() => {
      saveMessagesImmediate(messages);
    }, autoSaveDelay);
  }, [
    enabled,
    websiteId,
    sessionId,
    autoSaveDelay,
    saveMessagesImmediate
  ]);

  // Load messages
  const loadMessages = useCallback(async (): Promise<ContextAIMessage[]> => {
    if (!enabled || !sessionId) return [];

    setIsLoading(true);
    setError(null);
    onLoadStart?.();

    try {
      console.log('Loading messages, contextData:', contextData);
      // The context data is already loaded via the useAIContext hook
      if (!contextData) {
        console.log('No context data available');
        onLoadComplete?.([]);
        return [];
      }

      const messages = contextData.messages || [];
      console.log('Loaded messages from context:', messages);
      onLoadComplete?.(messages);
      return messages;
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err as Error);
      onLoadError?.(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled, sessionId, contextData, onLoadStart, onLoadComplete, onLoadError]);

  // Clear messages
  const clearMessages = useCallback(async () => {
    if (!enabled || !websiteId || websiteId === 'default' || !sessionId) return;

    try {
      await clearContext.mutateAsync();
      
      // Reset state
      setSaveCount(0);
      setLastSaved(null);
      lastMessagesRef.current = '';
    } catch (err) {
      console.error('Failed to clear messages:', err);
      setError(err as Error);
    }
  }, [enabled, websiteId, sessionId, clearContext]);

  // Export messages as JSON
  const exportMessages = useCallback(async (): Promise<string> => {
    if (!enabled || !contextData) return '[]';

    try {
      return JSON.stringify({
        sessionId: contextData.sessionId,
        websiteId: contextData.websiteId,
        messages: contextData.messages,
        metadata: contextData.metadata,
        summary: contextData.summary,
        createdAt: contextData.createdAt,
        updatedAt: contextData.updatedAt
      }, null, 2);
    } catch (err) {
      console.error('Failed to export messages:', err);
      setError(err as Error);
      return '[]';
    }
  }, [enabled, contextData]);

  // Import messages from JSON
  const importMessages = useCallback(async (jsonData: string) => {
    if (!enabled || !websiteId || websiteId === 'default' || !sessionId) return;

    try {
      const data = JSON.parse(jsonData);
      
      // Validate the imported data structure
      if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid chat data format: missing messages array');
      }

      // Clear existing context
      await clearContext.mutateAsync();
      
      // Create new context with imported messages
      if (data.messages.length > 0) {
        // Create context with first message
        await createContext.mutateAsync({
          websiteId,
          sessionId,
          initialMessage: data.messages[0]
        });
        
        // Append remaining messages
        for (let i = 1; i < data.messages.length; i++) {
          await appendMessage.mutateAsync({
            message: data.messages[i]
          });
        }
      }

      setSaveCount(data.messages.length);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to import messages:', err);
      setError(err as Error);
      throw err;
    }
  }, [enabled, websiteId, sessionId, clearContext, createContext, appendMessage]);

  // Store current messages ref for cleanup
  const currentMessagesRef = useRef<AIMessage[]>([]);
  
  // Update current messages ref when contextData changes
  useEffect(() => {
    if (contextData?.messages) {
      currentMessagesRef.current = contextData.messages.map((msg: ContextAIMessage) => ({
        id: crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.timestamp ? new Date(msg.timestamp) : undefined
      }));
    }
  }, [contextData]);

  // Cleanup on unmount and beforeunload
  useEffect(() => {
    // Beforeunload handler to save before page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveTimeoutRef.current) {
        // Clear pending save and save immediately
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        
        // Use the current messages if available
        if (currentMessagesRef.current.length > 0) {
          // Note: This will be async but browser will wait briefly
          saveMessagesImmediate(currentMessagesRef.current);
        }
      }
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save any pending messages on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        
        // Save immediately if we have messages
        if (currentMessagesRef.current.length > 0) {
          saveMessagesImmediate(currentMessagesRef.current);
        }
      }
    };
  }, [saveMessagesImmediate]);

  // Calculate storage usage (using mock values since we're using database now)
  const storageUsage = {
    usage: saveCount * 1000, // Rough estimate: 1KB per message
    quota: 10 * 1024 * 1024, // 10MB quota
    percentage: (saveCount * 1000) / (10 * 1024 * 1024) * 100
  };

  return {
    isLoading: isLoading || isContextLoading,
    isSaving,
    lastSaved,
    saveCount,
    storageStrategy: 'Database (AI Context API)',
    storageUsage,
    error: error || contextError,
    saveMessages,
    saveMessagesImmediate,
    loadMessages,
    clearMessages,
    exportMessages,
    importMessages,
    contextData // Export this so components can check if it's ready
  };
}