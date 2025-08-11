import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorErrorBoundary } from './editor-error-boundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('EditorErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    render(
      <EditorErrorBoundary>
        <div>Test content</div>
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Editor Loading Error')).toBeInTheDocument();
    expect(screen.getByText(/The code editor failed to load/)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should allow retry after error', () => {
    const { rerender } = render(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Editor Loading Error')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry Loading Editor');
    fireEvent.click(retryButton);

    rerender(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={false} />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show warning after multiple retry attempts', () => {
    const { rerender } = render(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    const retryButton = screen.getByText('Retry Loading Editor');
    
    fireEvent.click(retryButton);
    rerender(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    fireEvent.click(retryButton);
    rerender(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    fireEvent.click(retryButton);
    rerender(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    expect(screen.getByText(/Multiple retry attempts detected/)).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;
    
    render(
      <EditorErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Editor Loading Error')).not.toBeInTheDocument();
  });

  it('should log errors to console', () => {
    render(
      <EditorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EditorErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith('Editor Error:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error Info:', expect.any(Object));
  });
});