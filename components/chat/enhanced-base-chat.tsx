'use client';

import { useChat, Message as AIMessage } from '@ai-sdk/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { ChatPersistence } from './chat-persistence';
import { ToolExecutionDisplay, ToolInvocation, ToolExecutionState, MultiStepToolExecution } from './tool-execution-display';
import { ErrorMessageDisplay, ChatError } from './error-message-display';
import { StreamingIndicator, MultiStepStreamingIndicator } from './streaming-indicator';
import { cn } from '@/lib/utils';

interface EnhancedBaseChatProps {
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  websiteId?: string;
}

// Extended message type to include tool invocations
interface EnhancedMessage extends Omit<AIMessage, 'toolInvocations'> {
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'result' | 'error' | 'partial-call';
    result?: unknown;
  }>;
  experimental_toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: 'result' | 'error' | 'partial-call';
    result?: unknown;
  }>;
}

export default function EnhancedBaseChat({ 
  initialMessage, 
  onInitialMessageSent,
  websiteId 
}: EnhancedBaseChatProps = {}) {
  const { 
    messages: rawMessages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    setMessages, 
    append,
    error 
  } = useChat({
    api: '/api/chat',
    body: websiteId ? { websiteId } : undefined,
  });
  
  const hasInitialized = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [toolExecutions, setToolExecutions] = useState<Map<string, ToolInvocation>>(new Map());
  const [chatErrors, setChatErrors] = useState<ChatError[]>([]);
  
  // Cast messages to enhanced type
  const messages = rawMessages as EnhancedMessage[];

  // Handle chat errors
  useEffect(() => {
    if (error) {
      const chatError: ChatError = {
        id: `error-${Date.now()}`,
        severity: 'error',
        message: 'Failed to process your request',
        details: error.message || 'An unexpected error occurred. Please try again.',
        timestamp: new Date(),
        retryable: true
      };
      setChatErrors(prev => [...prev, chatError]);
    }
  }, [error]);

  // Process tool invocations from messages
  useEffect(() => {
    const newExecutions = new Map<string, ToolInvocation>();
    
    messages.forEach((message) => {
      // Check both toolInvocations and experimental_toolInvocations
      const invocations = message.toolInvocations || message.experimental_toolInvocations || [];
      
      invocations.forEach((invocation) => {
        let state: ToolExecutionState = 'pending';
        
        if (invocation.state === 'result') {
          state = 'success';
        } else if (invocation.state === 'error') {
          state = 'error';
        } else if (invocation.state === 'partial-call') {
          state = 'executing';
        }
        
        const toolInv: ToolInvocation = {
          toolCallId: invocation.toolCallId,
          toolName: invocation.toolName,
          args: invocation.args,
          state,
          result: invocation.result,
          error: invocation.state === 'error' && typeof invocation.result === 'string' 
            ? invocation.result 
            : undefined,
          startTime: new Date(),
        };
        
        // Create error for failed tool executions
        if (invocation.state === 'error') {
          const toolError: ChatError = {
            id: `tool-error-${invocation.toolCallId}`,
            severity: 'error',
            message: `Tool execution failed: ${invocation.toolName}`,
            details: typeof invocation.result === 'string' ? invocation.result : 'Tool execution encountered an error',
            timestamp: new Date(),
            retryable: true,
            fieldErrors: typeof invocation.result === 'object' && invocation.result && 'fieldErrors' in invocation.result
              ? (invocation.result as any).fieldErrors
              : undefined
          };
          setChatErrors(prev => {
            const exists = prev.some(e => e.id === toolError.id);
            return exists ? prev : [...prev, toolError];
          });
        }
        
        if (state === 'success' || state === 'error') {
          toolInv.endTime = new Date();
        }
        
        newExecutions.set(invocation.toolCallId, toolInv);
      });
    });
    
    setToolExecutions(newExecutions);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, toolExecutions]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
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

  // Group consecutive tool invocations
  const processedMessages = useMemo(() => {
    const processed: Array<{
      type: 'message' | 'tools';
      content: EnhancedMessage | ToolInvocation[];
      id: string;
    }> = [];
    
    let currentTools: ToolInvocation[] = [];
    
    messages.forEach((message, index) => {
      const invocations = message.toolInvocations || message.experimental_toolInvocations || [];
      
      if (invocations.length > 0 && message.role === 'assistant') {
        // Collect tool invocations
        invocations.forEach((inv) => {
          const execution = toolExecutions.get(inv.toolCallId);
          if (execution) {
            currentTools.push(execution);
          }
        });
        
        // If this message has content, add tools then message
        if (message.content) {
          if (currentTools.length > 0) {
            processed.push({
              type: 'tools',
              content: [...currentTools],
              id: `tools-${index}`
            });
            currentTools = [];
          }
          processed.push({
            type: 'message',
            content: message,
            id: message.id
          });
        }
      } else {
        // Add any pending tools before non-tool message
        if (currentTools.length > 0) {
          processed.push({
            type: 'tools',
            content: [...currentTools],
            id: `tools-${index}`
          });
          currentTools = [];
        }
        
        // Add regular message
        if (message.content) {
          processed.push({
            type: 'message',
            content: message,
            id: message.id
          });
        }
      }
    });
    
    // Add any remaining tools
    if (currentTools.length > 0) {
      processed.push({
        type: 'tools',
        content: currentTools,
        id: `tools-end`
      });
    }
    
    return processed;
  }, [messages, toolExecutions]);

  return (
    <ChatPersistence
      messages={messages as AIMessage[]}
      setMessages={setMessages}
      sessionId="default"
    >
      <div className="h-full flex flex-col bg-gray-900 max-h-screen">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-700">
          <h3 className="flex items-center gap-2 text-white font-semibold">
            <Bot className="h-5 w-5 text-catalyst-orange" />
            AI Assistant {websiteId && <span className="text-xs text-gray-400">(Context: {websiteId})</span>}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Chat with our AI assistant - now with tool execution
          </p>
        </div>
        
        {/* Messages - Scrollable middle section */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 min-h-0">
              {processedMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Start a conversation by typing a message below
                </div>
              )}
              
              {/* Display errors at the top */}
              {chatErrors.length > 0 && (
                <div className="space-y-2 mb-4">
                  {chatErrors.map((error) => (
                    <ErrorMessageDisplay
                      key={error.id}
                      error={error}
                      onRetry={() => {
                        // Clear this error and retry last message
                        setChatErrors(prev => prev.filter(e => e.id !== error.id));
                        if (messages.length > 0) {
                          const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMessage) {
                            append({
                              role: 'user',
                              content: lastUserMessage.content
                            });
                          }
                        }
                      }}
                      onDismiss={() => {
                        setChatErrors(prev => prev.filter(e => e.id !== error.id));
                      }}
                    />
                  ))}
                </div>
              )}
              
              {processedMessages.map((item) => {
                if (item.type === 'tools') {
                  const tools = item.content as ToolInvocation[];
                  
                  // If we have multiple tools, show them as multi-step
                  if (tools.length > 1) {
                    return (
                      <div key={item.id} className="flex gap-3 justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-catalyst-orange" />
                          </div>
                          <MultiStepToolExecution
                            steps={tools}
                            currentStep={tools.filter(t => t.state !== 'pending').length}
                            totalSteps={tools.length}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    );
                  }
                  
                  // Single tool display
                  return (
                    <div key={item.id} className="space-y-2">
                      {tools.map((tool) => (
                        <div key={tool.toolCallId} className="flex gap-3 justify-start">
                          <div className="flex gap-3 max-w-[80%]">
                            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-catalyst-orange" />
                            </div>
                            <ToolExecutionDisplay
                              invocation={tool}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                
                const message = item.content as EnhancedMessage;
                return (
                  <div
                    key={item.id}
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
                        className={cn(
                          'rounded-lg px-3 py-2 break-words',
                          message.role === 'user'
                            ? 'bg-catalyst-orange text-white'
                            : 'bg-gray-800 text-gray-100'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-catalyst-orange" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-gray-800">
                      <StreamingIndicator 
                        type={toolExecutions.size > 0 ? 'tool' : 'thinking'}
                        message={toolExecutions.size > 0 ? 'Executing tools...' : undefined}
                      />
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
              placeholder="Type your message... (Tools will be automatically used when needed)"
              disabled={isLoading}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              aria-label="Chat input"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-catalyst-orange hover:bg-catalyst-orange/80 text-white"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </ChatPersistence>
  );
}