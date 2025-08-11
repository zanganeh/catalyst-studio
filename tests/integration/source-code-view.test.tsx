import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SourceCodeView } from '@/components/development/source-code-view';
import { FileNode } from '@/components/development/file-tree';

const mockFiles: FileNode[] = [
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
      {
        id: '3',
        name: 'app.tsx',
        type: 'file',
        path: '/src/app.tsx',
        extension: 'tsx',
      },
    ],
  },
  {
    id: '4',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    extension: 'json',
  },
];

describe('SourceCodeView Integration', () => {
  it('should render file tree and editor area', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('Explorer')).toBeInTheDocument();
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    expect(screen.getByText('No file open')).toBeInTheDocument();
  });

  it('should open file when clicked in file tree', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src'));
    
    await waitFor(() => {
      expect(screen.getByText('index.ts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('index.ts'));

    await waitFor(() => {
      expect(screen.queryByText('No file open')).not.toBeInTheDocument();
      expect(screen.getByText(/File: \/src\/index.ts/)).toBeInTheDocument();
    });
  });

  it('should display tabs for open files', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src'));
    
    await waitFor(() => {
      expect(screen.getByText('index.ts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('index.ts'));

    await waitFor(() => {
      const tabs = screen.getByRole('tablist');
      expect(tabs).toBeInTheDocument();
      
      const indexTab = screen.getByRole('tab', { name: /index.ts/ });
      expect(indexTab).toBeInTheDocument();
      expect(indexTab).toHaveAttribute('aria-selected', 'true');
    });

    fireEvent.click(screen.getByText('app.tsx'));

    await waitFor(() => {
      const appTab = screen.getByRole('tab', { name: /app.tsx/ });
      expect(appTab).toBeInTheDocument();
    });
  });

  it('should switch between open files using tabs', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src'));
    
    fireEvent.click(screen.getByText('index.ts'));
    fireEvent.click(screen.getByText('app.tsx'));

    await waitFor(() => {
      expect(screen.getByText(/File: \/src\/app.tsx/)).toBeInTheDocument();
    });

    const indexTab = screen.getByRole('tab', { name: /index.ts/ });
    fireEvent.click(indexTab);

    await waitFor(() => {
      expect(screen.getByText(/File: \/src\/index.ts/)).toBeInTheDocument();
    });
  });

  it('should close files when close button is clicked', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('package.json'));

    await waitFor(() => {
      const tab = screen.getByRole('tab', { name: /package.json/ });
      expect(tab).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close package.json');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /package.json/ })).not.toBeInTheDocument();
      expect(screen.getByText('No file open')).toBeInTheDocument();
    });
  });

  it('should resize sidebar when dragging divider', async () => {
    const { container } = render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('Explorer')).toBeInTheDocument();
    });

    const resizer = container.querySelector('.cursor-col-resize');
    expect(resizer).toBeInTheDocument();

    const sidebar = container.querySelector('[style*="width"]');
    const initialWidth = sidebar?.getAttribute('style');
    expect(initialWidth).toContain('width: 250px');

    fireEvent.mouseDown(resizer!, { clientX: 250 });
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      const updatedSidebar = container.querySelector('[style*="width"]');
      const updatedWidth = updatedSidebar?.getAttribute('style');
      expect(updatedWidth).toContain('width: 300px');
    });
  });

  it('should show loading state initially', () => {
    render(<SourceCodeView initialFiles={mockFiles} />);
    
    expect(screen.getByText('Loading source code view...')).toBeInTheDocument();
  });

  it('should handle empty file tree', async () => {
    render(<SourceCodeView initialFiles={[]} />);

    await waitFor(() => {
      expect(screen.getByText('No files to display')).toBeInTheDocument();
    });
  });

  it('should maintain file selection state in tree when switching tabs', async () => {
    const { container } = render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src'));
    fireEvent.click(screen.getByText('index.ts'));
    fireEvent.click(screen.getByText('app.tsx'));

    const indexTab = screen.getByRole('tab', { name: /index.ts/ });
    fireEvent.click(indexTab);

    await waitFor(() => {
      const selectedNode = container.querySelector('[aria-selected="true"]');
      expect(selectedNode).toHaveTextContent('index.ts');
    });
  });

  it('should support keyboard shortcuts for tab navigation', async () => {
    render(<SourceCodeView initialFiles={mockFiles} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src'));
    fireEvent.click(screen.getByText('index.ts'));
    fireEvent.click(screen.getByText('app.tsx'));
    fireEvent.click(screen.getByText('package.json'));

    await waitFor(() => {
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true });

    await waitFor(() => {
      const selectedTab = screen.getByRole('tab', { selected: true });
      expect(selectedTab).toHaveTextContent('package.json');
    });
  });
});