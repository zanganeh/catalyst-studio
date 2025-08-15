import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseExtractor {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, '../../../prisma/dev.db');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Connected to database: ${this.dbPath}`);
          resolve();
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async getAll(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async extractContentTypes(websiteId = null) {
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
      
      const params = [];
      if (websiteId) {
        query += ' WHERE ct.websiteId = ?';
        params.push(websiteId);
      }
      
      query += ' ORDER BY ct.name, ct.createdAt';

      const rows = await this.getAll(query, params);
      
      return rows.map(row => {
        let fields = {};
        let settings = {};
        
        try {
          fields = JSON.parse(row.fields);
        } catch (e) {
          console.warn(`Failed to parse fields for content type ${row.id}:`, e.message);
        }
        
        try {
          if (row.settings) {
            settings = JSON.parse(row.settings);
          }
        } catch (e) {
          console.warn(`Failed to parse settings for content type ${row.id}:`, e.message);
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

  async getWebsites() {
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
      
      return await this.getAll(query);
    } catch (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }
  }
}