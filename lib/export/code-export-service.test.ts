import { CodeExportService } from './code-export-service';
import { FileNode } from '@/components/development/file-tree';

describe('CodeExportService', () => {
  let service: CodeExportService;
  let createElementSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let clickSpy: jest.Mock;

  beforeEach(() => {
    service = CodeExportService.getInstance();
    
    clickSpy = jest.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    };
    
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CodeExportService.getInstance();
      const instance2 = CodeExportService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('exportSingleFile', () => {
    it('should export a single file', async () => {
      const content = 'console.log("test");';
      const fileName = 'test.js';
      
      await service.exportSingleFile(content, fileName);
      
      expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      
      jest.runAllTimers();
      
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use correct mime type based on file extension', async () => {
      const testCases = [
        { fileName: 'test.ts', expectedType: 'text/typescript' },
        { fileName: 'test.tsx', expectedType: 'text/typescript' },
        { fileName: 'test.js', expectedType: 'text/javascript' },
        { fileName: 'test.css', expectedType: 'text/css' },
        { fileName: 'test.json', expectedType: 'application/json' },
        { fileName: 'test.md', expectedType: 'text/markdown' },
        { fileName: 'test.txt', expectedType: 'text/plain' },
        { fileName: 'test.unknown', expectedType: 'text/plain' },
      ];
      
      for (const { fileName, expectedType } of testCases) {
        await service.exportSingleFile('content', fileName);
        
        const blobCall = createObjectURLSpy.mock.calls[createObjectURLSpy.mock.calls.length - 1][0];
        expect(blobCall.type).toBe(expectedType);
      }
    });

    it('should handle export errors', async () => {
      createObjectURLSpy.mockImplementation(() => {
        throw new Error('Mock error');
      });
      
      await expect(service.exportSingleFile('content', 'test.js')).rejects.toThrow(
        'Failed to export file: test.js'
      );
    });
  });

  describe('exportProject', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).JSZip = jest.fn().mockImplementation(() => ({
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(new Blob(['mock zip'])),
      }));
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).JSZip;
    });

    it('should export project as ZIP', async () => {
      const files = new Map([
        ['/src/index.js', 'console.log("index");'],
        ['/src/app.js', 'console.log("app");'],
        ['/package.json', '{"name": "test"}'],
      ]);
      
      await service.exportProject(files, 'my-project');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      
      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('my-project.zip');
    });

    it('should normalize file paths in ZIP', async () => {
      const mockZip = {
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(new Blob(['mock zip'])),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).JSZip = jest.fn().mockReturnValue(mockZip);
      
      const files = new Map([
        ['/src/index.js', 'content1'],
        ['src/app.js', 'content2'],
      ]);
      
      await service.exportProject(files);
      
      expect(mockZip.file).toHaveBeenCalledWith('src/index.js', 'content1');
      expect(mockZip.file).toHaveBeenCalledWith('src/app.js', 'content2');
    });

    it('should handle ZIP generation errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).JSZip = jest.fn().mockImplementation(() => ({
        file: jest.fn(),
        generateAsync: jest.fn().mockRejectedValue(new Error('ZIP error')),
      }));
      
      const files = new Map([['test.js', 'content']]);
      
      await expect(service.exportProject(files)).rejects.toThrow(
        'Failed to export project as ZIP'
      );
    });
  });

  describe('exportFileTree', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).JSZip = jest.fn().mockImplementation(() => ({
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(new Blob(['mock zip'])),
      }));
    });

    afterEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).JSZip;
    });

    it('should export file tree with content', async () => {
      const fileTree: FileNode[] = [
        {
          id: '1',
          name: 'src',
          type: 'folder',
          path: '/src',
          children: [
            {
              id: '2',
              name: 'index.ts',
              type: 'file',
              path: '/src/index.ts',
              extension: 'ts',
            },
          ],
        },
        {
          id: '3',
          name: 'package.json',
          type: 'file',
          path: '/package.json',
          extension: 'json',
        },
      ];
      
      const fileContents = new Map([
        ['2', 'console.log("index");'],
        ['3', '{"name": "test"}'],
      ]);
      
      await service.exportFileTree(fileTree, fileContents, 'my-project');
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      const anchor = createElementSpy.mock.results[0].value;
      expect(anchor.download).toBe('my-project.zip');
    });

    it('should generate mock content for files without content', async () => {
      const mockZip = {
        file: jest.fn(),
        generateAsync: jest.fn().mockResolvedValue(new Blob(['mock zip'])),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).JSZip = jest.fn().mockReturnValue(mockZip);
      
      const fileTree: FileNode[] = [
        {
          id: '1',
          name: 'Component.tsx',
          type: 'file',
          path: '/Component.tsx',
          extension: 'tsx',
        },
      ];
      
      const fileContents = new Map();
      
      await service.exportFileTree(fileTree, fileContents);
      
      expect(mockZip.file).toHaveBeenCalledWith(
        'Component.tsx',
        expect.stringContaining('export default function Component')
      );
    });

    it('should throw error if no files to export', async () => {
      const fileTree: FileNode[] = [];
      const fileContents = new Map();
      
      await expect(service.exportFileTree(fileTree, fileContents)).rejects.toThrow(
        'No files to export'
      );
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(service.formatFileSize(0)).toBe('0 Bytes');
      expect(service.formatFileSize(512)).toBe('512 Bytes');
      expect(service.formatFileSize(1024)).toBe('1 KB');
      expect(service.formatFileSize(1536)).toBe('1.5 KB');
      expect(service.formatFileSize(1048576)).toBe('1 MB');
      expect(service.formatFileSize(5242880)).toBe('5 MB');
      expect(service.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('estimateProjectSize', () => {
    it('should estimate total project size', () => {
      const files = new Map([
        ['file1', 'a'.repeat(1000)],
        ['file2', 'b'.repeat(2000)],
        ['file3', 'c'.repeat(3000)],
      ]);
      
      const size = service.estimateProjectSize(files);
      expect(size).toBeGreaterThanOrEqual(6000);
    });
  });
});