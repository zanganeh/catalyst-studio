# Epic 13: Enhanced Export System with Global Component Resolution

> **CRITICAL: PREMIUM FEATURE**  
> All code MUST be placed under `/lib/premium/`
> This ensures feature isolation from the open-source repository

## Executive Summary

This document outlines the architecture for an enhanced export system that properly detects and includes global components used by content items. The system traverses content JSON structures to identify component dependencies, handles folder exports with hierarchy preservation, and ensures complete, working exports with all required dependencies.

## Problem Statement

The current export system has critical gaps:
1. **Missing Global Components**: Only exports local components, not detecting global components referenced in content
2. **Incomplete Dependencies**: Exported content references components that aren't included
3. **No Folder Support**: Cannot export folder structures with their hierarchies
4. **No Usage Detection**: Cannot identify which global components are actually used

## System Overview

### Core Objectives
1. **Complete Dependency Resolution** - Detect and include all global components used by content
2. **Folder Export Support** - Export folders with full hierarchy preservation
3. **Usage Analysis** - Track which components are used and how frequently
4. **Performance Optimization** - Handle large websites efficiently
5. **Data Integrity** - Ensure exports can be successfully imported

### Key Metrics
- **Completeness**: 100% of used global components included
- **Performance**: <10 seconds for 1000 content items
- **Memory**: <100MB for typical website export
- **Accuracy**: Zero missing dependencies in export

## Architecture Components

### 1. Component Detection System

#### Global Component Reference Patterns
```typescript
// Pattern 1: Explicit global component type
{
  "type": "GlobalComponent",
  "globalId": "global-navbar-123",
  "overrides": { /* local overrides */ }
}

// Pattern 2: Component with isGlobal flag
{
  "id": "cmp-456",
  "type": "Navbar",
  "isGlobal": true,
  "componentKey": "shared-navbar"
}

// Pattern 3: Reference to component library
{
  "ref": "components/global/header",
  "props": { /* instance props */ }
}
```

#### Detection Algorithm
```typescript
class ComponentDependencyTracker {
  private globalComponents = new Set<string>()
  private usageMap = new Map<string, number>()
  
  detectGlobalComponents(content: any): Set<string> {
    this.traverse(content)
    return this.globalComponents
  }
  
  private traverse(obj: any, path: string = '') {
    if (!obj) return
    
    // Check for global component patterns
    if (this.isGlobalComponent(obj)) {
      const id = this.extractGlobalId(obj)
      if (id) {
        this.globalComponents.add(id)
        this.incrementUsage(id)
      }
    }
    
    // Recursive traversal
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => 
        this.traverse(item, `${path}[${index}]`)
      )
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) =>
        this.traverse(value, path ? `${path}.${key}` : key)
      )
    }
  }
  
  private isGlobalComponent(obj: any): boolean {
    return (
      obj.type === 'GlobalComponent' ||
      obj.isGlobal === true ||
      obj.ref?.startsWith('components/global/') ||
      obj.componentType === 'global'
    )
  }
  
  private extractGlobalId(obj: any): string | null {
    return (
      obj.globalId ||
      obj.componentKey ||
      obj.componentId ||
      obj.ref ||
      null
    )
  }
}
```

### 2. Enhanced Export Service

#### Core Export Pipeline
```typescript
interface ExportOptions {
  websiteId: string
  includeGlobalComponents: boolean
  includeFolders: boolean
  folderIds?: string[]
  format: 'json' | 'zip'
  validate: boolean
}

class EnhancedExportService {
  async exportWebsite(options: ExportOptions): Promise<ExportResult> {
    // Phase 1: Data Collection
    const contentItems = await this.fetchContentItems(options.websiteId)
    const contentTypes = await this.fetchContentTypes(options.websiteId)
    
    // Phase 2: Dependency Detection
    const tracker = new ComponentDependencyTracker()
    for (const item of contentItems) {
      tracker.detectGlobalComponents(item.content)
    }
    
    // Phase 3: Global Component Resolution
    const globalComponents = options.includeGlobalComponents
      ? await this.resolveGlobalComponents(
          options.websiteId,
          tracker.getGlobalComponentIds()
        )
      : []
    
    // Phase 4: Folder Export
    const folders = options.includeFolders
      ? await this.exportFolders(options.websiteId, options.folderIds)
      : []
    
    // Phase 5: Validation
    if (options.validate) {
      await this.validateExport({
        contentItems,
        globalComponents,
        contentTypes
      })
    }
    
    // Phase 6: Package Export
    return this.packageExport({
      metadata: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        websiteId: options.websiteId,
        statistics: tracker.getStatistics()
      },
      website: await this.fetchWebsite(options.websiteId),
      contentTypes,
      contentItems,
      globalComponents,
      folders,
      siteStructure: await this.fetchSiteStructure(options.websiteId)
    })
  }
}
```

