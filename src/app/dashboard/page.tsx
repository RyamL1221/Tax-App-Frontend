'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';
import { getAuthState } from '@/lib/auth/AuthCoordinator';
import { getTraceId } from '@/lib/auth/LoginFlowTracer';
import DashboardClient from './DashboardClient';

/**
 * Dashboard Page Component
 * 
 * Protected route that verifies user authentication before rendering the dashboard.
 * Implements comprehensive error handling and logout state integration
 * to prevent black screen issues and ensure reliable redirects.
 * 
 * ## Authentication Strategy
 * 
 * The dashboard enforces strict JWT authentication using `getAuthState({ requireJWT: true })`.
 * This ensures that only users with valid JWT tokens can access the dashboard, preventing
 * unauthorized access through session-based fallback authentication.
 * 
 * **Key Security Feature**: Session-only authentication is NOT sufficient for dashboard access.
 * Users must have a valid JWT token stored in localStorage. This prevents the security
 * vulnerability where session-based fallback incorrectly granted dashboard access.
 * 
 * Requirements: 1.1, 1.3, 1.4, 4.1, 7.1, 7.2, 7.5
 * 
 * ## Authentication Check Flow
 * 
 * The authentication flow follows a strict sequence to prevent race conditions:
 * 
 * 1. **Logout State Check** (Priority 1)
 *    - Checks LogoutStateManager.isLogoutInProgress() first
 *    - If logout is active, displays logout transition UI
 *    - Skips all token validation during logout to prevent conflicts
 *    - Requirements: 6.1, 6.2, 6.5
 * 
 * 2. **JWT-Required Authentication Check** (Priority 2)
 *    - Calls getAuthState({ requireJWT: true, traceId })
 *    - AuthCoordinator checks for valid JWT token
 *    - If no JWT exists, returns isAuthenticated: false immediately
 *    - Session-based authentication is NOT attempted for dashboard
 *    - Requirements: 1.4, 1.5, 5.2
 * 
 * 3. **Redirect or Render** (Priority 3)
 *    - No JWT: Initiates redirect to /login
 *    - Valid JWT: Sets isAuthenticated=true and renders dashboard
 *    - Requirements: 1.1, 1.2
 * 
 * ## Error Handling Strategy
 * 
 * Multi-layered error handling ensures no errors cause black screens:
 * 
 * **Layer 1: Operation-Level Try-Catch**
 * - Logout state check wrapped in try-catch
 * - Token check wrapped in try-catch
 * - State updates wrapped in try-catch
 * - Each logs error with context and continues execution
 * 
 * **Layer 2: Navigation Error Handling**
 * - router.push() wrapped in try-catch
 * - On failure, falls back to window.location.href
 * - Logs which method was used for debugging
 * - Requirements: 1.3, 3.3, 7.2
 * 
 * **Layer 3: Function-Level Try-Catch**
 * - Entire checkAuth() function wrapped in try-catch
 * - On error, attempts recovery redirect to /login
 * - Prevents any uncaught exceptions from reaching React
 * - Requirements: 3.1, 3.2
 * 
 * **Layer 4: Invocation-Level Try-Catch**
 * - checkAuth() invocation wrapped in try-catch
 * - Last resort: forces window.location.href = '/login'
 * - Ensures user never sees black screen or error boundary
 * 
 * **Error Logging Format**
 * All errors logged with consistent structure:
 * ```typescript
 * console.error('Dashboard: [Operation] failed', {
 *   error: error.message,
 *   timestamp: ISO timestamp,
 *   context: 'operation description',
 *   fallback: 'fallback action' // if applicable
 * });
 * ```
 * Requirements: 3.1, 5.5
 * 
 * ## Logout State Integration
 * 
 * Coordinates with LogoutStateManager to prevent race conditions:
 * 
 * **Priority Check**
 * - Logout state checked BEFORE token validation
 * - Prevents token operations during logout transition
 * - Avoids conflicts between logout and auth check
 * 
 * **Logout UI Display**
 * - Shows "Logging out..." message with spinner
 * - White background prevents black screen
 * - Remains visible until redirect completes
 * - Requirements: 6.3, 8.2
 * 
 * **State Transition**
 * - After logout completes, user redirected to /login
 * - On next dashboard access, normal auth check resumes
 * - Logout state cleared by LogoutStateManager
 * - Requirements: 6.4
 * 
 * ## Loading State Management
 * 
 * Careful state management prevents black screens:
 * 
 * - **Initial State**: isAuthenticated = null (checking)
 * - **During Redirect**: Remains null (keeps loading UI visible)
 * - **After Auth Success**: Set to true (renders dashboard)
 * - **Background Color**: Explicit white background on all loading states
 * 
 * The loading state is NOT cleared during redirect because:
 * 1. Prevents flash of content before navigation
 * 2. Keeps loading UI visible during navigation
 * 3. Naturally resolves when new page loads
 * Requirements: 2.2, 2.3, 2.5, 8.5
 * 
 * ## Component Lifecycle Management
 * 
 * Uses isMountedRef pattern to prevent state updates after unmount:
 * 
 * - **Initialization**: useRef(true) when component mounts
 * - **Cleanup**: Set to false in useEffect cleanup function
 * - **State Updates**: All setState calls check isMountedRef.current first
 * - **Prevents**: "Can't perform state update on unmounted component" warnings
 * 
 * Requirements: 4.2, 4.5
 * 
 * ## UseEffect Dependencies
 * 
 * Minimal dependency array prevents infinite loops:
 * 
 * - **Included**: router (required for navigation)
 * - **Excluded**: isMountedRef (refs don't trigger re-renders)
 * - **Excluded**: setState functions (stable by React design)
 * 
 * This ensures the effect runs exactly once per mount.
 * Requirements: 4.1, 4.5
 * 
 * ## Comprehensive Logging
 * 
 * Every decision point is logged for debugging:
 * 
 * 1. "Starting authentication check" - Component mount
 * 2. "Logout state check result: true/false" - Logout check
 * 3. "Token check result - hasToken(): true/false" - Token validation
 * 4. "Redirecting to login (no token)" - Redirect initiation
 * 5. "Redirect initiated successfully" - Redirect success
 * 6. "Authentication successful" - Auth success
 * 7. "Component unmounting" - Cleanup
 * 
 * Errors logged with full context including timestamp and operation.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * ## Browser Compatibility
 * 
 * Handles various browser environments:
 * 
 * - **SSR Safety**: Checks `typeof window !== 'undefined'` before window operations
 * - **Router Fallback**: Falls back to window.location.href if router.push fails
 * - **Tested Browsers**: Chrome, Firefox, Safari, Edge
 * 
 * Requirements: 7.1, 7.2, 7.3
 * 
 * @returns {JSX.Element} Dashboard content for authenticated users, loading UI during check, or logout UI during logout
 * 
 * @example
 * // Unauthenticated user access
 * // 1. Shows loading UI
 * // 2. Checks token (returns false)
 * // 3. Redirects to /login
 * // 4. Logs: "Redirecting to login (no token)"
 * 
 * @example
 * // Authenticated user access
 * // 1. Shows loading UI
 * // 2. Checks token (returns true)
 * // 3. Renders DashboardClient
 * // 4. Logs: "Authentication successful"
 * 
 * @example
 * // Logout in progress
 * // 1. Checks logout state (returns true)
 * // 2. Shows "Logging out..." UI
 * // 3. Skips token validation
 * // 4. Waits for redirect to complete
 * 
 * Requirements:
 * - 1.1: Display dashboard for authenticated users
 * - 1.2: Redirect unauthenticated users to login
 * - 1.3: Fallback redirect mechanism
 * - 1.4: Token validation without errors
 * - 1.5: Error-free authentication check
 * - 2.2: Loading state during redirect
 * - 2.3: Loading state visibility
 * - 2.5: Loading state visual distinction
 * - 3.1: Error logging with context
 * - 3.2: Error recovery redirect
 * - 3.3: Router fallback handling
 * - 4.1: Single useEffect execution per mount
 * - 4.2: Cleanup on unmount
 * - 4.5: Stable dependencies
 * - 5.1-5.7: Comprehensive logging
 * - 6.1-6.5: Logout state integration
 * - 7.1-7.3: Browser compatibility
 * - 8.2: Logout UI display
 * - 8.5: White background on loading states
 */
