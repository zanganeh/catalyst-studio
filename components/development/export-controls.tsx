'use client';

import React, { useState } from 'react';
import { Download, FileDown, FolderDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { codeExportService } from '@/lib/export/code-export-service';
import { FileNode } from './file-tree';
import { useToast } from '@/hooks/use-toast';

interface ExportControlsProps {
  currentFile?: {
    name: string;
    content: string;
  };
  fileTree: FileNode[];
  fileContents: Map<string, string>;
  projectName?: string;
}

export function ExportControls({
  currentFile,
  fileTree,
  fileContents,
  projectName = 'catalyst-project',
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExportCurrentFile = async () => {
    if (!currentFile) {
      toast({
        title: 'No file selected',
        description: 'Please open a file to export it',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress('Exporting file...');
      
      await codeExportService.exportSingleFile(
        currentFile.content,
        currentFile.name
      );
      
      toast({
        title: 'File exported',
        description: `${currentFile.name} has been downloaded`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportProject = async () => {
    try {
      setIsExporting(true);
      setExportProgress('Preparing project files...');
      
      const projectFiles = new Map<string, string>();
      let fileCount = 0;
      
      const collectFiles = (nodes: FileNode[]) => {
        for (const node of nodes) {
          if (node.type === 'file') {
            const content = fileContents.get(node.id) || 
              `// Placeholder for ${node.name}\n// Content will be generated`;
            projectFiles.set(node.path, content);
            fileCount++;
            setExportProgress(`Processing ${fileCount} files...`);
          } else if (node.type === 'folder' && node.children) {
            collectFiles(node.children);
          }
        }
      };
      
      collectFiles(fileTree);
      
      if (projectFiles.size === 0) {
        toast({
          title: 'No files to export',
          description: 'The project is empty',
          variant: 'destructive',
        });
        return;
      }
      
      setExportProgress('Creating ZIP archive...');
      
      const estimatedSize = codeExportService.estimateProjectSize(projectFiles);
      const formattedSize = codeExportService.formatFileSize(estimatedSize);
      
      if (estimatedSize > 50 * 1024 * 1024) {
        const confirmLarge = window.confirm(
          `The project is approximately ${formattedSize}. This may take a while to download. Continue?`
        );
        if (!confirmLarge) {
          setIsExporting(false);
          setExportProgress(null);
          return;
        }
      }
      
      await codeExportService.exportProject(projectFiles, projectName);
      
      toast({
        title: 'Project exported',
        description: `${projectName}.zip (${formattedSize}) has been downloaded`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export the project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {exportProgress && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{exportProgress}</span>
        </div>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="catalyst-button-secondary"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={handleExportCurrentFile}
            disabled={!currentFile || isExporting}
          >
            <FileDown className="w-4 h-4 mr-2" />
            <span>Export Current File</span>
            {currentFile && (
              <span className="ml-auto text-xs text-gray-500">
                {currentFile.name}
              </span>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleExportProject}
            disabled={isExporting || fileTree.length === 0}
          >
            <FolderDown className="w-4 h-4 mr-2" />
            <span>Export Entire Project</span>
            <span className="ml-auto text-xs text-gray-500">
              ZIP
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}