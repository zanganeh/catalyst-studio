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
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <EditorErrorBoundary>
        <TestComponent />
      </EditorErrorBoundary>
    );

    expect(screen.getByText('Editor Loading Error')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry Loading Editor');
    
    // Change the condition and click retry
    shouldThrow = false;
    fireEvent.click(retryButton);

    // Error boundary should reset and re-render children
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show warning after multiple retry attempts', () => {
    const TestComponent = () => {
      throw new Error('Test error');
    };

    render(
      <EditorErrorBoundary>
        <TestComponent />
      </EditorErrorBoundary>
    );

    const retryButton = screen.getByText('Retry Loading Editor');
    
    // Click retry multiple times
    fireEvent.click(retryButton);
    fireEvent.click(screen.getByText('Retry Loading Editor'));
    fireEvent.click(screen.getByText('Retry Loading Editor'));

    // After 3 retries, a warning should appear
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