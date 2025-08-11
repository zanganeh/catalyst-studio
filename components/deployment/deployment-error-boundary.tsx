'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DeploymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Deployment Error Boundary caught an error:', error, errorInfo);
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      this.logErrorToService(error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementation for error tracking service
    // e.g., Sentry, LogRocket, etc.
    console.log('Logging error to service:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/studio/overview';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#212121] to-black flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Deployment Error
              </CardTitle>
              <CardDescription className="text-white/60">
                {this.props.fallbackMessage || 'Something went wrong with the deployment interface'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details */}
              {this.state.error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">
                    Error Details
                  </h3>
                  <p className="text-xs text-red-400/80 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              {/* Stack Trace (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <summary className="text-sm font-semibold text-white/80 cursor-pointer">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-white/60 overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              {/* Component Stack (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
                <details className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <summary className="text-sm font-semibold text-white/80 cursor-pointer">
                    Component Stack (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-white/60 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              {/* Recovery Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-[#FF5500] text-white hover:bg-[#FF5500]/80"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Overview
                </Button>
              </div>
              
              {/* Help Text */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  If this error persists, please contact support or check the system settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}