'use client';

/**
 * FormAuthGuard - Ensures valid JWT authentication before rendering forms
 * 
 * This component wraps form pages to validate JWT token presence before rendering.
 * It performs the following checks:
 * 1. Validates JWT token is present using AuthCoordinator
 * 2. Redirects to login with return URL if JWT token is missing
 * 3. Shows loading state during validation
 * 4. Shows error state for validation failures
 * 
 * Requirements (jwt-only-authentication spec):
 * - 3.3: Form components use FormAuthGuard with JWT token validation
 * - 4.1: Guards use AuthCoordinator.getAuthState() for token validation
 * - 4.2: Guards redirect to login with return URL when JWT missing
 * - 4.3: Guards clear invalid tokens before redirecting
 * - 4.4: Guards provide loading state during verification
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthState } from '@/lib/auth/AuthCoordinator';
import { clearToken } from '@/lib/api/tokenManager';

export interface FormAuthGuardProps {
  children: React.ReactNode;
  onAuthFailure?: (reason: string) => void;
}

/**
 * FormAuthGuard component
 * 
 * Wraps form pages to ensure JWT authentication is valid before rendering.
 * Redirects to login when JWT token is missing or invalid.
 * 
 * @param children - The form content to render when authenticated
 * @param onAuthFailure - Optional callback when authentication fails
 */
export function FormAuthGuard({
  children,
  onAuthFailure,
}: FormAuthGuardProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('[FormAuthGuard] Starting JWT authentication validation', {
          pathname,
        });

        // Validate current authentication state using AuthCoordinator
        const auth = await getAuthState();

        console.log('[FormAuthGuard] Auth state received', {
          isAuthenticated: auth.isAuthenticated,
          authMethod: auth.authMethod,
          pathname,
        });

        if (auth.isAuthenticated) {
          // Authentication is valid
          console.log('[FormAuthGuard] Authentication valid', {
            pathname,
          });
          setAuthState('authenticated');
          return;
        }

        // Authentication is invalid
        const reason = auth.reason || 'Authentication required for form access';
        
        console.warn('[FormAuthGuard] Authentication failed - redirecting to login', {
          pathname,
          reason,
        });

        // Clear any invalid tokens
        if (!auth.isAuthenticated) {
          try {
            await clearToken('FormAuthGuard');
            console.log('[FormAuthGuard] Cleared invalid token', { pathname });
          } catch (clearError) {
            console.error('[FormAuthGuard] Error clearing token', {
              error: clearError instanceof Error ? clearError.message : String(clearError),
              pathname,
            });
          }
        }

        // Build redirect URL with return URL
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = `/login?returnUrl=${returnUrl}`;

        console.log('[FormAuthGuard] Redirecting to login', {
          pathname,
          loginUrl,
          reason,
        });

        // Call optional failure callback
        if (onAuthFailure) {
          onAuthFailure(reason);
        }

        // Set error state briefly before redirect
        setErrorMessage(reason);
        setAuthState('error');

        // Redirect to login
        router.push(loginUrl);
      } catch (error) {
        // Handle unexpected errors
        const errorMsg = error instanceof Error ? error.message : 'Authentication validation failed';
        
        console.error('[FormAuthGuard] Validation error', {
          pathname,
          error: errorMsg,
        });

        setErrorMessage(errorMsg);
        setAuthState('error');

        // Call optional failure callback
        if (onAuthFailure) {
          onAuthFailure(errorMsg);
        }

        // Redirect to login on error
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = `/login?returnUrl=${returnUrl}`;
        router.push(loginUrl);
      }
    }

    checkAuth();
    
    // Listen for storage events to sync across tabs
    // Requirements: 7.5 (jwt-only-authentication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token') {
        console.log('[FormAuthGuard] JWT token changed in another tab, re-checking auth');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname, onAuthFailure, router]);

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating authentication...</p>
        </div>
      </div>
    );
  }

  // Error state (shown briefly before redirect)
  if (authState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
