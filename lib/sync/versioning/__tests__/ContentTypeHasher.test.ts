import { ContentTypeHasher } from '../ContentTypeHasher';

describe('ContentTypeHasher', () => {
  let hasher: ContentTypeHasher;

  beforeEach(() => {
    hasher = new ContentTypeHasher();
  });

  describe('calculateHash', () => {
    it('should generate consistent 64-character SHA-256 hash', () => {
      const contentType = { 
        key: 'blog', 
        name: 'Blog Post', 
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richtext', required: true }
        ] 
      };
      
      const hash = hasher.calculateHash(contentType);
      
      // SHA-256 produces 64 hex chars
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Should be deterministic
      expect(hasher.calculateHash(contentType)).toBe(hash);
    });

    it('should exclude volatile fields from hash', () => {
      const type1 = { 
        key: 'blog', 
        name: 'Blog', 
        id: 1, 
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        _id: 'abc123',
        timestamp: Date.now()
      };
      
      const type2 = { 
        key: 'blog', 
        name: 'Blog', 
        id: 2, 
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-02'),
        _id: 'xyz789',
        timestamp: Date.now() + 1000
      };
      
      // Should produce same hash despite different volatile fields
      expect(hasher.calculateHash(type1)).toBe(hasher.calculateHash(type2));
    });

    it('should produce different hashes for different content', () => {
      const type1 = { key: 'blog', name: 'Blog Post' };
      const type2 = { key: 'blog', name: 'Blog Article' };
      
      expect(hasher.calculateHash(type1)).not.toBe(hasher.calculateHash(type2));
    });

    it('should handle nested objects consistently', () => {
      const contentType = {
        key: 'product',
        name: 'Product',
        fields: [
          {
            name: 'specifications',
            type: 'object',
            properties: {
              weight: { type: 'number' },
              dimensions: {
                width: 10,
                height: 20,
                depth: 30
              }
            }
          }
        ]
      };

      const hash1 = hasher.calculateHash(contentType);
      const hash2 = hasher.calculateHash(contentType);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle arrays consistently', () => {
      const type1 = {
        key: 'gallery',
        name: 'Gallery',
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg']
      };

      const hash = hasher.calculateHash(type1);
      
      // Same array should produce same hash
      expect(hasher.calculateHash(type1)).toBe(hash);
    });

    it('should sort object keys for deterministic hashing', () => {
      const type1 = {
        key: 'test',
        name: 'Test',
        fieldA: 'value1',
        fieldB: 'value2',
        fieldC: 'value3'
      };

      const type2 = {
        fieldC: 'value3',
        fieldB: 'value2',
        key: 'test',
        fieldA: 'value1',
        name: 'Test'
      };

      // Different key order should produce same hash
      expect(hasher.calculateHash(type1)).toBe(hasher.calculateHash(type2));
    });

    it('should handle null and undefined values', () => {
      const type1 = {
        key: 'test',
        name: 'Test',
        optional: null,
        missing: undefined
      };

      const type2 = {
        key: 'test',
        name: 'Test',
        optional: null,
        missing: undefined
      };

      expect(hasher.calculateHash(type1)).toBe(hasher.calculateHash(type2));
    });

    it('should meet performance benchmark (<10ms)', () => {
      const contentType = { 
        key: 'blog', 
        name: 'Blog Post',
        fields: Array(20).fill({ name: 'field', type: 'string' }) // Typical size
      };
      
      const startTime = performance.now();
      hasher.calculateHash(contentType);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle deeply nested structures', () => {
      const contentType = {
        key: 'complex',
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      const hash = hasher.calculateHash(contentType);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hasher.calculateHash(contentType)).toBe(hash);
    });

    it('should handle mixed data types', () => {
      const contentType = {
        key: 'mixed',
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
        date: '2024-01-01T00:00:00Z'
      };

      const hash = hasher.calculateHash(contentType);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hasher.calculateHash(contentType)).toBe(hash);
    });
  });
});