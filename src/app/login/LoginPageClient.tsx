'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthError } from '@/types/auth';

export interface LoginPageClientProps {
  /**
   * URL to redirect to after successful login
   */
  callbackUrl?: string;
}

/**
 * Client Component: Login Page
 * 
 * This component provides the login user interface with:
 * - Card-based layout for the login form
 * - Page title and description
 * - Responsive design (mobile and desktop)
 * - Error boundary for error handling
 * - Success redirect handling
 * 
 * Requirements:
 * - 1.2: Redirect user after successful authentication
 * - 6.1: Centered single-column layout on mobile
 * - 6.2: Centered card layout on tablet and desktop
 * 
 * @param props - Component props
 * @returns Login page UI
 */
export default function LoginPageClient({ callbackUrl }: LoginPageClientProps) {
  const router = useRouter();

  /**
   * Handle successful authentication
   * Requirement 1.2: Redirect user to dashboard or callback URL
   */
  const handleSuccess = (redirectUrl: string) => {
    const targetUrl = callbackUrl || redirectUrl || '/dashboard';
    router.push(targetUrl);
  };

  /**
   * Handle authentication errors
   * Errors are displayed within the LoginForm component
   */
  const handleError = (error: AuthError) => {
    // Error handling is managed by the LoginForm component
    // This callback is provided for potential future logging or analytics
    console.error('Login error:', error);
  };

  return (
    <ErrorBoundary>
      {/* Main container with responsive layout */}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* 
          Responsive container:
          - Mobile (< 768px): Full width with padding
          - Tablet/Desktop (>= 768px): Fixed max width
          Requirements 6.1, 6.2
        */}
        <div className="w-full max-w-md">
          <Card variant="elevated" className="shadow-xl">
            <CardHeader className="space-y-2 text-center pb-6">
              {/* Page Title */}
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Sign in to your account
              </h1>
              
              {/* Page Description */}
              <p className="text-sm text-gray-600 sm:text-base">
                Enter your credentials to access your tax preparation dashboard
              </p>
            </CardHeader>

            <CardContent className="pb-8">
              {/* Login Form Component */}
              <LoginForm
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </CardContent>
          </Card>

          {/* Additional Links (Optional - can be added later) */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
