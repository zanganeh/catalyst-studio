export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    temperature?: number;
  };
}

export interface AIMetadata {
  model?: string;
  tokens?: number;
  temperature?: number;
  maxTokens?: number;
  totalMessages?: number;
}

export interface AIContext {
  id: string;
  websiteId: string;
  sessionId: string;
  messages: AIMessage[];
  metadata?: AIMetadata;
  summary?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIContextInput {
  websiteId: string;
  sessionId?: string;
  initialMessage?: AIMessage;
}

export interface UpdateAIContextInput {
  messages?: AIMessage[];
  metadata?: AIMetadata;
  summary?: string;
  isActive?: boolean;
}

export interface AppendMessageInput {
  message: AIMessage;
  pruneIfNeeded?: boolean;
}