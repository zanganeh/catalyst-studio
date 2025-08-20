/**
 * Media Fallback Handler
 * Handles conversion of media types to fallback formats
 */

import { PrimitiveType, JsonPrimitive } from '../../types/primitives';
import { MediaPattern } from '../../types/common-patterns';

/**
 * Media fallback result
 */
export interface MediaFallbackResult {
  data: any;
  format: 'url' | 'json' | 'reference';
  metadata: {
    originalType: string;
    preservedFields: string[];
    lostFields: string[];
    requiresUpload: boolean;
  };
  confidence: number;
}

/**
 * Media data structure
 */
export interface MediaData {
  url: string;
  alt?: string;
  caption?: string;
  title?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // For videos
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Media fallback handler
 */
export class MediaFallbackHandler {
  /**
   * Convert media to URL string
   */
  static toUrlString(value: any, pattern: MediaPattern): MediaFallbackResult {
    let url = '';
    const preservedFields: string[] = ['url'];
    const lostFields: string[] = [];

    if (typeof value === 'string') {
      url = value;
    } else if (typeof value === 'object' && value !== null) {
      if (pattern.multiple && Array.isArray(value)) {
        // Multiple media items - take first URL
        const firstItem = value[0];
        if (firstItem) {
          url = this.extractUrl(firstItem);
          lostFields.push('additional media items');
        }
      } else {
        url = this.extractUrl(value);
        
        // Track lost metadata
        const mediaFields = ['alt', 'caption', 'title', 'mimeType', 'size', 'width', 'height'];
        mediaFields.forEach(field => {
          if (value[field]) {
            lostFields.push(field);
          }
        });
      }
    }

    return {
      data: url,
      format: 'url',
      metadata: {
        originalType: pattern.mediaType || 'any',
        preservedFields,
        lostFields,
        requiresUpload: false
      },
      confidence: lostFields.length > 0 ? 60 : 85
    };
  }

  /**
   * Preserve media metadata in JSON
   */
  static toJson(value: any, pattern: MediaPattern): MediaFallbackResult {
    let data: any;
    const preservedFields: string[] = [];
    const lostFields: string[] = [];

    if (typeof value === 'string') {
      // Convert URL to media object
      data = {
        url: value,
        type: pattern.mediaType || 'file'
      };
      preservedFields.push('url');
    } else if (typeof value === 'object' && value !== null) {
      if (pattern.multiple && Array.isArray(value)) {
        data = value.map(item => this.normalizeMediaObject(item, pattern));
        preservedFields.push('all items', 'metadata');
      } else {
        data = this.normalizeMediaObject(value, pattern);
        preservedFields.push(...Object.keys(data));
      }
    } else {
      data = { error: 'Invalid media data' };
      lostFields.push('all data');
    }

    return {
      data,
      format: 'json',
      metadata: {
        originalType: pattern.mediaType || 'any',
        preservedFields,
        lostFields,
        requiresUpload: false
      },
      confidence: 95
    };
  }

  /**
   * Handle alternative text preservation
   */
  static preserveAltText(value: any, pattern: MediaPattern): string {
    if (typeof value === 'string') return '';
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Multiple media - combine alt texts
        return value
          .map(item => item.alt || item.alternativeText || '')
          .filter(alt => alt)
          .join('; ');
      }
      return value.alt || value.alternativeText || value.description || '';
    }
    
