'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if error occurred during logout (Task 9.2)
    // Requirements: 3.1, 3.2, 3.3
    const isLogoutError = logoutStateManager.isLogoutInProgress();
    
    if (isLogoutError) {
      // Log but don't show error UI during logout
      console.info('ErrorBoundary: Error during logout transition (expected)', error);
      return;
    }
    
    // Log the error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    // Check if logout is in progress FIRST (Task 9.3)
    // Requirements: 3.5, 8.1, 8.2, 8.3
    if (logoutStateManager.isLogoutInProgress()) {
      // Show logout transition instead of error UI
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Logging out...</div>
          </div>
        </div>
      );
    }
    
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="min-h-[400px] flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 text-gray-400 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-label="Error icon"
                role="img"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={this.handleRetry}
                className="w-full"
                aria-label="Try again to reload the content"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
                aria-label="Refresh the entire page"
              >
                Refresh Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;