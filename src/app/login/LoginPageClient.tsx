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
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';
import { getAuthState } from '@/lib/auth/AuthCoordinator';

// --- Redirect Loop Detection ---
// Tracks redirect count within a time window to detect login↔dashboard loops.
// If more than MAX_REDIRECTS occur within LOOP_DETECTION_WINDOW ms, we stop
// auto-redirecting and show the login form instead.
// Requirements: 2.4
const LOOP_DETECTION_KEY = 'auth_redirect_count';
const LOOP_DETECTION_WINDOW = 5000; // 5 seconds
const MAX_REDIRECTS = 2;

/**
 * Detect whether a redirect loop is occurring.
 * Returns true if more than MAX_REDIRECTS have been recorded within the
 * LOOP_DETECTION_WINDOW, indicating a login↔dashboard redirect cycle.
 *
 * Requirements: 2.4
 */
function detectRedirectLoop(): boolean {
  try {
    const stored = sessionStorage.getItem(LOOP_DETECTION_KEY);
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < LOOP_DETECTION_WINDOW) {
        return count >= MAX_REDIRECTS;
      }
    }
  } catch {
    // sessionStorage may be unavailable (e.g., SSR or privacy mode)
  }
  return false;
}

/**
 * Record that a redirect is about to occur.
 * Increments the redirect counter within the current time window, or starts
 * a new window if the previous one has expired.
 *
 * Requirements: 2.4
 */
function recordRedirect(): void {
  try {
    const stored = sessionStorage.getItem(LOOP_DETECTION_KEY);
    let count = 1;
    let timestamp = Date.now();
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < LOOP_DETECTION_WINDOW) {
        count = parsed.count + 1;
        timestamp = parsed.timestamp; // keep original timestamp
      }
    }
    sessionStorage.setItem(LOOP_DETECTION_KEY, JSON.stringify({ count, timestamp }));
  } catch {
    // sessionStorage may be unavailable
  }
}

/**
 * Clear the redirect loop counter.
 * Called after explicit credential submission to reset the loop detector.
 *
 * Requirements: 2.4
 */
function clearRedirectLoopCounter(): void {
  try {
    sessionStorage.removeItem(LOOP_DETECTION_KEY);
  } catch {
    // sessionStorage may be unavailable
  }
}

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
 * - Authentication state checking (redirects if already logged in)
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
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [savedFormInfo, setSavedFormInfo] = React.useState<{
    formType: string;
    returnUrl: string;
  } | null>(null);

  /**
   * Check if user is already authenticated
   * If so, redirect to dashboard (unless they have saved form data)
   * 
   * Also listen for storage events to sync authentication state across tabs
   * Requirements: 7.5 (jwt-only-authentication)
   */
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await getAuthState();
        console.log('[LoginPageClient] Auth state:', authState);
        
        // Check for saved form data first
        const formType = '1099-DIV';
        const hasSavedData = hasSavedFormData(formType);
        
        if (hasSavedData) {
          const metadata = getFormDataMetadata(formType);
          if (metadata) {
            setSavedFormInfo({
              formType: metadata.formType,
              returnUrl: metadata.returnUrl || '/forms/1099-div',
            });
          }
        }
        
        // Determine if user arrived via redirect (has returnUrl/callbackUrl or expired flag)
        const arrivedViaRedirect = !!callbackUrl || !!expired;
        
        // Only auto-redirect to dashboard if:
        // 1. User is authenticated
        // 2. No saved form data to restore
        // 3. User navigated to /login organically (no callbackUrl, no expired flag)
        // 4. No redirect loop detected
        //
        // If the user arrived via redirect (e.g., dashboard sent them here because
        // it thought they were unauthenticated), do NOT auto-redirect back.
        // This breaks the login↔dashboard redirect cycle.
        // Requirements: 2.1, 2.3, 2.4, 2.5
        if (authState.isAuthenticated && !hasSavedData && !arrivedViaRedirect) {
          // Check for redirect loop before auto-redirecting
          if (detectRedirectLoop()) {
            console.warn('[LoginPageClient] Redirect loop detected, stopping auto-redirect and showing login form');
            setIsCheckingAuth(false);
            return;
          }
          
          console.log('[LoginPageClient] User already authenticated (organic visit), redirecting to dashboard');
          recordRedirect();
          router.push('/dashboard');
          return;
        }
        
        if (authState.isAuthenticated && arrivedViaRedirect) {
          console.log('[LoginPageClient] User authenticated but arrived via redirect (callbackUrl=%s, expired=%s) — showing login form to prevent redirect loop', callbackUrl, expired);
        }
        
        // User not authenticated, has saved form data, or arrived via redirect — show login form
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('[LoginPageClient] Error checking auth state:', error);
        // On error, assume not authenticated and show login form
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    
    // Listen for storage events to sync across tabs
    // Requirements: 7.5 (jwt-only-authentication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token') {
        console.log('[LoginPageClient] JWT token changed in another tab, re-checking auth');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, callbackUrl, expired]);

  /**
   * Clear logout state on mount
   * 
   * This ensures the logout state is reset after the logout redirect completes.
   * The logout state is set during the logout process to prevent race conditions
   * where components attempt to access authentication state after tokens are cleared.
   * 
   * Requirements: 2.4, 4.3
   */
  React.useEffect(() => {
    logoutStateManager.clearLogoutState();
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
    // Clear the redirect loop counter after explicit credential submission
    // Requirements: 2.4
    clearRedirectLoopCounter();
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

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