    return '';
  }

  /**
   * Create reference-based fallback
   */
  static toReference(value: any, pattern: MediaPattern): MediaFallbackResult {
    const references: any[] = [];
    const preservedFields: string[] = [];
    const lostFields: string[] = [];

    if (typeof value === 'string') {
      references.push({
        type: 'external',
        url: value,
        id: this.generateId(value)
      });
      preservedFields.push('url');
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          references.push(this.createReference(item, pattern));
        });
        preservedFields.push('all references');
      } else {
        references.push(this.createReference(value, pattern));
        preservedFields.push('reference');
      }
    }

    // Check for platform-specific fields that might be lost
    if (pattern.metadata) {
      Object.keys(pattern.metadata).forEach(field => {
        if (!preservedFields.includes(field)) {
          lostFields.push(field);
        }
      });
    }

    return {
      data: pattern.multiple ? references : references[0],
      format: 'reference',
      metadata: {
        originalType: pattern.mediaType || 'any',
        preservedFields,
        lostFields,
        requiresUpload: true // References typically need platform upload
      },
      confidence: 80
    };
  }

  /**
   * Private helper methods
   */

  private static extractUrl(obj: any): string {
    if (typeof obj === 'string') return obj;
    
    // Try common URL field names
    const urlFields = ['url', 'src', 'href', 'path', 'uri', 'location'];
    for (const field of urlFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }

    // Try nested structures
    if (obj.file?.url) return obj.file.url;
    if (obj.asset?.url) return obj.asset.url;
    if (obj.media?.url) return obj.media.url;
    
    return '';
  }

  private static normalizeMediaObject(obj: any, pattern: MediaPattern): MediaData {
    if (typeof obj === 'string') {
      return {
        url: obj
      };
    }

    const normalized: MediaData = {
      url: this.extractUrl(obj) || ''
    };

    // Map common fields
    if (obj.alt || obj.alternativeText) {
      normalized.alt = obj.alt || obj.alternativeText;
    }
    if (obj.caption || obj.description) {
      normalized.caption = obj.caption || obj.description;
    }
    if (obj.title || obj.name) {
      normalized.title = obj.title || obj.name;
    }
    if (obj.mimeType || obj.contentType || obj.type) {
      normalized.mimeType = obj.mimeType || obj.contentType || obj.type;
    }
    if (obj.size || obj.fileSize || obj.bytes) {
      normalized.size = obj.size || obj.fileSize || obj.bytes;
    }

    // Dimensions for images/videos
    if (obj.width) normalized.width = obj.width;
    if (obj.height) normalized.height = obj.height;
    if (obj.duration) normalized.duration = obj.duration;

    // Thumbnail
    if (obj.thumbnailUrl || obj.thumbnail || obj.preview) {
      normalized.thumbnailUrl = this.extractUrl(obj.thumbnailUrl || obj.thumbnail || obj.preview);
    }

    // Preserve additional metadata
    const knownFields = new Set(['url', 'alt', 'caption', 'title', 'mimeType', 'size', 
                                 'width', 'height', 'duration', 'thumbnailUrl']);
    const additionalMetadata: Record<string, any> = {};
    
    Object.keys(obj).forEach(key => {
      if (!knownFields.has(key) && !key.startsWith('_')) {
        additionalMetadata[key] = obj[key];
      }
    });

    if (Object.keys(additionalMetadata).length > 0) {
      normalized.metadata = additionalMetadata;
    }

    // Apply pattern constraints
    if (pattern.mediaType && pattern.mediaType !== 'any') {
      normalized.mimeType = this.inferMimeType(normalized.url, pattern.mediaType) || normalized.mimeType;
    }

    return normalized;
  }

  private static createReference(obj: any, pattern: MediaPattern): any {
    const url = this.extractUrl(obj);
    const id = obj.id || obj._id || this.generateId(url);
    
    return {
      id,
      type: pattern.mediaType || this.inferMediaType(obj) || 'file',
      url,
      metadata: this.normalizeMediaObject(obj, pattern)
    };
  }

  private static generateId(url: string): string {
    // Simple hash function for generating IDs from URLs
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `media_${Math.abs(hash)}`;
  }

  private static inferMediaType(obj: any): string | null {
    const mimeType = obj.mimeType || obj.contentType || obj.type;
    
    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      return 'file';
    }

    const url = this.extractUrl(obj);
    if (url) {
      const ext = url.split('.').pop()?.toLowerCase();
      if (ext) {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio';
      }
    }

    return null;
  }

  private static inferMimeType(url: string, mediaType: string): string | null {
    const ext = url.split('.').pop()?.toLowerCase();
    
    if (!ext) return null;

    const mimeMap: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'aac': 'audio/aac',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    return mimeMap[ext] || `application/${ext}`;
  }
}