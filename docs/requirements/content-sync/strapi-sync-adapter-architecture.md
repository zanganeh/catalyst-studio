# Strapi CMS Sync Adapter: Architecture & Analysis

## Executive Summary

This document provides a comprehensive architectural analysis for integrating Catalyst Studio with Strapi CMS. Unlike Optimizely's enterprise-focused, strongly-typed approach, Strapi offers a more flexible, open-source solution that aligns naturally with Catalyst Studio's JSON-based architecture.

**Architecture Compatibility Score: B+** (Good alignment, simpler implementation path)

## Strapi vs Optimizely: Key Differences

| Aspect | Strapi | Optimizely CMS SaaS |
|--------|--------|-------------------|
| **Architecture** | Open-source, headless, flexible | Enterprise, strongly-typed .NET |
| **Content Model** | Dynamic JSON schemas | Strict IContent interface |
| **API Type** | REST + GraphQL native | REST with GraphQL beta |
| **Rate Limits** | 60-100 req/sec typical | 100 req/min |
| **Authentication** | API tokens (Bearer) | OAuth2 |
| **Hosting** | Self-hosted or cloud | SaaS only |
| **Bulk Operations** | Native support | Limited (50 items max) |
| **Webhooks** | Built-in | Limited |
| **Cost** | Free (self-hosted) or paid cloud | Enterprise pricing |
| **Type System** | JavaScript/JSON | .NET/C# |

## How Strapi Works

### Content Structure
```javascript
// Strapi Content Type Definition (schema.json)
// NOTE: Must be created via admin UI or filesystem, NOT via API
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "options": {
    "draftAndPublish": true  // Enable draft/publish workflow
  },
  "attributes": {
    "title": { 
      "type": "string",
      "required": true,
      "maxLength": 255
    },
    "content": { 
      "type": "richtext"  // Supports Markdown or Blocks editor
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::author.author"
    },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "tags": { 
      "type": "json"  // Flexible JSON storage
    },
    "featured_image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "gallery": {
      "type": "media",
      "multiple": true,  // Multiple files
      "allowedTypes": ["images", "videos"]
    }
  }
}
```

### API Endpoints
- **Collection Types**: 
  - GET `/api/articles` - List all (paginated, max 100 by default)
  - POST `/api/articles` - Create new document
  - GET `/api/articles/:documentId` - Get specific document
  - PUT `/api/articles/:documentId` - Update document
  - DELETE `/api/articles/:documentId` - Delete document

- **Single Types**:
  - GET `/api/homepage` - Get single type
  - PUT `/api/homepage` - Update/create single type
  - DELETE `/api/homepage` - Delete single type

- **Media Upload**:
  - POST `/api/upload` - Upload files (FormData required)
  - GET `/api/upload/files` - List uploaded files
  - GET `/api/upload/files/:id` - Get file details
  - DELETE `/api/upload/files/:id` - Delete file

### Authentication
```javascript
// Simple Bearer token authentication
headers: {
  'Authorization': 'Bearer your-api-token-here',
  'Content-Type': 'application/json'
}

// Note: Read-only tokens limited to find/findOne operations
// Full access tokens can perform all CRUD operations
```

## Architectural Design for Strapi Sync

### Core Components

#### 1. StrapiSyncAdapter (Main Orchestrator)
```typescript
class StrapiSyncAdapter {
  private apiClient: StrapiApiClient;
  private mapper: ContentMapper;
  private stateManager: SyncStateManager;
  private webhookHandler: WebhookHandler;
  
  async sync(config: SyncConfig): Promise<SyncResult> {
    // Simpler than Optimizely - no type generation needed
  }
}
```

#### 2. ContentMapper (JSON to JSON)
```typescript
class ContentMapper {
  // Much simpler than Optimizely - both sides use JSON
  mapContentType(catalystType: any): StrapiContentType {
    return {
      kind: 'collectionType',
      attributes: this.mapFields(catalystType.fields)
    };
  }
  
  mapFields(fields: any[]): StrapiAttributes {
    // Direct mapping, no type generation
    return fields.reduce((acc, field) => {
      acc[field.name] = this.mapFieldType(field);
      return acc;
    }, {});
  }
}
```

