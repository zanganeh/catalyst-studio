import { SyncSnapshot } from '../SyncSnapshot';

describe('SyncSnapshot', () => {
  let syncSnapshot: SyncSnapshot;
  
  beforeEach(() => {
    syncSnapshot = new SyncSnapshot();
  });
  
  describe('captureSnapshot', () => {
    it('should capture snapshot without compression for small data', async () => {
      const smallData = { key: 'test', value: 'small data' };
      
      const snapshot = await syncSnapshot.captureSnapshot(smallData);
      const parsed = JSON.parse(snapshot);
      
      expect(parsed.isCompressed).toBe(false);
      expect(parsed.data).toBe(JSON.stringify(smallData));
      expect(parsed.checksum).toBeDefined();
      expect(parsed.originalSize).toBeLessThan(100000); // Below compression threshold
      expect(parsed.timestamp).toBeDefined();
    });
    
    it('should compress large data', async () => {
      // Create data larger than 100KB
      const largeData = {
        items: Array(5000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a long description for item ${i} that helps make the data larger`,
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3']
          }
        }))
      };
      
      const snapshot = await syncSnapshot.captureSnapshot(largeData);
      const parsed = JSON.parse(snapshot);
      
      expect(parsed.isCompressed).toBe(true);
      expect(parsed.data).not.toBe(JSON.stringify(largeData)); // Should be base64 compressed
      expect(parsed.checksum).toBeDefined();
      expect(parsed.originalSize).toBeGreaterThan(100000); // Above compression threshold
      
      // Compressed data should be smaller than original
      const compressedSize = Buffer.from(parsed.data, 'base64').length;
      expect(compressedSize).toBeLessThan(parsed.originalSize);
    });
    
    it('should throw error if data exceeds maximum size', async () => {
      // Create data larger than 10MB (max size)
      const hugeData = {
        items: Array(500000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Very long description repeated many times: ${Array(100).fill('x').join('')}`
        }))
      };
      
      await expect(syncSnapshot.captureSnapshot(hugeData)).rejects.toThrow(
        /exceeds maximum allowed size/
      );
    });
  });
  
  describe('restoreSnapshot', () => {
    it('should restore uncompressed snapshot', async () => {
      const originalData = { key: 'test', value: 'restore test' };
      const snapshot = await syncSnapshot.captureSnapshot(originalData);
      
      const restored = await syncSnapshot.restoreSnapshot(snapshot);
      
      expect(restored).toEqual(originalData);
    });
    
    it('should restore compressed snapshot', async () => {
      const originalData = {
        items: Array(5000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: 'x'.repeat(50)
        }))
      };
      
      const snapshot = await syncSnapshot.captureSnapshot(originalData);
      const restored = await syncSnapshot.restoreSnapshot(snapshot);
      
      expect(restored).toEqual(originalData);
    });
    
    it('should throw error if checksum validation fails', async () => {
      const data = { key: 'test' };
      const snapshot = await syncSnapshot.captureSnapshot(data);
      const parsed = JSON.parse(snapshot);
      
      // Tamper with checksum
      parsed.checksum = 'invalid-checksum';
      const tamperedSnapshot = JSON.stringify(parsed);
      
      await expect(syncSnapshot.restoreSnapshot(tamperedSnapshot)).rejects.toThrow(
        'Snapshot integrity check failed'
      );
    });
  });
  
  describe('compareSnapshots', () => {
    it('should compare array snapshots', async () => {
      const data1 = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      
      const data2 = [
        { id: 1, name: 'Item 1 Modified' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' }
      ];
      
      const snapshot1 = await syncSnapshot.captureSnapshot(data1);
      const snapshot2 = await syncSnapshot.captureSnapshot(data2);
      
      const diff = await syncSnapshot.compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.added.length).toBeGreaterThan(0);
      expect(diff.removed.length).toBeGreaterThan(0);
      expect(diff.modified.length).toBeGreaterThan(0);
      expect(diff.unchanged).toBeGreaterThanOrEqual(0);
    });
    
    it('should compare object snapshots', async () => {
      const data1 = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      };
      
      const data2 = {
        field1: 'value1',
        field2: 'modified',
        field4: 'new field'
      };
      
      const snapshot1 = await syncSnapshot.captureSnapshot(data1);
      const snapshot2 = await syncSnapshot.captureSnapshot(data2);
      
      const diff = await syncSnapshot.compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.added).toContain('field4');
      expect(diff.removed).toContain('field3');
      expect(diff.modified).toContainEqual(
        expect.objectContaining({ key: 'field2' })
      );
      expect(diff.unchanged).toBe(1); // field1 unchanged
    });
    
    it('should handle compressed snapshots in comparison', async () => {
      const largeData1 = {
        items: Array(5000).fill(null).map((_, i) => ({ id: i, value: 'original' }))
      };
      
      const largeData2 = {
        items: Array(5000).fill(null).map((_, i) => ({ id: i, value: 'modified' }))
      };
      
      const snapshot1 = await syncSnapshot.captureSnapshot(largeData1);
      const snapshot2 = await syncSnapshot.captureSnapshot(largeData2);
      
      const diff = await syncSnapshot.compareSnapshots(snapshot1, snapshot2);
      
      expect(diff).toBeDefined();
      expect(diff.modified.length).toBeGreaterThan(0);
    });
  });
  
  describe('validateSnapshot', () => {
    it('should validate correct snapshot', async () => {
      const data = { key: 'test', valid: true };
      const snapshot = await syncSnapshot.captureSnapshot(data);
      
      const isValid = await syncSnapshot.validateSnapshot(snapshot);
      
      expect(isValid).toBe(true);
    });
    
    it('should invalidate tampered snapshot', async () => {
      const data = { key: 'test' };
      const snapshot = await syncSnapshot.captureSnapshot(data);
      const parsed = JSON.parse(snapshot);
      
      // Tamper with data
      parsed.data = JSON.stringify({ key: 'tampered' });
      const tamperedSnapshot = JSON.stringify(parsed);
      
      const isValid = await syncSnapshot.validateSnapshot(tamperedSnapshot);
      
      expect(isValid).toBe(false);
    });
    
    it('should validate compressed snapshot', async () => {
      const largeData = {
        items: Array(5000).fill(null).map((_, i) => ({ id: i }))
      };
      
      const snapshot = await syncSnapshot.captureSnapshot(largeData);
      const isValid = await syncSnapshot.validateSnapshot(snapshot);
      
      expect(isValid).toBe(true);
    });
    
    it('should handle invalid JSON gracefully', async () => {
      const invalidSnapshot = 'not-valid-json';
      
      const isValid = await syncSnapshot.validateSnapshot(invalidSnapshot);
      
      expect(isValid).toBe(false);
    });
  });
});