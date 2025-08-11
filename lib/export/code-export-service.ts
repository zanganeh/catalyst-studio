import { FileNode } from '@/components/development/file-tree';

export interface ExportOptions {
  fileName?: string;
  mimeType?: string;
}

export class CodeExportService {
  private static instance: CodeExportService;

  private constructor() {}

  static getInstance(): CodeExportService {
    if (!CodeExportService.instance) {
      CodeExportService.instance = new CodeExportService();
    }
    return CodeExportService.instance;
  }

  async exportSingleFile(
    content: string,
    fileName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const mimeType = options.mimeType || this.getMimeType(fileName);
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to export file:', error);
      throw new Error(`Failed to export file: ${fileName}`);
    }
  }

  async exportProject(
    files: Map<string, string>,
    projectName: string = 'project'
  ): Promise<void> {
    try {
      const JSZip = await this.loadJSZip();
      const zip = new JSZip();
      
      for (const [path, content] of files.entries()) {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        zip.file(normalizedPath, content);
      }
      
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to export project:', error);
      throw new Error('Failed to export project as ZIP');
    }
  }

  async exportFileTree(
    fileTree: FileNode[],
    fileContents: Map<string, string>,
    projectName: string = 'project'
  ): Promise<void> {
    const files = new Map<string, string>();
    
    const collectFiles = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const content = fileContents.get(node.id) || this.generateMockContent(node);
          files.set(node.path, content);
        } else if (node.type === 'folder' && node.children) {
          collectFiles(node.children);
        }
      }
    };
    
    collectFiles(fileTree);
    
    if (files.size === 0) {
      throw new Error('No files to export');
    }
    
    return this.exportProject(files, projectName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadJSZip(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && !(window as any).JSZip) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.async = true;
      
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error('Failed to load JSZip library'));
        document.head.appendChild(script);
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).JSZip;
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'js': 'text/javascript',
      'jsx': 'text/javascript',
      'css': 'text/css',
      'scss': 'text/scss',
      'json': 'application/json',
      'html': 'text/html',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'svg': 'image/svg+xml',
      'xml': 'application/xml',
      'yaml': 'text/yaml',
      'yml': 'text/yaml',
    };
    
    return mimeTypes[extension || ''] || 'text/plain';
  }

  private generateMockContent(node: FileNode): string {
    const extension = node.extension?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
        return `import React from 'react';\n\nexport default function ${this.toPascalCase(node.name.replace(/\.[^.]+$/, ''))}() {\n  return (\n    <div>\n      <h1>${node.name}</h1>\n      <p>Generated component</p>\n    </div>\n  );\n}`;
      
      case 'ts':
        return `// ${node.name}\n\nexport function example() {\n  console.log('${node.name} loaded');\n  return true;\n}\n\nexport default example;`;
      
      case 'css':
        return `/* ${node.name} */\n\n.container {\n  display: flex;\n  padding: 1rem;\n  background: #f5f5f5;\n}\n\n.title {\n  font-size: 2rem;\n  color: #333;\n}`;
      
      case 'json':
        return JSON.stringify({
          name: node.name,
          version: '1.0.0',
          description: 'Generated file',
          main: 'index.js',
        }, null, 2);
      
      case 'md':
        return `# ${node.name}\n\nThis is a generated markdown file.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3`;
      
      default:
        return `// ${node.name}\n// Generated file content\n\nconsole.log('File: ${node.name}');`;
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  estimateProjectSize(files: Map<string, string>): number {
    let totalSize = 0;
    for (const content of files.values()) {
      totalSize += new Blob([content]).size;
    }
    return totalSize;
  }
}

export const codeExportService = CodeExportService.getInstance();