#### 3. StrapiApiClient
```typescript
class StrapiApiClient {
  private token: string;
  private baseUrl: string;
  
  // No complex OAuth2, just bearer tokens
  async createContentType(type: any): Promise<void> {
    // Note: Requires Strapi admin API or Content-Type Builder plugin
  }
  
  async createContent(apiId: string, data: any): Promise<any> {
    return fetch(`${this.baseUrl}/api/${apiId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });
  }
}
```

### Field Type Mapping

| Catalyst Studio | Strapi | Notes |
|----------------|--------|-------|
| text | string | Direct mapping |
| textarea | text | Longer text field |
| richtext | richtext | Supports Markdown or Blocks |
| number | integer/float/decimal | Based on validation |
| boolean | boolean | Direct mapping |
| date | date/datetime | With timezone support |
| image | media | Via upload API |
| gallery | media (multiple) | Array of media |
| select | enumeration | With allowed values |
| multiselect | json/enumeration array | Flexible storage |
| reference | relation | Needs ID mapping |
| json | json | Direct mapping |
| tags | json/component | Flexible |

### Media Handling
```typescript
class MediaUploader {
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('files', file, filename);
    
    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    
    const [uploaded] = await response.json();
    return uploaded.id; // Store reference
  }
}
```

## Implementation Architecture

### Phase 1: Basic Integration (Week 1-2)
```
/lib/sync-adapters/
├── strapi/
│   ├── StrapiApiClient.ts       # REST API wrapper
│   ├── StrapiSyncAdapter.ts     # Main sync logic
│   ├── ContentMapper.ts         # JSON transformations
│   ├── MediaHandler.ts          # File upload handling
│   └── WebhookReceiver.ts       # Real-time updates
├── base/
│   ├── BaseSyncAdapter.ts       # Shared interface
│   └── ISyncAdapter.ts          # Common types
└── index.ts