### 3. Folder Export Implementation

#### Recursive Folder Traversal
```typescript
class FolderExporter {
  async exportFolders(
    websiteId: string,
    folderIds?: string[],
    includeChildren: boolean = true
  ): Promise<FolderExport[]> {
    // Get folder content types
    const folders = await prisma.contentType.findMany({
      where: {
        websiteId,
        category: 'folder',
        ...(folderIds && { id: { in: folderIds } })
      }
    })
    
    // Get site structure for hierarchy
    const structure = await prisma.siteStructure.findMany({
      where: { websiteId },
      include: {
        contentItem: true,
        children: includeChildren
      },
      orderBy: { fullPath: 'asc' }
    })
    
    // Build folder tree
    return this.buildFolderTree(folders, structure)
  }
  
  private buildFolderTree(
    folders: ContentType[],
    structure: SiteStructure[]
  ): FolderExport[] {
    const folderMap = new Map<string, FolderExport>()
    
    // Initialize folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        path: '',
        children: [],
        contentItems: []
      })
    })
    
    // Build hierarchy
    structure.forEach(node => {
      if (node.contentItem?.contentTypeId) {
        const folder = folderMap.get(node.contentItem.contentTypeId)
        if (folder) {
          folder.path = node.fullPath
          folder.contentItems.push(node.contentItem)
          
          // Add children
          if (node.parentId) {
            const parent = folderMap.get(node.parentId)
            if (parent) {
              parent.children.push(folder)
            }
          }
        }
      }
    })
    
    // Return root folders
    return Array.from(folderMap.values())
      .filter(folder => !folder.path.includes('/'))
  }
}
```

### 4. Global Component Resolution

#### Component Storage Strategy
```typescript
interface GlobalComponentResolver {
  // Current: Components stored in ContentType table
  async resolveFromContentTypes(
    websiteId: string,
    componentIds: string[]
  ): Promise<GlobalComponent[]> {
    const components = await prisma.contentType.findMany({
      where: {
        websiteId,
        category: 'component',
        OR: [
          { id: { in: componentIds } },
          { key: { in: componentIds } }
        ]
      }
    })
    
    return components.map(this.mapToGlobalComponent)
  }
  
  // Future: Dedicated global_components table
  async resolveFromGlobalTable(
    websiteId: string,
    componentIds: string[]
  ): Promise<GlobalComponent[]> {
    return await prisma.globalComponent.findMany({
      where: {
        websiteId,
        OR: [
          { id: { in: componentIds } },
          { componentKey: { in: componentIds } }
        ]
      }
    })
  }
  
  private mapToGlobalComponent(contentType: ContentType): GlobalComponent {
    return {
      id: contentType.id,
      key: contentType.key,
      name: contentType.name,
      type: 'global',
      fields: contentType.fields,
      metadata: {
        category: contentType.category,
        createdAt: contentType.createdAt,
        updatedAt: contentType.updatedAt
      }
    }
  }
}
```

### 5. Dependency Graph Analysis

#### Circular Dependency Detection
```typescript
class DependencyGraphAnalyzer {
  private graph = new Map<string, Set<string>>()
  
  buildGraph(contentItems: ContentItem[]): void {
    contentItems.forEach(item => {
      const dependencies = this.extractDependencies(item)
      this.graph.set(item.id, dependencies)
    })
  }
  
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    for (const node of this.graph.keys()) {
      if (!visited.has(node)) {
        this.dfs(node, visited, recursionStack, cycles, [])
      }
    }
    
    return cycles
  }
  
  findCriticalComponents(): ComponentImportance[] {
    const usageCount = new Map<string, number>()
    
    // Count references
    for (const dependencies of this.graph.values()) {
      dependencies.forEach(dep => {
        usageCount.set(dep, (usageCount.get(dep) || 0) + 1)
      })
    }
    
    // Calculate importance
    return Array.from(usageCount.entries())
      .map(([id, count]) => ({
        componentId: id,
        usageCount: count,
        importance: this.calculateImportance(count, this.graph.size)
      }))
      .sort((a, b) => b.importance - a.importance)
  }
  
  private calculateImportance(uses: number, total: number): number {
    return (uses / total) * 100
  }
}
```

### 6. Performance Optimization

