/**
 * AI Tools Index
 * 
 * Exports all available AI tools for the chat API.
 * Tools follow the Vercel AI SDK pattern.
 */

import { tool } from 'ai';
import { z } from 'zod';

// Import website management tools from Story 5.2
import { 
  getWebsiteContext,
  updateBusinessRequirements,
  validateContent 
} from './website/index';

// Import content type management tools from Story 5.3
import {
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType
} from './content-types/index';

// Import content item management tools from Story 5.4
// DEPRECATED: createContentItem creates orphaned content - use createPage instead
import {
  listContentItems,
  createContentItem, // @deprecated Use createPage from pages/index
  updateContentItem
} from './content-items/index';

// Import page management tools (Story 8.5 - Fixed Implementation)
// These tools ensure atomic creation of both ContentItem and SiteStructure
import {
  createPage
} from './pages/index';

/**
 * Test tool for verifying tool execution
 * This is a simple tool that echoes back input for testing
 */
export const echoTool = tool({
  description: 'A test tool that echoes back the input message',
  parameters: z.object({
    message: z.string().describe('The message to echo back')
  }),
  execute: async ({ message }) => {
    return {
      success: true,
      data: {
        echo: message,
        timestamp: new Date().toISOString()
      }
    };
  }
});

/**
 * Export all tools as an array for test compatibility
 */
export const allTools = [
  // Website management tools (Story 5.2)
  getWebsiteContext,
  updateBusinessRequirements,
  validateContent,
  // Content type management tools (Story 5.3)
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  // Page management tools (Story 8.5 - Fixed)
  createPage, // NEW: Replaces createContentItem
  // Content item management tools (Story 5.4)
  listContentItems,
  // createContentItem, // DEPRECATED: Creates orphaned content
  updateContentItem,
  // Test tool
  echoTool
];

/**
 * Export tools as an object for named access
 */
export const tools = {
  // Website management tools (Story 5.2)
  getWebsiteContext,
  updateBusinessRequirements,
  validateContent,
  // Content type management tools (Story 5.3)
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  // Page management tools (Story 8.5 - Fixed)
  createPage, // NEW: Replaces createContentItem
  // Content item management tools (Story 5.4)
  listContentItems,
  createContentItem, // @deprecated - Use createPage instead
  updateContentItem,
  // Test tool
  echoTool
};

/**
 * Export tool names for reference
 */
export const toolNames = Object.keys(tools);