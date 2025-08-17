import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generates a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Gets or creates a CSRF token for the current session
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_COOKIE);
  
  if (existingToken?.value) {
    return existingToken.value;
  }
  
  const newToken = generateCSRFToken();
  
  // Set the token in a cookie
  cookieStore.set(CSRF_TOKEN_COOKIE, newToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return newToken;
}

/**
 * Validates CSRF token from request
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return true;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // Check header token
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  // For JSON requests, check the header
  if (request.headers.get('content-type')?.includes('application/json')) {
    return headerToken === cookieToken;
  }
  
  // For form submissions, could also check body
  // But for API routes, we'll primarily use header validation
  return headerToken === cookieToken;
}

/**
 * CSRF protection middleware for API routes
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler(request);
  }
  
  const isValid = await validateCSRFToken(request);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  return handler(request);
}

/**
 * Hook to get CSRF token on client side
 */
export function useCSRFToken(): { token: string | null; getToken: () => Promise<string> } {
  if (typeof window === 'undefined') {
    return { token: null, getToken: async () => '' };
  }
  
  const getToken = async (): Promise<string> => {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.token;
  };
  
  // Get token from cookie if available
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(CSRF_TOKEN_COOKIE))
    ?.split('=')[1] || null;
  
  return { token, getToken };
}