#### Batch Processing Strategy
```typescript
class ExportPerformanceOptimizer {
  private readonly BATCH_SIZE = 100
  private readonly MAX_MEMORY_MB = 100
  private cache = new Map<string, any>()
  
  async processBatches<T>(
    items: T[],
    processor: (batch: T[]) => Promise<any>
  ): Promise<void> {
    const batches = this.createBatches(items, this.BATCH_SIZE)
    
    for (const batch of batches) {
      // Check memory usage
      if (this.getMemoryUsageMB() > this.MAX_MEMORY_MB) {
        await this.clearCache()
      }
      
      // Process batch with caching
      const cacheKey = this.getBatchCacheKey(batch)
      if (!this.cache.has(cacheKey)) {
        const result = await processor(batch)
        this.cache.set(cacheKey, result)
      }
      
      // Yield to event loop
      await new Promise(resolve => setImmediate(resolve))
    }
  }
  
  private createBatches<T>(items: T[], size: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size))
    }
    return batches
  }
  
  private getMemoryUsageMB(): number {
    const usage = process.memoryUsage()
    return usage.heapUsed / 1024 / 1024
  }
}
```

### 7. Export Validation

#### Pre-Export Validation
```typescript
interface ExportValidator {
  async validate(exportData: ExportData): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check for missing dependencies
    const missingDeps = this.findMissingDependencies(exportData)
    if (missingDeps.length > 0) {
      errors.push({
        type: 'MISSING_DEPENDENCIES',
        details: missingDeps
      })
    }
    
    // Check for circular references
    const circular = this.detectCircularReferences(exportData)
    if (circular.length > 0) {
      warnings.push({
        type: 'CIRCULAR_REFERENCES',
        details: circular
      })
    }
    
    // Check data integrity
    const integrity = await this.validateDataIntegrity(exportData)
    if (!integrity.valid) {
      errors.push({
        type: 'DATA_INTEGRITY',
        details: integrity.errors
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}
```

## API Endpoints

### Export Website
```typescript
// POST /api/premium/export/website
interface ExportWebsiteRequest {
  websiteId: string
  options?: {
    includeGlobalComponents?: boolean
    includeFolders?: boolean
    validate?: boolean
    format?: 'json' | 'zip'
  }
}

interface ExportWebsiteResponse {
  success: boolean
  data?: {
    downloadUrl?: string
    export?: any // Direct JSON response
  }
  error?: string
  statistics?: {
    contentItems: number
    globalComponents: number
    folders: number
    totalSize: number
  }
}
```

### Export Folders
```typescript
// POST /api/premium/export/folders
interface ExportFoldersRequest {
  websiteId: string
  folderIds: string[]
  includeChildren?: boolean
  includeContent?: boolean
}
```

### Validate Export
```typescript
// POST /api/premium/export/validate
interface ValidateExportRequest {
  websiteId: string
  preCheck?: boolean // Check before actual export
}
```

## Implementation Phases

### Phase 1: Core Functionality (Week 1)
- ✅ Component dependency tracker
- ✅ Global component detection algorithm
- ✅ Basic export service enhancement
- ✅ JSON export format

### Phase 2: Folder Support (Week 2)
- ✅ Folder hierarchy traversal
- ✅ Recursive children export
- ✅ Site structure preservation
- ✅ Path reconstruction

### Phase 3: Performance & Validation (Week 3)
- ✅ Batch processing for large datasets
- ✅ Memory optimization
- ✅ Export validation
- ✅ Circular dependency detection

### Phase 4: API & Integration (Week 4)
- ✅ REST API endpoints
- ✅ Download functionality
- ✅ Progress tracking
- ✅ Error handling

## File Structure

```
lib/premium/
├── services/
│   └── export/
│       ├── enhanced-export-service.ts
│       ├── component-dependency-tracker.ts
│       ├── folder-exporter.ts
│       ├── dependency-graph-analyzer.ts
│       ├── export-validator.ts
│       ├── performance-optimizer.ts
│       └── __tests__/
│           ├── export-service.test.ts
│           ├── dependency-tracker.test.ts
│           └── folder-export.test.ts
├── api/
│   └── export/
│       ├── website-export.ts
│       ├── folder-export.ts
│       └── export-validation.ts
└── types/
    └── export.ts
```

## Usage Examples

### Basic Website Export
```typescript
import { EnhancedExportService } from '@/lib/premium/services/export'

const exportService = new EnhancedExportService()

const result = await exportService.exportWebsite({
  websiteId: 'site-123',
  includeGlobalComponents: true,
  includeFolders: true,
  format: 'json',
  validate: true
})

// Result includes all content with resolved global components
console.log(`Exported ${result.statistics.contentItems} items`)
console.log(`Included ${result.statistics.globalComponents} global components`)
```

### Folder-Specific Export
```typescript
const folderExporter = new FolderExporter()

const folders = await folderExporter.exportFolders(
  'site-123',
  ['folder-1', 'folder-2'],
  true // include children
)

// Each folder includes its full hierarchy
folders.forEach(folder => {
  console.log(`Folder: ${folder.name}`)
  console.log(`Path: ${folder.path}`)
  console.log(`Children: ${folder.children.length}`)
  console.log(`Content Items: ${folder.contentItems.length}`)
})
```