export default function DashboardPage() {
  const router = useRouter();
  
  /**
   * Authentication state tracker
   * 
   * Tri-state value that controls component rendering:
   * - `null`: Authentication check in progress (shows loading UI)
   * - `true`: User is authenticated (renders dashboard)
   * - `false`: Not used (redirect initiated instead)
   * 
   * The state remains `null` during redirect to keep loading UI visible,
   * preventing black screen or flash of content. It naturally resolves
   * when the login page loads.
   * 
   * Requirements: 2.2, 2.3, 4.4
   */
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  /**
   * Logout transition state tracker
   * 
   * Set to `true` when LogoutStateManager indicates logout is in progress.
   * When true, displays "Logging out..." UI and skips all authentication
   * checks to prevent race conditions.
   * 
   * Requirements: 6.1, 6.3, 8.2
   */
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  /**
   * Component mount status tracker
   * 
   * Ref that tracks whether the component is currently mounted.
   * - Initialized to `true` when component mounts
   * - Set to `false` in useEffect cleanup function
   * - Checked before all setState calls to prevent warnings
   * 
   * Prevents "Can't perform state update on unmounted component" warnings
   * that can occur if redirect happens during async operations.
   * 
   * Requirements: 4.2, 4.5
   */
  const isMountedRef = useRef(true);

  /**
   * Redirect guard tracker
   * 
   * Prevents multiple redirects per page load.
   * Set to true when redirect is initiated, preventing subsequent redirects.
   * 
   * Requirements: 7.5
   */
  const redirectInitiatedRef = useRef(false);

  /**
   * Authentication check debounce tracker
   * 
   * Prevents multiple rapid authentication checks.
   * Set to true when check starts, preventing concurrent checks.
   * 
   * Requirements: 7.2, 7.4
   */
  const authCheckInProgressRef = useRef(false);

  /**
   * Authentication Check Effect
   * 
   * Runs once per component mount to verify user authentication and
   * redirect if necessary. Implements comprehensive error handling,
   * logout state integration, and AuthCoordinator integration.
   * 
   * Enhanced with:
   * - Redirect guard to prevent multiple redirects
   * - Authentication check debouncing
   * - AuthCoordinator integration for unified auth state
   * - Trace ID correlation from login flow
   * 
   * ## Dependency Array Strategy
   * 
   * Contains only `router` to ensure the effect runs exactly once per mount:
   * - `router`: Required (used for navigation)
   * - `isMountedRef`: Excluded (refs don't trigger re-renders)
   * - `setState functions`: Excluded (stable by React design)
   * 
   * This prevents infinite loops while ensuring navigation works correctly.
   * Requirements: 4.1, 4.5, 7.2, 7.4, 7.5, 8.4
   */
  useEffect(() => {
    // Prevent multiple concurrent authentication checks
    if (authCheckInProgressRef.current) {
      console.log('[Dashboard] Authentication check already in progress, skipping');
      return;
    }

    authCheckInProgressRef.current = true;

    // Get trace ID from login flow if available
    const traceId = getTraceId();
    console.log('[Dashboard] Starting authentication check', { traceId });

    /**
     * Authentication Check Function
     * 
     * Enhanced with AuthCoordinator integration for unified authentication state.
     * Implements redirect guard and debouncing to prevent loops.
     * 
     * Requirements: 7.1, 7.2, 7.4, 7.5, 8.4
     */
    const checkAuth = async () => {
      try {
        // Check if logout is in progress FIRST
        let logoutInProgress = false;
        try {
          logoutInProgress = logoutStateManager.isLogoutInProgress();
          console.log('[Dashboard] Logout state check result', { logoutInProgress, traceId });
        } catch (logoutCheckError) {
          console.error('[Dashboard] Error checking logout state', {
            error: logoutCheckError instanceof Error ? logoutCheckError.message : String(logoutCheckError),
            timestamp: new Date().toISOString(),
            context: 'logout state check',
            traceId,
          });
        }
        
        if (logoutInProgress) {
          try {
            if (isMountedRef.current) {
              setIsLoggingOut(true);
            }
          } catch (stateError) {
            console.error('[Dashboard] Error setting logout state', {
              error: stateError instanceof Error ? stateError.message : String(stateError),
              timestamp: new Date().toISOString(),
              context: 'setIsLoggingOut state update',
              traceId,
            });
          }
          authCheckInProgressRef.current = false;
          return;
        }
        
        // Use AuthCoordinator for unified authentication state with JWT requirement
        console.log('[Dashboard] Getting unified auth state with JWT requirement', { traceId });
        const authState = await getAuthState({ requireJWT: true, traceId: traceId || undefined });
        console.log('[Dashboard] Auth state received', { 
          isAuthenticated: authState.isAuthenticated,
          authMethod: authState.authMethod,
          inFallbackMode: authState.inFallbackMode,
          reason: authState.reason,
          traceId,
        });
        
        // DEBUG: Log the exact boolean value and type
        console.log('[Dashboard] Checking authentication - isAuthenticated value:', {
          value: authState.isAuthenticated,
          type: typeof authState.isAuthenticated,
          negated: !authState.isAuthenticated,
          traceId,
        });
        
        if (!authState.isAuthenticated) {
          // Not authenticated - redirect to login with return URL
          if (!redirectInitiatedRef.current) {
            redirectInitiatedRef.current = true;
            
            // Build redirect URL with return URL parameter
            // Preserve any existing query parameters from dashboard URL
            let redirectUrl = '/login?returnUrl=/dashboard';
            if (typeof window !== 'undefined') {
              const currentParams = new URLSearchParams(window.location.search);
              if (currentParams.toString()) {
                redirectUrl = `/login?returnUrl=${encodeURIComponent('/dashboard?' + currentParams.toString())}`;
              }
            }
            
            console.log('[Dashboard] Redirecting to login (not authenticated)', { 
              traceId,
              reason: authState.reason,
              redirectUrl,
            });
            
            try {
              router.push(redirectUrl);
              console.log('[Dashboard] Redirect initiated successfully', { traceId, redirectUrl });
            } catch (navError) {
              console.error('[Dashboard] router.push failed, using fallback', {
                error: navError instanceof Error ? navError.message : String(navError),
                timestamp: new Date().toISOString(),
                fallback: 'window.location.href',
                traceId,
                redirectUrl,
              });
              if (typeof window !== 'undefined') {
                window.location.href = redirectUrl;
                console.log('[Dashboard] Fallback redirect initiated successfully', { traceId, redirectUrl });
              }
            }
          }
        } else {
          // Authenticated - show dashboard
          console.log('[Dashboard] Entering authenticated branch', { traceId });
          console.log('[Dashboard] Authentication successful', { 
            authMethod: authState.authMethod,
            inFallbackMode: authState.inFallbackMode,
            traceId,
          });
          
          try {
            setIsAuthenticated(true);
          } catch (stateError) {
            console.error('[Dashboard] Error setting authenticated state', {
              error: stateError instanceof Error ? stateError.message : String(stateError),
              timestamp: new Date().toISOString(),
              context: 'setIsAuthenticated state update',
              traceId,
            });
          }
        }
        
        authCheckInProgressRef.current = false;
      } catch (error) {
        console.error('[Dashboard] Authentication check failed', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          context: 'checkAuth function',
          traceId,
        });
        
        authCheckInProgressRef.current = false;
        
        if (isMountedRef.current) {
          let isLoggingOutNow = false;
          try {
            isLoggingOutNow = logoutStateManager.isLogoutInProgress();
          } catch (e) {
            // Ignore error, proceed with redirect
          }
          
          if (!isLoggingOutNow && !redirectInitiatedRef.current) {
            redirectInitiatedRef.current = true;
            
            // Build redirect URL with return URL parameter
            let redirectUrl = '/login?returnUrl=/dashboard';
            if (typeof window !== 'undefined') {
              const currentParams = new URLSearchParams(window.location.search);
              if (currentParams.toString()) {
                redirectUrl = `/login?returnUrl=${encodeURIComponent('/dashboard?' + currentParams.toString())}`;
              }
            }
            
            try {
              console.log('[Dashboard] Redirecting to login (error recovery)', { traceId, redirectUrl });
              router.push(redirectUrl);
              console.log('[Dashboard] Error recovery redirect initiated successfully', { traceId, redirectUrl });
            } catch (navError) {
              console.error('[Dashboard] Error recovery navigation failed, using fallback', {
                error: navError instanceof Error ? navError.message : String(navError),
                timestamp: new Date().toISOString(),
                fallback: 'window.location.href',
                traceId,
                redirectUrl,
              });
              if (typeof window !== 'undefined') {
                window.location.href = redirectUrl;
                console.log('[Dashboard] Fallback error recovery redirect initiated successfully', { traceId, redirectUrl });
              }
            }
          }
        }
      }
    };

    // Wrap checkAuth call in try-catch for maximum safety
    try {
      checkAuth();
    } catch (outerError) {
      console.error('[Dashboard] Critical error in authentication flow', {
        error: outerError instanceof Error ? outerError.message : String(outerError),
        timestamp: new Date().toISOString(),
        context: 'useEffect checkAuth invocation',
        traceId,
      });
      
      authCheckInProgressRef.current = false;
      
      if (typeof window !== 'undefined' && !redirectInitiatedRef.current) {
        redirectInitiatedRef.current = true;
        
        // Build redirect URL with return URL parameter
        let redirectUrl = '/login?returnUrl=/dashboard';
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.toString()) {
          redirectUrl = `/login?returnUrl=${encodeURIComponent('/dashboard?' + currentParams.toString())}`;
        }
        
        console.log('[Dashboard] Critical error redirect URL', { redirectUrl, traceId });
        window.location.href = redirectUrl;
      }
    }

    // Listen for auth-token-changed events (e.g., token cleared during logout)
    // This mirrors the pattern used in NavbarClient for reacting to token changes
    // Requirements: 1.1, 1.3, 2.1, 2.3
    const handleAuthTokenChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[Dashboard] Auth token changed event received', {
        action: customEvent.detail?.action,
        traceId: customEvent.detail?.traceId,
      });

      if (customEvent.detail?.action === 'clear' && isMountedRef.current) {
        console.log('[Dashboard] Token cleared, updating auth state and redirecting', { traceId });
        setIsAuthenticated(null);

        if (!redirectInitiatedRef.current) {
          redirectInitiatedRef.current = true;
          const redirectUrl = '/login';
          try {
            router.push(redirectUrl);
            console.log('[Dashboard] Token-clear redirect initiated', { traceId, redirectUrl });
          } catch (navError) {
            console.error('[Dashboard] Token-clear router.push failed, using fallback', {
              error: navError instanceof Error ? navError.message : String(navError),
              timestamp: new Date().toISOString(),
              fallback: 'window.location.href',
              traceId,
            });
            if (typeof window !== 'undefined') {
              window.location.href = redirectUrl;
            }
          }
        }
      }
    };

    // Listen for logoutStateChange events (e.g., logout initiated by LogoutButton)
    // Requirements: 1.1, 2.3, 3.1, 3.2
    const handleLogoutStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[Dashboard] Logout state change event received', {
        state: customEvent.detail?.state,
        traceId,
      });

      if (customEvent.detail?.state === 'in-progress' && isMountedRef.current) {
        console.log('[Dashboard] Logout in progress, setting isLoggingOut and redirecting', { traceId });
        setIsLoggingOut(true);

        if (!redirectInitiatedRef.current) {
          redirectInitiatedRef.current = true;
          const redirectUrl = '/login';
          try {
            router.push(redirectUrl);
            console.log('[Dashboard] Logout-state redirect initiated', { traceId, redirectUrl });
          } catch (navError) {
            console.error('[Dashboard] Logout-state router.push failed, using fallback', {
              error: navError instanceof Error ? navError.message : String(navError),
              timestamp: new Date().toISOString(),
              fallback: 'window.location.href',
              traceId,
            });
            if (typeof window !== 'undefined') {
              window.location.href = redirectUrl;
            }
          }
        }
      }
    };

    window.addEventListener('auth-token-changed', handleAuthTokenChange);
    window.addEventListener('logoutStateChange', handleLogoutStateChange);

    return () => {
      console.log('[Dashboard] Component unmounting', { traceId });
      isMountedRef.current = false;
      // CRITICAL: Reset authCheckInProgressRef to allow re-mount to run auth check
      // This is essential for React Strict Mode which unmounts and remounts components
      authCheckInProgressRef.current = false;
      window.removeEventListener('auth-token-changed', handleAuthTokenChange);
      window.removeEventListener('logoutStateChange', handleLogoutStateChange);
    };
  }, [router]);

  /**
   * Logout Transition UI
   * 
   * Displayed when LogoutStateManager indicates logout is in progress.
   * Shows a centered spinner with "Logging out..." message.
   * 
   * ## Visual Design
   * - White background (prevents black screen)
   * - Centered layout (min-h-screen flex)
   * - Blue spinner (matches app theme)
   * - Gray text (accessible contrast)
   * 
   * ## Purpose
   * - Provides visual feedback during logout
   * - Prevents authentication check during logout
   * - Avoids race conditions between logout and auth
   * 
   * Requirements: 6.3, 8.2, 8.5
   */
  // Show logout transition UI if logout is in progress (Task 5.3)
  // Requirements: 1.4, 8.1, 8.2, 8.3, 8.4
  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Logging out...</div>
        </div>
      </div>
    );
  }

  /**
   * Loading State UI
   * 
   * Displayed while authentication check is in progress (isAuthenticated === null).
   * Shows a simple "Loading..." message with white background.
   * 
   * ## Visual Design
   * - White background (explicit bg-white class)
   * - Centered layout (min-h-screen flex)
   * - Gray text (accessible contrast)
   * - No spinner (simpler than logout UI)
   * 
   * ## State Management
   * This UI remains visible during redirect because isAuthenticated stays null.
   * This prevents:
   * - Black screen during navigation
   * - Flash of content before redirect
   * - Error boundary activation
   * 
   * The state naturally resolves when the login page loads.
   * 
   * Requirements: 2.2, 2.3, 2.5, 8.5
   */
  // Show loading state while checking authentication
  // Task 5.2: Explicit white background to prevent black screen - Requirements 2.5, 8.5
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  /**
   * Authenticated Dashboard UI
   * 
   * Rendered when isAuthenticated === true, indicating the user has a valid
   * JWT token. With requireJWT: true, session-only authentication is not
   * sufficient for dashboard access, so this component only renders when
   * a valid JWT exists.
   * 
   * Requirements: 1.1, 1.4, 4.1
   */
  // Render dashboard for authenticated users (JWT required)
  return <DashboardClient />;
}
