// Security utilities for content management

/**
 * Validates and sanitizes image URLs
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Check protocol (only allow http/https)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn('Invalid image URL protocol:', parsed.protocol);
      return null;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      'javascript:',
      'data:text/html',
      'vbscript:',
      'file:',
      'about:',
    ];
    
    const lowerUrl = url.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (lowerUrl.includes(pattern)) {
        console.warn('Suspicious pattern in URL:', pattern);
        return null;
      }
    }
    
    // Check file extension (optional)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => 
      parsed.pathname.toLowerCase().endsWith(ext)
    );
    
    // Allow URLs without extensions (many CDNs don't use them)
    // but log for monitoring
    if (!hasImageExtension && !parsed.pathname.includes('/api/')) {
      console.info('Image URL without standard extension:', url);
    }
    
    return url;
  } catch (error) {
    console.error('Invalid URL:', url, error);
    return null;
  }
}

/**
 * Content Security Policy headers for images
 */
export const imageCSPHeaders = {
  'Content-Security-Policy': "img-src 'self' https: data: blob:;",
};

/**
 * Sanitizes rich text content to prevent XSS
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  
  // Basic sanitization - in production, use DOMPurify
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  
  // Allow only safe tags
  const safeTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'];
  const safeAttrs = ['href', 'title', 'target'];
  
  // This is a simplified version - use DOMPurify in production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validates form data before submission
 */
export function validateFormData(data: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Check for script tags or event handlers
      if (value.includes('<script') || /on\w+\s*=/.test(value)) {
        console.warn('Potentially malicious content detected in field:', key);
        return false;
      }
    }
  }
  return true;
}