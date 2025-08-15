import * as sqlite3 from 'sqlite3';
import * as path from 'path';

export interface ExtractedContentType {
  id: string;
  websiteId: string;
  websiteName: string | null;
  name: string;
  fields: Record<string, any>;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  metadata: {
    extractedAt: string;
    source: string;
  };
}

export interface Website {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseExtractor {
  private dbPath: string;
  private db: sqlite3.Database | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'prisma/dev.db');
  }

  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.isConnected && this.db) {
      return Promise.resolve();
    }
    
    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // Start new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          this.connectionPromise = null;
          reject(err);
        } else {
          console.log(`Connected to database: ${this.dbPath}`);
          this.isConnected = true;
          this.connectionPromise = null;
          resolve();
        }
      });
    });
    
    return this.connectionPromise;
  }

  async close(): Promise<void> {
    if (this.db && this.isConnected) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.isConnected = false;
            this.db = null;
            resolve();
          }
        });
      });
    }
  }

  private async getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async extractContentTypes(websiteId?: string | null): Promise<ExtractedContentType[]> {
    try {
      let query = `
        SELECT 
          ct.id,
          ct.websiteId,
          ct.name,
          ct.fields,
          ct.settings,
          ct.createdAt,
          ct.updatedAt,
          w.name as websiteName
        FROM ContentType ct
        LEFT JOIN Website w ON ct.websiteId = w.id
      `;
      
      const params: any[] = [];
      if (websiteId) {
        query += ' WHERE ct.websiteId = ?';
        params.push(websiteId);
      }
      
      query += ' ORDER BY ct.name, ct.createdAt';

      interface RawContentType {
        id: string;
        websiteId: string;
        name: string;
        fields: string;
        settings: string | null;
        createdAt: string;
        updatedAt: string;
        websiteName: string | null;
      }

      const rows = await this.getAll<RawContentType>(query, params);
      
      return rows.map(row => {
        let fields: Record<string, any> = {};
        let settings: Record<string, any> = {};
        
        try {
          fields = JSON.parse(row.fields);
        } catch (e) {
          console.warn(`Failed to parse fields for content type ${row.id}:`, (e as Error).message);
        }
        
        try {
          if (row.settings) {
            settings = JSON.parse(row.settings);
          }
        } catch (e) {
          console.warn(`Failed to parse settings for content type ${row.id}:`, (e as Error).message);
        }
        
        return {
          id: row.id,
          websiteId: row.websiteId,
          websiteName: row.websiteName,
          name: row.name,
          fields: fields,
          settings: settings,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          metadata: {
            extractedAt: new Date().toISOString(),
            source: 'catalyst-studio'
          }
        };
      });
    } catch (error) {
      console.error('Error extracting content types:', error);
      throw error;
    }
  }

  async getWebsites(): Promise<Website[]> {
    try {
      const query = `
        SELECT 
          id,
          name,
          createdAt,
          updatedAt
        FROM Website
        ORDER BY name
      `;
      
      return await this.getAll<Website>(query);
    } catch (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }
  }
}