import { NextRequest, NextResponse } from 'next/server';

// Paths to bypass middleware completely
const BYPASS_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/static',
  '/images',
  '/fonts',
  '/public',
  '/dashboard',
  '/demo',
  '/studio',
  '/content',
  '/overview',
  '/preview'
];

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Bypass middleware for static assets, API routes, and known app routes
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Get website ID from environment or default
    const websiteId = process.env.DEFAULT_WEBSITE_ID || 'default-website-id';
    
    // For URL resolution, we'll let the catch-all route handle it
    // The catch-all route ([...slug]/page.tsx) will:
    // 1. Try to resolve the URL using urlResolver
    // 2. Check for redirects if not found
    // 3. Return 404 if neither exists
    
    // Add tracking headers
    const response = NextResponse.next();
    response.headers.set('x-request-path', pathname);
    response.headers.set('x-website-id', websiteId);
    
    const duration = Date.now() - startTime;
    response.headers.set('x-middleware-time', duration.toString());
    
    // Log middleware processing
    console.log(`Middleware processed ${pathname} in ${duration}ms`);
    
    return response;

  } catch (error) {
    console.error(`Middleware error for ${pathname}:`, error);
    
    // Don't block the request on middleware errors
    return NextResponse.next();
  }
}

export const config = {
  // Match all paths except static assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};