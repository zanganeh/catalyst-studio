import { NextRequest, NextResponse } from 'next/server';
import { urlResolver } from '@/lib/services/url-resolution/url-resolver';
import { prisma } from '@/lib/prisma';

// Paths to bypass middleware
const BYPASS_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/static',
  '/images',
  '/fonts',
  '/public'
];

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Bypass middleware for static assets and API routes
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Get website ID from environment or default
    const websiteId = process.env.DEFAULT_WEBSITE_ID || 'default-website-id';

    // Resolve URL
    const resolutionResult = await urlResolver.resolveUrl(pathname, {
      websiteId,
      caseInsensitive: process.env.URL_CASE_INSENSITIVE === 'true'
    });

    if (!resolutionResult.success) {
      // Log validation errors
      console.error(`URL validation failed for ${pathname}:`, resolutionResult.error);
      
      // Return 400 for validation errors
      return NextResponse.json(
        { error: resolutionResult.error },
        { status: 400 }
      );
    }

    const resolvedPage = resolutionResult.data;

    // Check for redirects if page not found
    if (!resolvedPage) {
      try {
        // Check for redirects
        const redirect = await prisma.redirect.findFirst({
          where: {
            websiteId,
            sourcePath: pathname,
            isActive: true
          }
        });

        if (redirect) {
          // Handle redirect chains (max 3 hops)
          let currentPath = redirect.targetPath;
          let hops = 1;
          const maxHops = 3;
          const visitedPaths = new Set([pathname]);

          while (hops < maxHops) {
            // Prevent infinite loops
            if (visitedPaths.has(currentPath)) {
              console.error(`Redirect loop detected: ${pathname} -> ${currentPath}`);
              break;
            }
            visitedPaths.add(currentPath);

            const nextRedirect = await prisma.redirect.findFirst({
              where: {
                websiteId,
                sourcePath: currentPath,
                isActive: true
              }
            });

            if (!nextRedirect) {
              // End of redirect chain
              break;
            }

            currentPath = nextRedirect.targetPath;
            hops++;
          }

          // Log redirect for monitoring
          console.log(`Redirect: ${pathname} -> ${currentPath} (${redirect.redirectType}) [${hops} hop(s)]`);

          // Return redirect response
          return NextResponse.redirect(
            new URL(currentPath, request.url),
            redirect.redirectType as 301 | 302
          );
        }

        // No redirect found, will return 404
        // Log 404 for monitoring
        console.log(`404 Not Found: ${pathname} (hard 404)`);
        
        // Let the 404 page handle this
        const response = NextResponse.next();
        response.headers.set('x-404-type', 'hard');
        response.headers.set('x-404-path', pathname);
        return response;

      } catch (error) {
        console.error(`Error checking redirects for ${pathname}:`, error);
        // Continue to 404 handling even if redirect check fails
      }
    }

    // Page found
    if (resolvedPage) {
      // Check if page is published (soft 404)
      if (!resolvedPage.siteStructure.isActive) {
        console.log(`404 Not Found: ${pathname} (soft 404 - unpublished)`);
        
        const response = NextResponse.next();
        response.headers.set('x-404-type', 'soft');
        response.headers.set('x-404-path', pathname);
        response.headers.set('x-page-id', resolvedPage.siteStructure.id);
        return response;
      }

      // Add resolved page data to headers for route handlers
      const response = NextResponse.next();
      response.headers.set('x-page-id', resolvedPage.siteStructure.id);
      response.headers.set('x-content-id', resolvedPage.contentItem?.id || '');
      response.headers.set('x-page-path', resolvedPage.siteStructure.fullPath);
      
      const duration = Date.now() - startTime;
      response.headers.set('x-resolution-time', duration.toString());
      
      console.log(`Page resolved in ${duration}ms: ${pathname}`);
      
      return response;
    }

    // Should not reach here, but handle as 404 if it does
    return NextResponse.next();

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