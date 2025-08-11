import { useEffect, useRef, useCallback, useState } from 'react';
import { Message as AIMessage } from 'ai';
import { storageService } from '@/lib/storage/storage-service';
import { 
  chatPersistenceHelper, 
  STORAGE_KEYS,
  Message,
  PersistedChat,
  StorageMetadata
} from '@/lib/storage/chat-persistence-model';

interface UseChatPersistenceOptions {
  sessionId: string;
  enabled?: boolean;
  autoSaveDelay?: number;
  onLoadStart?: () => void;
  onLoadComplete?: (messages: Message[]) => void;
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
  loadMessages: () => Promise<Message[]>;
  clearMessages: () => Promise<void>;
  exportMessages: () => Promise<string>;
  importMessages: (jsonData: string) => Promise<void>;
}

export function useChatPersistence({
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
  const [storageStrategy, setStorageStrategy] = useState('None');
  const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number; percentage: number } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastMessagesRef = useRef<string>('');

  // Initialize storage service
  useEffect(() => {
    if (!enabled) return;

    const initStorage = async () => {
      try {
        await storageService.initialize();
        setStorageStrategy(storageService.getCurrentStrategy());
        
        // Load metadata if exists
        const metadataKey = STORAGE_KEYS.metadataKey(sessionId);
        const metadata = await storageService.load<StorageMetadata>(metadataKey);
        if (metadata) {
          setSaveCount(metadata.saveCount);
          setLastSaved(new Date(metadata.lastSaved));
        }
        
        // Update storage usage
        const usage = await storageService.getStorageInfo();
        setStorageUsage({
          usage: usage.usage,
          quota: usage.quota,
          percentage: usage.percentage
        });
        
        isInitializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        setError(err as Error);
      }
    };

    initStorage();
  }, [enabled, sessionId]);

  // Convert AI SDK messages to our Message format
  const convertMessages = useCallback((aiMessages: AIMessage[]): Message[] => {
    return aiMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.createdAt?.toISOString() || new Date().toISOString(),
      metadata: msg.annotations as Record<string, any>
    }));
  }, []);

  // Save messages with debouncing
  const saveMessages = useCallback(async (messages: AIMessage[]) => {
    if (!enabled || !isInitializedRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if messages have changed
    const messagesString = JSON.stringify(messages);
    if (messagesString === lastMessagesRef.current) {
      return; // No changes, skip save
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);
      onSaveStart?.();

      try {
        const convertedMessages = convertMessages(messages);
        const sanitizedMessages = chatPersistenceHelper.sanitizeMessages(convertedMessages);
        
        // Create persisted chat data
        const persistedChat = chatPersistenceHelper.createPersistedChat(
          sanitizedMessages,
          sessionId
        );

        // Save to storage
        const chatKey = STORAGE_KEYS.chatKey(sessionId);
        await storageService.save(chatKey, persistedChat);

        // Update metadata
        const newSaveCount = saveCount + 1;
        const metadata = chatPersistenceHelper.createStorageMetadata(
          storageService.getCurrentStrategy(),
          newSaveCount
        );
        
        const metadataKey = STORAGE_KEYS.metadataKey(sessionId);
        await storageService.save(metadataKey, metadata);

        // Update state
        setSaveCount(newSaveCount);
        setLastSaved(new Date());
        lastMessagesRef.current = messagesString;

        // Update storage usage
        const usage = await storageService.getStorageInfo();
        setStorageUsage({
          usage: usage.usage,
          quota: usage.quota,
          percentage: usage.percentage
        });

        onSaveComplete?.();
      } catch (err) {
        console.error('Failed to save messages:', err);
        setError(err as Error);
        onSaveError?.(err as Error);
        
        // Try fallback save with reduced data if quota exceeded
        if ((err as Error).message.includes('quota')) {
          try {
            // Keep only last 50 messages
            const recentMessages = messages.slice(-50);
            const convertedMessages = convertMessages(recentMessages);
            const persistedChat = chatPersistenceHelper.createPersistedChat(
              convertedMessages,
              sessionId
            );
            
            const chatKey = STORAGE_KEYS.chatKey(sessionId);
            await storageService.save(chatKey, persistedChat);
            
            console.warn('Saved reduced message history due to quota limits');
          } catch (fallbackErr) {
            console.error('Fallback save also failed:', fallbackErr);
          }
        }
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);
  }, [enabled, sessionId, saveCount, autoSaveDelay, convertMessages, onSaveStart, onSaveComplete, onSaveError]);

  // Load messages
  const loadMessages = useCallback(async (): Promise<Message[]> => {
    if (!enabled || !isInitializedRef.current) return [];

    setIsLoading(true);
    setError(null);
    onLoadStart?.();

    try {
      const chatKey = STORAGE_KEYS.chatKey(sessionId);
      const persistedChat = await storageService.load<PersistedChat>(chatKey);

      if (!persistedChat) {
        onLoadComplete?.([]);
        return [];
      }

      // Validate and migrate if needed
      const validatedChat = chatPersistenceHelper.validatePersistedChat(persistedChat);
      if (!validatedChat) {
        throw new Error('Invalid persisted chat data');
      }

      const migratedChat = chatPersistenceHelper.migrateIfNeeded(validatedChat);
      
      onLoadComplete?.(migratedChat.messages);
      return migratedChat.messages;
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err as Error);
      onLoadError?.(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled, sessionId, onLoadStart, onLoadComplete, onLoadError]);

  // Clear messages
  const clearMessages = useCallback(async () => {
    if (!enabled || !isInitializedRef.current) return;

    try {
      const chatKey = STORAGE_KEYS.chatKey(sessionId);
      const metadataKey = STORAGE_KEYS.metadataKey(sessionId);
      
      await storageService.remove(chatKey);
      await storageService.remove(metadataKey);
      
      // Reset state
      setSaveCount(0);
      setLastSaved(null);
      lastMessagesRef.current = '';
      
      // Update storage usage
      const usage = await storageService.getStorageInfo();
      setStorageUsage({
        usage: usage.usage,
        quota: usage.quota,
        percentage: usage.percentage
      });
    } catch (err) {
      console.error('Failed to clear messages:', err);
      setError(err as Error);
    }
  }, [enabled, sessionId]);

  // Export messages as JSON
  const exportMessages = useCallback(async (): Promise<string> => {
    if (!enabled || !isInitializedRef.current) return '[]';

    try {
      const chatKey = STORAGE_KEYS.chatKey(sessionId);
      const persistedChat = await storageService.load<PersistedChat>(chatKey);
      
      if (!persistedChat) {
        return '[]';
      }

      return JSON.stringify(persistedChat, null, 2);
    } catch (err) {
      console.error('Failed to export messages:', err);
      setError(err as Error);
      return '[]';
    }
  }, [enabled, sessionId]);

  // Import messages from JSON
  const importMessages = useCallback(async (jsonData: string) => {
    if (!enabled || !isInitializedRef.current) return;

    try {
      const data = JSON.parse(jsonData);
      const validatedChat = chatPersistenceHelper.validatePersistedChat(data);
      
      if (!validatedChat) {
        throw new Error('Invalid chat data format');
      }

      // Save imported data
      const chatKey = STORAGE_KEYS.chatKey(sessionId);
      await storageService.save(chatKey, validatedChat);

      // Update metadata
      const metadata = chatPersistenceHelper.createStorageMetadata(
        storageService.getCurrentStrategy(),
        saveCount + 1
      );
      
      const metadataKey = STORAGE_KEYS.metadataKey(sessionId);
      await storageService.save(metadataKey, metadata);

      setSaveCount(saveCount + 1);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to import messages:', err);
      setError(err as Error);
      throw err;
    }
  }, [enabled, sessionId, saveCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    isSaving,
    lastSaved,
    saveCount,
    storageStrategy,
    storageUsage,
    error,
    saveMessages,
    loadMessages,
    clearMessages,
    exportMessages,
    importMessages
  };
}