import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, Message } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || ''
  });  

  // Type assertion to resolve version mismatch between OpenRouter and AI SDK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = openrouter(process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet') as any;

  const result = streamText({
    model,
    messages,
  });

  return result.toDataStreamResponse();
}