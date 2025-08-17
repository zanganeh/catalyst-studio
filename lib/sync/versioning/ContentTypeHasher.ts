import { createHash } from 'crypto';

export class ContentTypeHasher {
  /**
   * Calculate SHA-256 hash for a content type
   * @param contentType - The content type object to hash
   * @returns 64-character hexadecimal hash string
   */
  calculateHash(contentType: any): string {
    // Normalize the content type to ensure deterministic hashing
    const normalized = this.normalize(contentType);
    
    // Create SHA-256 hash
    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  /**
   * Normalize content type by removing volatile fields and sorting keys
   * @param contentType - The content type to normalize
   * @returns Normalized content type object
   */
  private normalize(contentType: any): any {
    // Remove volatile fields that shouldn't affect the hash
    const {
      id,
      createdAt,
      updatedAt,
      _id,
      _createdAt,
      _updatedAt,
      lastModified,
      timestamp,
      ...stable
    } = contentType;

    // Sort object keys deterministically
    return this.sortObjectKeys(stable);
  }

  /**
   * Recursively sort object keys to ensure deterministic JSON stringification
   * @param obj - Object to sort
   * @returns Object with sorted keys
   */
  private sortObjectKeys(obj: any): any {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    // Handle non-objects
    if (typeof obj !== 'object') {
      return obj;
    }

    // Sort object keys
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};

    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }

    return sortedObj;
  }
}