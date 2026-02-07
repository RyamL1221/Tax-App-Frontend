'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthError } from '@/types/auth';
import { 
  hasSavedFormData, 
  getFormDataMetadata, 
  restoreFormData, 
  clearFormData 
} from '@/lib/auth/FormDataPreserver';

export interface LoginPageClientProps {
  /**
   * URL to redirect to after successful login
   */
  callbackUrl?: string;
  /**
   * Whether the user was redirected due to session expiration
   */
  expired?: boolean;
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
 * - Form data restoration after re-authentication
 * 
 * Requirements:
 * - 1.2: Redirect user after successful authentication
 * - 6.1: Centered single-column layout on mobile
 * - 6.2: Centered card layout on tablet and desktop
 * - 8.3: Restore form data after successful login
 * - 8.4: Display notification if form data exists
 * 
 * @param props - Component props
 * @returns Login page UI
 */
export default function LoginPageClient({ callbackUrl, expired }: LoginPageClientProps) {
  const router = useRouter();
  const [showExpiredMessage, setShowExpiredMessage] = React.useState(expired || false);
  const [savedFormInfo, setSavedFormInfo] = React.useState<{
    formType: string;
    returnUrl: string;
  } | null>(null);

  /**
   * Check for saved form data on mount
   * Requirement 8.4: Display notification if form data exists
   */
  React.useEffect(() => {
    // Check for saved form data for 1099-DIV form
    const formType = '1099-DIV';
    if (hasSavedFormData(formType)) {
      const metadata = getFormDataMetadata(formType);
      if (metadata) {
        setSavedFormInfo({
          formType: metadata.formType,
          returnUrl: metadata.returnUrl || '/forms/1099-div',
        });
      }
    }
  }, []);

  /**
   * Clear the expired message after it's been shown
   * This prevents the message from reappearing on subsequent renders
   */
  React.useEffect(() => {
    if (expired && showExpiredMessage) {
      // Clear the query parameter from the URL without triggering a navigation
      const url = new URL(window.location.href);
      if (url.searchParams.has('expired')) {
        url.searchParams.delete('expired');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [expired, showExpiredMessage]);

  /**
   * Handle successful authentication
   * Requirement 1.2: Redirect user to dashboard or callback URL
   * Requirement 8.3: Restore form data after successful login
   */
  const handleSuccess = (redirectUrl: string) => {
    // Check if we have saved form data to restore
    if (savedFormInfo) {
      const formType = savedFormInfo.formType;
      
      // Restore the form data (it will be available in sessionStorage for the form component)
      const restoredData = restoreFormData(formType);
      
      if (restoredData) {
        // Form data was successfully restored
        // Note: We don't clear it here - the form component will clear it after loading
        // Redirect to the form page
        router.push(savedFormInfo.returnUrl);
        return;
      } else {
        // Form data couldn't be restored (expired or corrupted)
        // Clear it and proceed with normal redirect
        clearFormData(formType);
      }
    }
    
    // Normal redirect flow (no saved form data or restoration failed)
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
              {/* Session Expiration Message */}
              {showExpiredMessage && (
                <div 
                  className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
                  role="alert"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg 
                        className="h-5 w-5 text-blue-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-blue-700">
                        Your session has expired. Please log in again.
                      </p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        type="button"
                        onClick={() => setShowExpiredMessage(false)}
                        className="inline-flex rounded-md bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                        aria-label="Dismiss message"
                      >
                        <svg 
                          className="h-5 w-5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Form Data Notification */}
              {savedFormInfo && (
                <div 
                  className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"
                  role="alert"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg 
                        className="h-5 w-5 text-green-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        Your form data has been saved
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        Your {savedFormInfo.formType} form data will be restored after you log in.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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
