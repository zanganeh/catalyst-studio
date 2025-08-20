/**
 * Optimizely-specific extensions
 * Platform-specific type features for Optimizely CMS
 */

import { PlatformExtension } from '../../types/extensions';
import { PrimitiveType } from '../../types/primitives';
import { CommonPattern, CollectionPattern } from '../../types/common-patterns';

/**
 * Optimizely Content Area extension
 * Optimizely's dynamic content area for flexible page composition
 */
const contentAreaExtension: PlatformExtension = {
  id: 'content-area',
  platform: 'optimizely',
  name: 'Content Area',
  description: 'Optimizely Content Area for dynamic content composition',
  version: '1.0.0',
  extendsType: {
    pattern: CommonPattern.COLLECTION,
    itemType: { type: PrimitiveType.JSON },
    fallbackPrimitive: PrimitiveType.JSON
  } as CollectionPattern,
  platformProperties: {
    allowedTypes: [],
    renderer: 'ContentAreaRenderer',
    personalization: true,
    displayOptions: ['full', 'half', 'third']
  },
  transformationConfidence: 85,
  features: [
    {
      name: 'Personalization',
      description: 'Content can be personalized per visitor segment',
      universal: false,
      fallback: 'Store personalization rules as metadata'
    },
    {
      name: 'Display Options',
      description: 'Control how blocks are displayed (full width, half, etc.)',
      universal: false,
      fallback: 'Store display options in metadata'
    },
    {
      name: 'Drag and Drop',
      description: 'Editor can reorder blocks via drag and drop',
      universal: true,
      fallback: 'Maintain order in JSON array'
    }
  ],
  requiredCapabilities: ['content-areas', 'blocks', 'personalization'],
  migrationStrategy: {
    toUniversal: (value: any) => {
      // Convert Optimizely ContentArea to universal collection
      if (!value || !Array.isArray(value.items)) return [];
      
      return value.items.map((item: any) => ({
        id: item.contentLink?.id,
        type: item.contentLink?.type,
        displayOption: item.displayOption,
        personalization: item.personalizationData,
        content: item.content
      }));
    },
    fromUniversal: (value: any) => {
      // Convert universal collection to Optimizely ContentArea
      if (!Array.isArray(value)) return { items: [] };
      
      return {
        items: value.map((item: any) => ({
          contentLink: {
            id: item.id,
            type: item.type
          },
          displayOption: item.displayOption || 'full',
          personalizationData: item.personalization,
          content: item.content
        }))
      };
    },
    dataLossWarnings: [
      'Personalization rules may need reconfiguration',
      'Display options might be simplified'
    ]
  }
};

/**
 * Optimizely Block extension
 * Reusable content blocks specific to Optimizely
 */
const blockExtension: PlatformExtension = {
  id: 'block',
  platform: 'optimizely',
  name: 'Block',
  description: 'Optimizely reusable content block',
  version: '1.0.0',
  extendsType: {
    pattern: CommonPattern.COMPONENT,
    fallbackPrimitive: PrimitiveType.JSON
  },
  platformProperties: {
    category: 'Content',
    availableInEditMode: true,
    allowedRoles: [],
    icon: 'block-icon'
  },
  transformationConfidence: 90,
  features: [
    {
      name: 'Shared Blocks',
      description: 'Blocks can be shared across multiple pages',
      universal: true,
      fallback: 'Reference by ID'
    },
    {
      name: 'Local Blocks',
      description: 'Blocks can be page-specific',
      universal: true,
      fallback: 'Inline content'
    },
    {
      name: 'Block Preview',
      description: 'Preview blocks in edit mode',
      universal: false,
      fallback: 'No preview in universal format'
    }
  ],
  requiredCapabilities: ['blocks', 'nested-components']
};

/**
 * Optimizely XhtmlString extension
 * Rich text editor with Optimizely-specific features
 */
const xhtmlStringExtension: PlatformExtension = {
  id: 'xhtml-string',
  platform: 'optimizely',
  name: 'XhtmlString',
  description: 'Optimizely rich text editor with TinyMCE',
  version: '1.0.0',
  extendsType: {
    pattern: CommonPattern.RICH_TEXT,
    format: 'html',
    fallbackPrimitive: PrimitiveType.LONG_TEXT
  },
  platformProperties: {
    editorConfiguration: 'StandardTinyMCE',
    allowedFormats: ['bold', 'italic', 'underline', 'link', 'image'],
    allowedBlocks: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol'],
    personalizableContent: true
  },
  transformationConfidence: 85,
  features: [
    {
      name: 'TinyMCE Editor',
      description: 'Full-featured WYSIWYG editor',
      universal: false,
      fallback: 'Convert to markdown or HTML'
    },
    {
      name: 'Dynamic Content',
      description: 'Embed dynamic content and personalization',
      universal: false,
      fallback: 'Store as placeholders'
    },
    {
      name: 'Media Embedding',
      description: 'Embed images and videos directly',
      universal: true,
      fallback: 'Media references in content'
    }
  ],
  requiredCapabilities: ['rich-text', 'personalization'],
  migrationStrategy: {
    toUniversal: (value: any) => {
      // Convert Optimizely XhtmlString to universal rich text
      if (typeof value !== 'string') return '';
      
      // Here we'd implement HTML to Markdown conversion
      // For now, returning as-is with a note it's HTML
      return {
        content: value,
        format: 'html',
        metadata: {
          originalPlatform: 'optimizely',
          editorType: 'TinyMCE'
        }
      };
    },
    fromUniversal: (value: any) => {
      // Convert universal rich text to XhtmlString
      if (typeof value === 'string') return value;
      
      if (value && value.content) {
        // If it's markdown, would convert to HTML here
        return value.content;
      }
      
      return '';
    },
    dataLossWarnings: [
      'Custom TinyMCE formatting may be simplified',
      'Dynamic content placeholders need reconfiguration'
    ]
  }
};

