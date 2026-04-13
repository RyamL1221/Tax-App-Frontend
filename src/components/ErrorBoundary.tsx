'use client';

import React from 'react';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  minimal?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isLoggingOut: boolean;
}

/**
 * ErrorBoundary - Catches React render errors and displays fallback UI.
 * Also integrates with LogoutStateManager to show a logout transition screen.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private handleLogoutStateChange: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isLoggingOut: logoutStateManager.isLogoutInProgress(),
    };
    this.handleLogoutStateChange = () => {
      this.setState({ isLoggingOut: logoutStateManager.isLogoutInProgress() });
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('logoutStateChange', this.handleLogoutStateChange);
  }

  componentWillUnmount() {
    window.removeEventListener('logoutStateChange', this.handleLogoutStateChange);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { isLoggingOut, hasError, error } = this.state;
    const { children, fallback } = this.props;

    // Logout transition takes priority over everything
    if (isLoggingOut) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div
              className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-gray-600 text-sm">Logging out...</p>
          </div>
        </div>
      );
    }

    if (hasError) {
      if (fallback) return <>{fallback}</>;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error icon */}
            <div className="flex justify-center">
              <svg
                role="img"
                aria-label="Error icon"
                className="h-16 w-16 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
              <p className="text-sm text-gray-600">
                We encountered an unexpected error. You can try again or refresh the page.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                aria-label="Try again to reload the content"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                aria-label="Refresh the entire page"
                className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh the entire page
              </button>
            </div>

            {/* Dev-only error details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left text-xs text-gray-500 border border-gray-200 rounded p-3">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">
                  {error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
}

export default ErrorBoundary;
