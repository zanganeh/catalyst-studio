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
} from './website';

// Import content type management tools from Story 5.3
import {
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType
} from './content-types';

// Import content item management tools from Story 5.4
import {
  listContentItems,
  createContentItem,
  updateContentItem
} from './content-items';

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
 * Export all tools as a collection
 */
export const allTools = {
  // Website management tools (Story 5.2)
  getWebsiteContext,
  updateBusinessRequirements,
  validateContent,
  // Content type management tools (Story 5.3)
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  // Content item management tools (Story 5.4)
  listContentItems,
  createContentItem,
  updateContentItem,
  // Test tool
  echoTool
};

/**
 * Export tool names for reference
 */
export const toolNames = Object.keys(allTools);