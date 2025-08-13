'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { ChatPersistence } from './chat-persistence';

interface BaseChatProps {
  initialMessage?: string;
  onInitialMessageSent?: () => void;
}

export default function BaseChat({ initialMessage, onInitialMessageSent }: BaseChatProps = {}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat();
  const hasInitialized = useRef(false);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      // Append the initial message as a user message
      append({
        role: 'user',
        content: initialMessage
      }).then(() => {
        if (onInitialMessageSent) {
          onInitialMessageSent();
        }
      });
    }
  }, [initialMessage, messages.length, append, onInitialMessageSent]);

  return (
    <ChatPersistence
      messages={messages}
      setMessages={setMessages}
      sessionId="default"
    >
      <div className="h-full flex flex-col bg-gray-900 max-h-screen">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-white font-semibold">
            <Bot className="h-5 w-5 text-catalyst-orange" />
            AI Assistant
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Chat with our AI assistant
          </p>
        </div>
        
        {/* Messages - Scrollable middle section */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Start a conversation by typing a message below
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="h-8 w-8 rounded-full bg-catalyst-orange flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-catalyst-orange" />
                        </div>
                      )}
                    </div>
                    
                    <div
                      className={`rounded-lg px-3 py-2 break-words ${
                        message.role === 'user'
                          ? 'bg-catalyst-orange text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-catalyst-orange" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-gray-800">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-catalyst-orange hover:bg-catalyst-orange/80 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </ChatPersistence>
  );
}