/lib/ai-tools/tools/sync/
├── sync-to-strapi.ts            # AI chat command
├── preview-strapi-sync.ts       # Dry-run mode
└── strapi-webhook-setup.ts      # Configure webhooks
```

### Phase 2: Advanced Features (Week 3-4)
- Bi-directional sync via webhooks
- Component and Dynamic Zone support
- Multi-language synchronization
- Version history tracking
- Conflict resolution UI

## Advantages Over Optimizely

### 1. Simpler Integration
- **JSON native**: No type generation needed
- **Flexible schemas**: Dynamic content types
- **Direct mapping**: Minimal transformation logic

### 2. Better Performance
- **Higher rate limits**: 60-100 req/sec vs 100 req/min
- **Bulk operations**: Native support for batch processing
- **Parallel requests**: No strict sequential requirements

### 3. Developer Experience
- **Open source**: Can extend/modify if needed
- **Better documentation**: Active community
- **Simpler auth**: API tokens vs OAuth2
- **REST + GraphQL**: Choose best API for use case

### 4. Cost Effectiveness
- **Self-hosted option**: Free for infrastructure cost only
- **Predictable pricing**: Cloud version has clear tiers
- **No enterprise lock-in**: Can migrate if needed

## 🚨 CRITICAL LIMITATION: Content Type Creation

### The Reality: No API for Content Type Creation
**Strapi does NOT provide API endpoints for creating content types programmatically**. Content types can only be created through:
1. **Admin UI** - Manual creation in development mode
2. **Filesystem** - Placing schema.json files in correct directories
3. **Custom Plugin** - Building a Strapi plugin with internal access

### Recommended Approach: Pre-Configured Type Mapping
```typescript
// sync-config.json - Map Catalyst types to pre-created Strapi types
{
  "typeMappings": [
    {
      "catalystType": "BlogPost",
      "strapiApiId": "articles",  // Must exist in Strapi
      "fieldMappings": [
        { "from": "title", "to": "title" },
        { "from": "body", "to": "content" },
        { "from": "heroImage", "to": "featured_image", "type": "media" }
      ]
    }
  ]
}
```

### Setup Instructions for Users:
1. **Pre-create content types in Strapi** matching Catalyst Studio types
2. **Configure field mappings** in sync configuration
3. **Run sync adapter** to synchronize content only

## Detailed API Implementation

### Content Creation with Proper Data Structure
```typescript
// IMPORTANT: Strapi expects data wrapped in 'data' property
async function createContent(apiId: string, content: any) {
  const response = await fetch(`${STRAPI_URL}/api/${apiId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: content  // Must wrap in 'data' object
    })
  });
  
  const result = await response.json();
  return result.data; // Response also wrapped in 'data'
}
```

### Media Upload Process (Two-Step)
```typescript
// Step 1: Upload file to Strapi
async function uploadMedia(file: Buffer, filename: string): Promise<number> {
  const formData = new FormData();
  
  // CRITICAL: Must use FormData, not JSON
  formData.append('files', new Blob([file]), filename);
  
  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
      // Do NOT set Content-Type - let browser set it with boundary
    },
    body: formData
  });
  
  const [uploaded] = await response.json();
  return uploaded.id; // Return ID for content reference
}

// Step 2: Reference media in content
async function createArticleWithImage(title: string, imageId: number) {
  return createContent('articles', {
    title,
    featured_image: imageId  // Reference uploaded media by ID
  });
}
```

### Managing Relations
```typescript
// Relations use connect/disconnect/set operations
async function updateArticleRelations(articleId: string, categoryIds: number[]) {
  const response = await fetch(`${STRAPI_URL}/api/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        categories: {
          connect: categoryIds,     // Add new relations
          // disconnect: [4, 5],    // Remove specific relations
          // set: [1, 2, 3]         // Replace all relations
        }
      }
    })
  });
  
  return response.json();
}
```

### Handling Pagination and Filtering
```typescript
// Strapi uses specific query parameter format
async function fetchPaginatedContent(page = 1, pageSize = 25) {
  const params = new URLSearchParams({
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate': '*',  // Include relations
    'filters[status][$eq]': 'published',
    'sort': 'createdAt:desc'
  });
  
  const response = await fetch(
    `${STRAPI_URL}/api/articles?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    }
  );
  
  const result = await response.json();
  return {
    data: result.data,
    meta: result.meta.pagination
  };
}
```

### Batch Processing Strategy
```typescript
class StrapiBatchProcessor {
  private readonly CONCURRENT_LIMIT = 10; // Strapi handles parallel well
  
  async syncBatch(items: any[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    // Process in chunks for controlled parallelism
    for (let i = 0; i < items.length; i += this.CONCURRENT_LIMIT) {
      const batch = items.slice(i, i + this.CONCURRENT_LIMIT);
      
      const batchResults = await Promise.all(
        batch.map(item => this.syncSingleItem(item))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming
      await this.delay(100);
    }
    
    return results;
  }
  
  private async syncSingleItem(item: any): Promise<SyncResult> {
    try {
      // 1. Upload media if present
      const mediaIds = await this.uploadMediaFields(item);
      
      // 2. Transform content
      const strapiContent = this.transformContent(item, mediaIds);
      
      // 3. Create or update in Strapi
      const result = await this.upsertContent(strapiContent);
      
      return { success: true, id: result.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## Other Challenges & Solutions

### Challenge 2: Webhook Configuration
**Issue**: Need real-time bi-directional sync
**Solution**:
```typescript
// Configure Strapi webhooks for real-time updates
class WebhookManager {
  async setupWebhooks() {
    // Note: Webhooks configured in Strapi admin panel
    // Settings > Webhooks > Add new webhook
    
    // Endpoint to receive Strapi updates
    app.post('/webhooks/strapi', async (req, res) => {
      const { event, model, entry } = req.body;
      
      if (event === 'entry.create' || event === 'entry.update') {
        await this.syncToCatalyst(model, entry);
      }
      
      res.status(200).send('OK');
    });
  }
}
```

### Challenge 3: Error Recovery
**Issue**: Network failures, validation errors
**Solution**:
```typescript
class ResilientSync {
  async syncWithRetry(item: any, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.syncItem(item);
      } catch (error) {
        lastError = error;
        
        if (error.status === 429) {
          // Rate limit - exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        } else if (error.status === 400) {
          // Validation error - don't retry
          throw error;
        } else {
          // Network error - retry immediately
          continue;
        }
      }
    }
    
    throw lastError;
  }
}
```

## Security Considerations

### API Token Management
```typescript
class SecureTokenManager {
  private vault: SecretVault;
  
