import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatPersistence } from '../use-chat-persistence';
import { storageService } from '@/lib/storage/storage-service';
import { Message } from 'ai';

// Mock the storage service
jest.mock('@/lib/storage/storage-service', () => ({
  storageService: {
    initialize: jest.fn(),
    save: jest.fn(),
    load: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    getStorageInfo: jest.fn(),
    getCurrentStrategy: jest.fn()
  }
}));

describe('useChatPersistence', () => {
  const mockSessionId = 'test-session';
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      createdAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      createdAt: new Date('2024-01-01T10:00:01Z')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (storageService.initialize as jest.Mock).mockResolvedValue(undefined);
    (storageService.getCurrentStrategy as jest.Mock).mockReturnValue('LocalStorage');
    (storageService.getStorageInfo as jest.Mock).mockResolvedValue({
      currentStrategy: 'LocalStorage',
      usage: 1000,
      quota: 10000000,
      percentage: 0.01
    });
  });

  describe('initialization', () => {
    test('should initialize storage service when enabled', async () => {
      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await waitFor(() => {
        expect(storageService.initialize).toHaveBeenCalled();
      });

      expect(result.current.storageStrategy).toBe('LocalStorage');
    });

    test('should not initialize when disabled', () => {
      renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: false
        })
      );

      expect(storageService.initialize).not.toHaveBeenCalled();
    });

    test('should load existing metadata on initialization', async () => {
      const mockMetadata = {
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
        saveCount: 5,
        strategy: 'LocalStorage'
      };

      (storageService.load as jest.Mock).mockResolvedValue(mockMetadata);

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.saveCount).toBe(5);
      });
    });
  });

  describe('saveMessages', () => {
    test('should save messages with debouncing', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          autoSaveDelay: 500
        })
      );

      await act(async () => {
        await result.current.saveMessages(mockMessages);
      });

      // Should not save immediately
      expect(storageService.save).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(storageService.save).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    test('should not save duplicate messages', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          autoSaveDelay: 500
        })
      );

      // Save same messages twice
      await act(async () => {
        await result.current.saveMessages(mockMessages);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await act(async () => {
        await result.current.saveMessages(mockMessages);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only save once
      await waitFor(() => {
        expect(storageService.save).toHaveBeenCalledTimes(2); // Once for chat, once for metadata
      });

      jest.useRealTimers();
    });

    test('should handle save errors gracefully', async () => {
      jest.useFakeTimers();

      const mockError = new Error('Storage failed');
      (storageService.save as jest.Mock).mockRejectedValue(mockError);

      const onSaveError = jest.fn();

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          autoSaveDelay: 500,
          onSaveError
        })
      );

      await act(async () => {
        await result.current.saveMessages(mockMessages);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(onSaveError).toHaveBeenCalledWith(mockError);
        expect(result.current.error).toEqual(mockError);
      });

      jest.useRealTimers();
    });

    test('should fallback to reduced data on quota exceeded', async () => {
      jest.useFakeTimers();

      const quotaError = new Error('LocalStorage quota exceeded');
      (storageService.save as jest.Mock)
        .mockRejectedValueOnce(quotaError)
        .mockResolvedValueOnce(undefined);

      // Create many messages
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        createdAt: new Date()
      })) as Message[];

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          autoSaveDelay: 500
        })
      );

      await act(async () => {
        await result.current.saveMessages(manyMessages);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        // Should attempt save twice (original + fallback)
        expect(storageService.save).toHaveBeenCalledTimes(2);
      });

      // Check that second save has reduced messages
      const secondSaveCall = (storageService.save as jest.Mock).mock.calls[1];
      const savedData = secondSaveCall[1];
      expect(savedData.messages.length).toBe(50); // Only last 50 messages

      jest.useRealTimers();
    });
  });

  describe('loadMessages', () => {
    test('should load and validate messages', async () => {
      const mockPersistedChat = {
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Loaded message',
            timestamp: new Date().toISOString()
          }
        ],
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          sessionId: mockSessionId
        }
      };

      (storageService.load as jest.Mock).mockResolvedValue(mockPersistedChat);

      const onLoadComplete = jest.fn();

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          onLoadComplete
        })
      );

      let loadedMessages;
      await act(async () => {
        loadedMessages = await result.current.loadMessages();
      });

      expect(loadedMessages).toEqual(mockPersistedChat.messages);
      expect(onLoadComplete).toHaveBeenCalledWith(mockPersistedChat.messages);
    });

    test('should handle load errors', async () => {
      const mockError = new Error('Load failed');
      (storageService.load as jest.Mock).mockRejectedValue(mockError);

      const onLoadError = jest.fn();

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          onLoadError
        })
      );

      let loadedMessages;
      await act(async () => {
        loadedMessages = await result.current.loadMessages();
      });

      expect(loadedMessages).toEqual([]);
      expect(onLoadError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toEqual(mockError);
    });

    test('should return empty array when no data exists', async () => {
      (storageService.load as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      let loadedMessages;
      await act(async () => {
        loadedMessages = await result.current.loadMessages();
      });

      expect(loadedMessages).toEqual([]);
    });
  });

  describe('clearMessages', () => {
    test('should clear chat and metadata', async () => {
      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await act(async () => {
        await result.current.clearMessages();
      });

      expect(storageService.remove).toHaveBeenCalledWith(`catalyst:chat:${mockSessionId}`);
      expect(storageService.remove).toHaveBeenCalledWith(`catalyst:metadata:${mockSessionId}`);
      expect(result.current.saveCount).toBe(0);
      expect(result.current.lastSaved).toBeNull();
    });
  });

  describe('export/import', () => {
    test('should export messages as JSON', async () => {
      const mockPersistedChat = {
        messages: mockMessages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt?.toISOString()
        })),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          sessionId: mockSessionId
        }
      };

      (storageService.load as jest.Mock).mockResolvedValue(mockPersistedChat);

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      let exportedData;
      await act(async () => {
        exportedData = await result.current.exportMessages();
      });

      const parsed = JSON.parse(exportedData);
      expect(parsed).toEqual(mockPersistedChat);
    });

    test('should import messages from JSON', async () => {
      const importData = {
        messages: [
          {
            id: 'imported-1',
            role: 'user',
            content: 'Imported message',
            timestamp: new Date().toISOString()
          }
        ],
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        metadata: {
          sessionId: mockSessionId
        }
      };

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await act(async () => {
        await result.current.importMessages(JSON.stringify(importData));
      });

      expect(storageService.save).toHaveBeenCalledWith(
        `catalyst:chat:${mockSessionId}`,
        importData
      );
    });

    test('should reject invalid import data', async () => {
      const invalidData = '{ invalid json';

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await expect(
        act(async () => {
          await result.current.importMessages(invalidData);
        })
      ).rejects.toThrow();
    });
  });

  describe('storage info', () => {
    test('should track storage usage', async () => {
      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.storageUsage).toEqual({
          usage: 1000,
          quota: 10000000,
          percentage: 0.01
        });
      });
    });

    test('should update storage usage after save', async () => {
      jest.useFakeTimers();

      const initialInfo = {
        currentStrategy: 'LocalStorage',
        usage: 1000,
        quota: 10000000,
        percentage: 0.01
      };

      const updatedInfo = {
        currentStrategy: 'LocalStorage',
        usage: 2000,
        quota: 10000000,
        percentage: 0.02
      };

      (storageService.getStorageInfo as jest.Mock)
        .mockResolvedValueOnce(initialInfo)
        .mockResolvedValueOnce(updatedInfo);

      const { result } = renderHook(() => 
        useChatPersistence({
          sessionId: mockSessionId,
          enabled: true,
          autoSaveDelay: 500
        })
      );

      await act(async () => {
        await result.current.saveMessages(mockMessages);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.storageUsage?.usage).toBe(2000);
      });

      jest.useRealTimers();
    });
  });
});