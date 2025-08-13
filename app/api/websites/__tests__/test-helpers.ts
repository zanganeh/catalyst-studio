/**
 * Test setup for Next.js API routes
 * Provides mock implementations for Next.js server components
 */

// Mock NextRequest for tests
export class MockNextRequest {
  private body: Record<string, unknown>;
  private _url: string;
  
  constructor(url: string, init?: { body?: Record<string, unknown>; method?: string }) {
    this._url = url;
    this.body = init?.body;
  }
  
  async json() {
    return this.body;
  }
  
  get url() {
    return this._url;
  }
}

// Create test request helper
export function createTestRequest(body?: Record<string, unknown>, url = 'http://localhost:3000/api/websites') {
  return new MockNextRequest(url, { body }) as unknown as Request;
}

// Parse test response
export async function parseTestResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}