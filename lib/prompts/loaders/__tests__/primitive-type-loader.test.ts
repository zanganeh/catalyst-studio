/**
 * Tests for Primitive Type Loader
 */

import { PrimitiveTypeLoader } from '../primitive-type-loader';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('PrimitiveTypeLoader', () => {
  let loader: PrimitiveTypeLoader;

  beforeEach(() => {
    loader = new PrimitiveTypeLoader();
    jest.clearAllMocks();
  });

  describe('loadAllPrimitiveTypes', () => {
    it('should load all primitive types from directories', async () => {
      // Mock file system
      const mockReaddir = jest.spyOn(fs.promises, 'readdir');
      mockReaddir.mockResolvedValue([
        { name: 'text', isDirectory: () => true },
        { name: 'number', isDirectory: () => true },
        { name: 'boolean', isDirectory: () => true },
        { name: 'base', isDirectory: () => true }, // Should be excluded
        { name: 'readme.md', isDirectory: () => false } // Should be excluded
      ] as any);

      const mockExists = jest.spyOn(fs, 'existsSync');
      mockExists.mockReturnValue(true);

      // Mock dynamic imports
      jest.doMock(
        path.join(process.cwd(), 'lib/providers/universal/types/primitives/text/index.ts'),
        () => ({
          TextType: class {
            validate() { return true; }
            getName() { return 'Text'; }
            minLength = 1;
            maxLength = 255;
          }
        }),
        { virtual: true }
      );

      const types = await loader.loadAllPrimitiveTypes();
      
      expect(mockReaddir).toHaveBeenCalled();
      expect(types).toBeDefined();
      expect(Array.isArray(types)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const mockReaddir = jest.spyOn(fs.promises, 'readdir');
      mockReaddir.mockRejectedValue(new Error('Directory not found'));

      const types = await loader.loadAllPrimitiveTypes();
      
      expect(types).toEqual([]);
    });
  });

  describe('formatForPrompt', () => {
    it('should format types for prompt injection', () => {
      // Manually set some loaded types for testing
      (loader as any).loadedTypes = new Map([
        ['text', {
          name: 'Text',
          category: 'primitive',
          description: 'Short text field',
          constraints: { minLength: 1, maxLength: 255 },
          capabilities: ['stores-text', 'searchable']
        }],
        ['number', {
          name: 'Number',
          category: 'primitive',
          description: 'Numeric field',
          constraints: { min: 0, max: 999999 },
          capabilities: ['stores-number', 'sortable']
        }]
      ]);

      const formatted = loader.formatForPrompt();
      
      expect(formatted).toContain('Text: Short text field');
      expect(formatted).toContain('min length: 1');
      expect(formatted).toContain('max length: 255');
      expect(formatted).toContain('Number: Numeric field');
    });
  });

  describe('getTypesAsJson', () => {
    it('should return types as JSON object', () => {
      (loader as any).loadedTypes = new Map([
        ['text', {
          name: 'Text',
          category: 'primitive',
          description: 'Short text field',
          constraints: { maxLength: 255 },
          capabilities: ['searchable']
        }]
      ]);

      const json = loader.getTypesAsJson();
      
      expect(json).toHaveProperty('Text');
      expect(json.Text).toHaveProperty('description', 'Short text field');
      expect(json.Text).toHaveProperty('constraints');
      expect(json.Text).toHaveProperty('capabilities');
    });
  });
});