  async getToken(): Promise<string> {
    // Rotate tokens periodically
    // Store in secure vault (not env vars)
    // Use read-only tokens where possible
    return await this.vault.get('strapi-api-token');
  }
}
```

### Data Protection
- Encrypt sensitive data in transit (HTTPS)
- Validate all input before sync
- Implement rate limiting on our side
- Audit trail for all sync operations

## Performance Optimizations

### 1. Parallel Processing
```typescript
// Strapi allows parallel requests - use it!
async syncBatch(items: any[]): Promise<void> {
  const chunks = chunk(items, 10); // Process 10 at a time
  
  for (const batch of chunks) {
    await Promise.all(
      batch.map(item => this.syncItem(item))
    );
  }
}
```

### 2. Caching Strategy
```typescript
class CachedStrapiClient {
  private cache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 5 // 5 minutes
  });
  
  async getContentType(name: string): Promise<any> {
    if (!this.cache.has(name)) {
      const type = await this.fetchContentType(name);
      this.cache.set(name, type);
    }
    return this.cache.get(name);
  }
}
```

### 3. Incremental Sync
```typescript
class IncrementalSync {
  async sync(): Promise<void> {
    const lastSync = await this.getLastSyncTime();
    const changes = await this.getChangesSince(lastSync);
    
    // Only sync what changed
    await this.syncChanges(changes);
    await this.updateSyncTime();
  }
}
```

## Monitoring & Observability

### Metrics to Track
```typescript
interface SyncMetrics {
  totalSynced: number;
  successRate: number;
  averageLatency: number;
  errorsPerMinute: number;
  apiQuotaUsage: number;
  cacheHitRate: number;
}
```

### Logging Strategy
```typescript
class StructuredLogger {
  log(event: SyncEvent): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: event.level,
      action: event.action,
      contentType: event.contentType,
      documentId: event.documentId,
      duration: event.duration,
      status: event.status,
      error: event.error
    }));
  }
}
```

## Implementation Roadmap

### Week 1-2: Foundation
- [x] Research Strapi APIs
- [ ] Build StrapiApiClient
- [ ] Implement ContentMapper
- [ ] Create basic sync flow
- [ ] Add authentication

### Week 3-4: Core Features
- [ ] Media upload handling
- [ ] Relation mapping
- [ ] Error handling
- [ ] Webhook integration
- [ ] Dry-run mode

### Week 5-6: Production Readiness
- [ ] Performance optimization
- [ ] Monitoring/logging
- [ ] Security hardening
- [ ] Documentation
- [ ] Testing suite

### Week 7-8: Advanced Features
- [ ] Bi-directional sync
- [ ] Conflict resolution
- [ ] Version history
- [ ] Bulk operations
- [ ] Multi-language support

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API Changes | Low | Medium | Version detection, graceful degradation |
| Rate Limits | Low | Low | Built-in throttling, queue management |
| Data Loss | Low | High | Transaction logs, rollback capability |
| Auth Issues | Low | Medium | Token refresh, fallback auth |
| Network Failures | Medium | Low | Retry logic, circuit breaker |

## Success Metrics

- **Sync Speed**: < 2 seconds per content item
- **Success Rate**: > 99.5%
- **API Efficiency**: < 50% of rate limit
- **Error Recovery**: < 30 seconds
- **Cache Hit Rate**: > 80%
- **User Satisfaction**: Faster than manual entry

## Comparison Summary

### Strapi Advantages ✅
1. **Simpler integration** - JSON to JSON mapping
2. **Better rate limits** - 60-100x more requests allowed
3. **Open source** - Extensible and customizable
4. **Lower cost** - Self-hosted option available
5. **Native webhooks** - Real-time sync possible
6. **Flexible schemas** - No rigid type system
7. **Dual API** - REST and GraphQL

### Strapi Limitations ⚠️
1. **Dynamic types** - Can't create via API easily
2. **Less enterprise** - Fewer workflow features
3. **Media handling** - Requires separate upload
4. **Versioning** - Less sophisticated
5. **Self-hosted complexity** - If not using cloud

## Recommendations

### For Strapi Integration:
1. **Start with content sync** (not type sync)
2. **Use REST API** for simplicity (GraphQL for complex queries)
3. **Implement webhooks** early for real-time updates
4. **Cache aggressively** - Strapi allows it
5. **Batch operations** - Take advantage of parallel processing
6. **Monitor API usage** - Even with high limits

### Architecture Best Practices:
1. **Event-driven design** - Use webhooks
2. **Queue-based processing** - Handle large syncs
3. **Idempotent operations** - Safe retries
4. **Audit everything** - Compliance ready
5. **Feature flags** - Gradual rollout

## Conclusion

Strapi offers a **significantly simpler integration path** compared to Optimizely, with better performance characteristics and lower complexity. The JSON-native approach aligns perfectly with Catalyst Studio's architecture, eliminating the need for complex type generation and transformation layers.

**Recommendation**: Prioritize Strapi integration for initial sync adapter implementation. It will provide faster time-to-market, lower development costs, and better performance while serving as a learning platform for more complex integrations like Optimizely.

**Next Steps**:
1. Validate Strapi API capabilities with POC
2. Confirm content type creation approach
3. Design webhook architecture
4. Build MVP sync adapter
5. Test with real customer data

---

*Document Version: 1.0*  
*Date: December 2024*  
*Author: Winston, System Architect*  
*Status: Ready for Review*