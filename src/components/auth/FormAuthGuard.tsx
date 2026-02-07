'use client';

/**
 * FormAuthGuard - Ensures valid authentication before rendering forms
 * 
 * This component wraps form pages to validate authentication state before rendering.
 * It performs the following checks:
 * 1. Validates both session and JWT token are present
 * 2. Attempts JWT recovery if missing but session appears valid
 * 3. Redirects to login with return URL if authentication cannot be recovered
 * 4. Shows loading state during validation
 * 5. Shows error state for validation failures
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { validateAuth, recoverJWT, getAuthState } from '@/lib/auth/AuthCoordinator';
import { logAuthEvent, logRedirect, createAuthState } from '@/lib/auth/AuthLogger';

export interface FormAuthGuardProps {
  children: React.ReactNode;
  requiresJWT?: boolean;
  onAuthFailure?: (reason: string) => void;
}

/**
 * FormAuthGuard component
 * 
 * Wraps form pages to ensure authentication is valid before rendering.
 * Handles JWT recovery and redirects to login when necessary.
 * 
 * @param children - The form content to render when authenticated
 * @param requiresJWT - Whether JWT token is required (default: true)
 * @param onAuthFailure - Optional callback when authentication fails
 */
export function FormAuthGuard({
  children,
  requiresJWT = true,
  onAuthFailure,
}: FormAuthGuardProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        logAuthEvent(
          'FormAuthGuard: Starting authentication validation',
          'info',
          getAuthState(),
          {
            pathname,
            requiresJWT,
          }
        );

        // Validate current authentication state
        const validation = validateAuth();

        if (validation.valid) {
          // Authentication is valid
          logAuthEvent(
            'FormAuthGuard: Authentication valid',
            'info',
            getAuthState(),
            {
              pathname,
            }
          );
          setAuthState('authenticated');
          return;
        }

        // Authentication is invalid - check if we can recover
        if (validation.canRecover && requiresJWT) {
          logAuthEvent(
            'FormAuthGuard: Attempting JWT recovery',
            'info',
            getAuthState(),
            {
              pathname,
              reason: validation.reason,
            }
          );

          // Attempt to recover JWT from session
          const recoveredJWT = await recoverJWT();

          if (recoveredJWT) {
            // Recovery successful
            logAuthEvent(
              'FormAuthGuard: JWT recovery successful',
              'info',
              getAuthState(),
              {
                pathname,
              }
            );
            setAuthState('authenticated');
            return;
          }

          // Recovery failed
          logAuthEvent(
            'FormAuthGuard: JWT recovery failed',
            'warn',
            getAuthState(),
            {
              pathname,
              reason: 'Recovery returned null',
            }
          );
        }

        // Cannot recover - redirect to login
        const reason = validation.reason || 'Authentication required';
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = `/login?returnUrl=${returnUrl}&reason=${encodeURIComponent(reason)}`;

        logRedirect(
          pathname,
          loginUrl,
          reason,
          getAuthState(),
          {
            canRecover: validation.canRecover,
            requiresJWT,
          }
        );

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
        
        logAuthEvent(
          'FormAuthGuard: Validation error',
          'error',
          getAuthState(),
          {
            pathname,
            error: errorMsg,
          }
        );

        setErrorMessage(errorMsg);
        setAuthState('error');

        // Call optional failure callback
        if (onAuthFailure) {
          onAuthFailure(errorMsg);
        }

        // Redirect to login on error
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = `/login?returnUrl=${returnUrl}&reason=${encodeURIComponent(errorMsg)}`;
        router.push(loginUrl);
      }
    }

    checkAuth();
  }, [pathname, requiresJWT, onAuthFailure, router]);

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
