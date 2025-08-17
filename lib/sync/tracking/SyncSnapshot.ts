import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { createHash } from 'crypto';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Compression Configuration
const COMPRESSION_THRESHOLD = 100_000;  // 100KB - compress if larger
const MAX_SNAPSHOT_SIZE = 10_000_000;   // 10MB - maximum allowed size
const COMPRESSION_LEVEL = 6;            // zlib compression level (1-9)

export interface SnapshotData {
  data: string;
  checksum: string;
  isCompressed: boolean;
  originalSize: number;
  timestamp: string;
}

export interface SnapshotDiff {
  added: any[];
  modified: any[];
  removed: any[];
  unchanged: number;
}

export class SyncSnapshot {
  /**
   * Capture a snapshot of data with optional compression
   */
  async captureSnapshot(data: any): Promise<string> {
    // Serialize data to JSON
    const jsonString = JSON.stringify(data);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
    
    // Check size limit
    if (sizeInBytes > MAX_SNAPSHOT_SIZE) {
      throw new Error(
        `Snapshot size (${sizeInBytes} bytes) exceeds maximum allowed size (${MAX_SNAPSHOT_SIZE} bytes)`
      );
    }
    
    // Calculate checksum for integrity
    const checksum = createHash('sha256').update(jsonString).digest('hex');
    
    // Compress if over threshold
    let finalData: string;
    let isCompressed = false;
    
    if (sizeInBytes > COMPRESSION_THRESHOLD) {
      const compressed = await gzipAsync(jsonString, { level: COMPRESSION_LEVEL });
      finalData = compressed.toString('base64');
      isCompressed = true;
      
      const compressionRatio = Math.round((1 - compressed.length / sizeInBytes) * 100);
      // Compression successful: original → compressed (reduction %)
    } else {
      finalData = jsonString;
    }
    
    // Return snapshot with metadata
    const snapshot: SnapshotData = {
      data: finalData,
      checksum,
      isCompressed,
      originalSize: sizeInBytes,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(snapshot);
  }
  
  /**
   * Restore data from a snapshot
   */
  async restoreSnapshot(snapshotString: string): Promise<any> {
    const snapshot: SnapshotData = JSON.parse(snapshotString);
    
    let jsonString: string;
    
    if (snapshot.isCompressed) {
      // Decompress the data
      const compressed = Buffer.from(snapshot.data, 'base64');
      const decompressed = await gunzipAsync(compressed);
      jsonString = decompressed.toString('utf8');
    } else {
      jsonString = snapshot.data;
    }
    
    // Verify checksum
    const calculatedChecksum = createHash('sha256').update(jsonString).digest('hex');
    if (calculatedChecksum !== snapshot.checksum) {
      throw new Error('Snapshot integrity check failed: checksum mismatch');
    }
    
    return JSON.parse(jsonString);
  }
  
  /**
   * Compare two snapshots and return differences
   */
  async compareSnapshots(snapshot1String: string, snapshot2String: string): Promise<SnapshotDiff> {
    // Restore both snapshots
    const data1 = await this.restoreSnapshot(snapshot1String);
    const data2 = await this.restoreSnapshot(snapshot2String);
    
    // Perform diff analysis
    const diff: SnapshotDiff = {
      added: [],
      modified: [],
      removed: [],
      unchanged: 0
    };
    
    // If data is an array, compare arrays
    if (Array.isArray(data1) && Array.isArray(data2)) {
      diff.added = this.findArrayAdditions(data1, data2);
      diff.removed = this.findArrayRemovals(data1, data2);
      diff.modified = this.findArrayModifications(data1, data2);
      diff.unchanged = this.countUnchanged(data1, data2);
    } 
    // If data is an object, compare objects
    else if (typeof data1 === 'object' && typeof data2 === 'object') {
      diff.added = this.findObjectAdditions(data1, data2);
      diff.removed = this.findObjectRemovals(data1, data2);
      diff.modified = this.findObjectModifications(data1, data2);
      diff.unchanged = this.countObjectUnchanged(data1, data2);
    }
    
    return diff;
  }
  
  /**
   * Validate snapshot integrity
   */
  async validateSnapshot(snapshotString: string): Promise<boolean> {
    try {
      const snapshot: SnapshotData = JSON.parse(snapshotString);
      
      let jsonString: string;
      
      if (snapshot.isCompressed) {
        const compressed = Buffer.from(snapshot.data, 'base64');
        const decompressed = await gunzipAsync(compressed);
        jsonString = decompressed.toString('utf8');
      } else {
        jsonString = snapshot.data;
      }
      
      const calculatedChecksum = createHash('sha256').update(jsonString).digest('hex');
      return calculatedChecksum === snapshot.checksum;
    } catch (error) {
      // Validation failed, continue without throwing
      return false;
    }
  }
  
  // Helper methods for diff analysis
  private findArrayAdditions(arr1: any[], arr2: any[]): any[] {
    const str1Set = new Set(arr1.map(item => JSON.stringify(item)));
    return arr2.filter(item => !str1Set.has(JSON.stringify(item)));
  }
  
  private findArrayRemovals(arr1: any[], arr2: any[]): any[] {
    const str2Set = new Set(arr2.map(item => JSON.stringify(item)));
    return arr1.filter(item => !str2Set.has(JSON.stringify(item)));
  }
  
  private findArrayModifications(arr1: any[], arr2: any[]): any[] {
    // For arrays, we consider items at the same index as potentially modified
    const modified: any[] = [];
    const minLength = Math.min(arr1.length, arr2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
        modified.push({ index: i, old: arr1[i], new: arr2[i] });
      }
    }
    
    return modified;
  }
  
  private countUnchanged(arr1: any[], arr2: any[]): number {
    const str1Set = new Set(arr1.map(item => JSON.stringify(item)));
    const str2Set = new Set(arr2.map(item => JSON.stringify(item)));
    let count = 0;
    
    str1Set.forEach(item => {
      if (str2Set.has(item)) count++;
    });
    
    return count;
  }
  
  private findObjectAdditions(obj1: any, obj2: any): string[] {
    const keys1 = new Set(Object.keys(obj1));
    return Object.keys(obj2).filter(key => !keys1.has(key));
  }
  
  private findObjectRemovals(obj1: any, obj2: any): string[] {
    const keys2 = new Set(Object.keys(obj2));
    return Object.keys(obj1).filter(key => !keys2.has(key));
  }
  
  private findObjectModifications(obj1: any, obj2: any): any[] {
    const modified: any[] = [];
    const commonKeys = Object.keys(obj1).filter(key => key in obj2);
    
    for (const key of commonKeys) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        modified.push({ key, old: obj1[key], new: obj2[key] });
      }
    }
    
    return modified;
  }
  
  private countObjectUnchanged(obj1: any, obj2: any): number {
    const commonKeys = Object.keys(obj1).filter(key => key in obj2);
    let count = 0;
    
    for (const key of commonKeys) {
      if (JSON.stringify(obj1[key]) === JSON.stringify(obj2[key])) {
        count++;
      }
    }
    
    return count;
  }
}