/**
 * Optimizely ContentReference extension
 * Reference to other content items
 */
const contentReferenceExtension: PlatformExtension = {
  id: 'content-reference',
  platform: 'optimizely',
  name: 'ContentReference',
  description: 'Reference to other Optimizely content',
  version: '1.0.0',
  extendsType: {
    type: PrimitiveType.JSON,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        workId: { type: 'number' },
        providerName: { type: 'string' }
      }
    }
  },
  platformProperties: {
    allowedTypes: [],
    required: false
  },
  transformationConfidence: 95,
  features: [
    {
      name: 'Strong Typing',
      description: 'Type-safe content references',
      universal: false,
      fallback: 'Store as ID with type information'
    },
    {
      name: 'Version Support',
      description: 'Reference specific content versions',
      universal: false,
      fallback: 'Store version in metadata'
    }
  ],
  requiredCapabilities: ['references', 'versioning']
};

/**
 * Optimizely SelectOne/SelectMany extension
 * Dropdown with Optimizely-specific features
 */
const selectionExtension: PlatformExtension = {
  id: 'selection-factory',
  platform: 'optimizely',
  name: 'SelectionFactory',
  description: 'Optimizely selection dropdown with dynamic options',
  version: '1.0.0',
  extendsType: {
    pattern: CommonPattern.SELECT,
    options: [],
    fallbackPrimitive: PrimitiveType.TEXT
  },
  platformProperties: {
    selectionFactoryType: 'EnumSelectionFactory',
    allowMultiple: false
  },
  transformationConfidence: 95,
  features: [
    {
      name: 'Dynamic Options',
      description: 'Options can be loaded dynamically',
      universal: false,
      fallback: 'Static options list'
    },
    {
      name: 'Enum Binding',
      description: 'Bind directly to C# enums',
      universal: false,
      fallback: 'Convert enum to options array'
    }
  ],
  requiredCapabilities: ['select-fields']
};

/**
 * Optimizely LinkCollection extension
 * Collection of links with Optimizely features
 */
const linkCollectionExtension: PlatformExtension = {
  id: 'link-collection',
  platform: 'optimizely',
  name: 'LinkCollection',
  description: 'Collection of links with validation',
  version: '1.0.0',
  extendsType: {
    pattern: CommonPattern.COLLECTION,
    itemType: {
      type: PrimitiveType.JSON,
      schema: {
        type: 'object',
        properties: {
          href: { type: 'string' },
          text: { type: 'string' },
          target: { type: 'string' },
          title: { type: 'string' }
        }
      }
    },
    fallbackPrimitive: PrimitiveType.JSON
  },
  platformProperties: {
    validateUrls: true,
    allowExternalLinks: true,
    allowInternalLinks: true,
    maxItems: 10
  },
  transformationConfidence: 90,
  features: [
    {
      name: 'URL Validation',
      description: 'Automatic validation of link URLs',
      universal: false,
      fallback: 'No automatic validation'
    },
    {
      name: 'Internal Link Picker',
      description: 'UI for selecting internal content',
      universal: false,
      fallback: 'Manual URL entry'
    }
  ],
  requiredCapabilities: ['collections', 'link-validation']
};

/**
 * Export all Optimizely extensions
 */
const optimizelyExtensions: PlatformExtension[] = [
  contentAreaExtension,
  blockExtension,
  xhtmlStringExtension,
  contentReferenceExtension,
  selectionExtension,
  linkCollectionExtension
];

export default optimizelyExtensions;

/**
 * Helper to get extension by ID
 */
export function getOptimizelyExtension(id: string): PlatformExtension | undefined {
  return optimizelyExtensions.find(ext => ext.id === id);
}

/**
 * Helper to get all extensions for a specific capability
 */
export function getExtensionsByCapability(capability: string): PlatformExtension[] {
  return optimizelyExtensions.filter(ext => 
    ext.requiredCapabilities?.includes(capability) ?? false
  );
}