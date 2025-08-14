import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, Message } from 'ai';
import { allTools } from '@/lib/ai-tools/tools';
import { loadWebsiteContext, generateSystemPrompt } from '@/lib/ai-tools/context/context-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, websiteId }: { messages: Message[]; websiteId?: string } = await req.json();

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || ''
  });  

  // Type assertion to resolve version mismatch between OpenRouter and AI SDK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = openrouter(process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet') as any;

  // Load context if websiteId is provided
  let system: string | undefined;
  try {
    if (websiteId) {
      const context = await loadWebsiteContext(websiteId);
      system = generateSystemPrompt(context);
    }
  } catch (error) {
    console.error('Failed to load website context:', error);
    // Continue without context rather than failing the request
  }

  const result = streamText({
    model,
    messages,
    system,
    tools: allTools,
    toolChoice: 'auto',
    maxSteps: 5,
    onStepFinish: async (event) => {
      // Optional: Log tool executions for debugging
      if (event.toolCalls && event.toolCalls.length > 0) {
        console.log('Tool executed:', {
          tools: event.toolCalls.map(call => ({
            name: call.toolName,
            args: call.args
          })),
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  return result.toDataStreamResponse();
}