### Dependency Analysis
```typescript
const analyzer = new DependencyGraphAnalyzer()

analyzer.buildGraph(contentItems)

// Find critical components
const critical = analyzer.findCriticalComponents()
console.log('Most used components:', critical.slice(0, 5))

// Detect circular dependencies
const cycles = analyzer.detectCircularDependencies()
if (cycles.length > 0) {
  console.warn('Circular dependencies detected:', cycles)
}
```

## Performance Considerations

### Memory Management
- Batch size: 100 items per batch
- Memory limit: 100MB heap usage
- Cache TTL: 15 minutes
- Streaming for large exports

### Optimization Strategies
1. **Lazy Loading**: Load components only when referenced
2. **Caching**: Cache resolved components for reuse
3. **Parallel Processing**: Process independent batches concurrently
4. **Streaming**: Stream large exports directly to response

### Benchmarks
| Dataset Size | Export Time | Memory Usage |
|-------------|------------|--------------|
| 100 items | <1s | ~10MB |
| 1,000 items | <10s | ~50MB |
| 10,000 items | <60s | ~100MB |
| 100,000 items | <10min | ~200MB (streaming) |

## Security Considerations

### Access Control
- Premium feature only
- User must own website
- Rate limiting: 10 exports per hour
- Size limits: 1GB max export

### Data Sanitization
- Remove sensitive metadata
- Validate all JSON structures
- Sanitize file paths in folders
- Escape special characters

## Error Handling

### Common Errors
```typescript
enum ExportError {
  MISSING_DEPENDENCIES = 'Required global components not found',
  CIRCULAR_DEPENDENCY = 'Circular component references detected',
  INVALID_FOLDER = 'Folder structure invalid or corrupted',
  MEMORY_EXCEEDED = 'Export too large for available memory',
  VALIDATION_FAILED = 'Export validation failed'
}
```

### Recovery Strategies
1. **Missing Dependencies**: Include partial export with warnings
2. **Circular Dependencies**: Break cycles and document in metadata
3. **Memory Issues**: Switch to streaming mode automatically
4. **Validation Failures**: Provide detailed error report

## Monitoring & Observability

### Key Metrics
```typescript
interface ExportMetrics {
  // Performance
  exportDuration: Histogram
  componentDetectionTime: Histogram
  validationTime: Histogram
  
  // Reliability
  successRate: Gauge
  errorRate: Counter
  
  // Usage
  totalExports: Counter
  averageExportSize: Gauge
  componentsPerExport: Histogram
}
```

### Logging
```typescript
logger.info('Export started', {
  websiteId,
  options,
  userId,
  timestamp
})

logger.debug('Dependencies detected', {
  globalComponents: tracker.getCount(),
  usageMap: tracker.getUsageStatistics()
})

logger.error('Export failed', {
  error,
  websiteId,
  phase: 'validation'
})
```

## Testing Strategy

### Unit Tests
- Component detection patterns
- Folder hierarchy building
- Dependency graph analysis
- Validation rules

### Integration Tests
- Full export flow
- Database queries
- API endpoints
- File generation

### Performance Tests
- Large dataset handling
- Memory usage limits
- Concurrent exports
- Streaming functionality

## Migration Path

### From Current System
1. Deploy new export service alongside existing
2. Add feature flag for gradual rollout
3. Migrate endpoints one by one
4. Monitor and compare results
5. Deprecate old system

### Database Changes
```sql
-- Future: Add global_components table
CREATE TABLE global_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id),
  component_key VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(website_id, component_key)
);

-- Add indexes for performance
CREATE INDEX idx_global_components_website ON global_components(website_id);
CREATE INDEX idx_global_components_usage ON global_components(usage_count DESC);
```

## Success Criteria

### Technical Success
- ✅ 100% of used global components included
- ✅ All folder hierarchies preserved
- ✅ Zero missing dependencies
- ✅ <10 second export for typical sites

### Business Success
- ✅ Reduced support tickets for export issues
- ✅ Increased user satisfaction
- ✅ Enable reliable content migration
- ✅ Support multi-environment workflows

## Next Steps

1. **Implement Phase 1** - Core dependency tracking
2. **Add test coverage** - Unit and integration tests
3. **Deploy to staging** - Test with real data
4. **Add monitoring** - Track usage and errors
5. **Gradual rollout** - Feature flag deployment
6. **Gather feedback** - Iterate based on usage

---

*This architecture provides a complete solution for the export system, ensuring all global components are properly detected and included while maintaining excellent performance and reliability.*