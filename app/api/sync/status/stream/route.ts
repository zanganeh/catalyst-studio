import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Send initial connection message
  await writer.write(encoder.encode('data: {"type":"connected"}\n\n'));
  
  // Setup heartbeat to keep connection alive
  const heartbeat = setInterval(async () => {
    try {
      await writer.write(encoder.encode(': heartbeat\n\n'));
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 30000);
  
  // Simulate status updates (in production, this would connect to actual sync engine)
  let progress = 0;
  const statusInterval = setInterval(async () => {
    try {
      if (progress >= 100) {
        const completedStatus = {
          status: 'completed',
          progress: 100,
          currentStep: 'Sync completed',
          totalSteps: 5,
          completedAt: new Date().toISOString()
        };
        await writer.write(encoder.encode(`data: ${JSON.stringify(completedStatus)}\n\n`));
        clearInterval(statusInterval);
        clearInterval(heartbeat);
        await writer.close();
        return;
      }
      
      progress += 20;
      const status = {
        status: 'in_progress',
        progress,
        currentStep: `Step ${Math.ceil(progress / 20)} of 5`,
        totalSteps: 5,
        startedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + (100 - progress) * 100).toISOString()
      };
      
      await writer.write(encoder.encode(`data: ${JSON.stringify(status)}\n\n`));
    } catch (error) {
      clearInterval(statusInterval);
      clearInterval(heartbeat);
    }
  }, 2000);
  
  // Cleanup on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(statusInterval);
    clearInterval(heartbeat);
    writer.close();
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}