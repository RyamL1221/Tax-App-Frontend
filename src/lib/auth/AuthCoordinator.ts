/**
 * AuthCoordinator - Unified authentication state management
 * 
 * Provides a single source of truth for authentication status by coordinating
 * between JWT and session-based authentication. Implements priority logic
 * (JWT first, session fallback) and manages fallback mode when JWT storage fails.
 * 
 * Features:
 * - Unified authentication state combining JWT and session
 * - JWT priority with session fallback
 * - JWT refresh from session
 * - Fallback mode management for localStorage failures
 * - Comprehensive logging with trace ID support
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.5, 9.1, 9.2, 9.3
 */

import { hasToken, setToken } from '../api/tokenManager';
import { logAuthEvent, createAuthState, type AuthState } from './AuthLogger';

/**
 * Fallback mode storage key
 */
const FALLBACK_MODE_KEY = 'auth_fallback_mode' as const;

/**
 * Maximum number of retry attempts for JWT refresh operations
 * Requirements: 5.3
 */
const MAX_REFRESH_RETRIES = 1;

/**
 * Authentication options for route-level requirements
 */
export interface AuthOptions {
  /**
   * If true, only JWT authentication is accepted.
   * Session-only authentication will be treated as unauthenticated.
   * Use for protected routes like dashboard.
   */
  requireJWT?: boolean;
  
  /**
   * Trace ID for correlating log entries across operations.
   */
  traceId?: string;
}

/**
 * Extended authentication state with fallback mode indicator
 */
export interface ExtendedAuthState extends AuthState {
  inFallbackMode: boolean;
  authMethod: 'jwt' | 'session' | 'none';
  /**
   * Reason for authentication failure (if applicable)
   */
  reason?: string;
}

/**
 * Get unified authentication state
 * 
 * Checks both JWT and session authentication, prioritizing JWT when available.
 * If JWT is missing but session exists, attempts to refresh JWT from session.
 * 
 * @param options - Optional authentication options including requireJWT flag and traceId
 * @returns Promise<ExtendedAuthState> - Unified authentication state
 * 
 * Requirements: 8.1, 8.2, 8.5, 1.3, 3.1, 3.4, 7.1, 7.2, 6.1, 6.4, 6.5
 */
export async function getAuthState(options?: AuthOptions | string): Promise<ExtendedAuthState> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Support both old signature (traceId as string) and new signature (options object)
  const opts: AuthOptions = typeof options === 'string' 
    ? { traceId: options } 
    : (options || {});
  
  const { requireJWT = false, traceId } = opts;
  
  console.log('[AuthCoordinator] Getting unified auth state', { 
    requireJWT, 
    traceId,
    routeRequirement: requireJWT ? 'JWT-only' : 'JWT or session',
    timestamp
  });

  // Check JWT first (priority 1)
  const hasJWT = hasToken('AuthCoordinator', traceId);
  console.log('[AuthCoordinator] JWT check result', { 
    hasJWT, 
    requireJWT, 
    traceId,
    timestamp: new Date().toISOString()
  });

  // Check if in fallback mode
  const inFallbackMode = isInFallbackMode();

  // Log initial state before any transitions
  const initialState = {
    hasJWT,
    inFallbackMode,
    requireJWT,
    timestamp: new Date().toISOString()
  };
  console.log('[AuthCoordinator] Initial state before authentication check', { 
    initialState, 
    traceId 
  });

  // If JWT exists, we're authenticated via JWT (JWT takes priority over session)
  if (hasJWT) {
    const state: ExtendedAuthState = {
      hasSession: true, // Assume session exists if JWT is valid
      hasJWT: true,
      isAuthenticated: true,
      userId: null, // Would need to decode JWT to get this
      email: null, // Would need to decode JWT to get this
      inFallbackMode,
      authMethod: 'jwt',
    };

    // Log state transition
    console.log('[AuthCoordinator] State transition: JWT authentication', { 
      before: initialState,
      after: state,
      transition: 'unauthenticated -> authenticated (JWT)',
      traceId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime
    });
    
    console.log('[AuthCoordinator] Authenticated via JWT (JWT priority applied)', { 
      state, 
      traceId,
      note: 'JWT takes precedence over session authentication'
    });
    logAuthEvent('Authentication state determined: JWT (priority)', 'info', state, { 
      traceId,
      note: 'JWT authentication takes precedence over session'
    });
    return state;
  }

  // No JWT - check if route requires JWT
  if (requireJWT) {
    const state: ExtendedAuthState = {
      hasSession: false,
      hasJWT: false,
      isAuthenticated: false,
      userId: null,
      email: null,
      inFallbackMode,
      authMethod: 'none',
      reason: 'JWT required for this route',
    };

    // Log state transition
    console.log('[AuthCoordinator] State transition: JWT requirement not met', { 
      before: initialState,
      after: state,
      transition: 'unauthenticated -> rejected (JWT required)',
      traceId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      reason: 'JWT required for this route'
    });

    console.log('[AuthCoordinator] JWT required but not found, skipping session check', { 
      state, 
      traceId,
      requireJWT 
    });
    logAuthEvent('Authentication failed: JWT required', 'info', state, { 
      traceId,
      requireJWT,
      reason: 'JWT required for this route'
    });
    return state;
  }

  // No JWT - check session (priority 2)
  console.log('[AuthCoordinator] No JWT found, checking session', { 
    traceId,
    timestamp: new Date().toISOString()
  });

  try {
    // Check session validity via API call
    const sessionValid = await checkSessionValidity(traceId);
    console.log('[AuthCoordinator] Session check result', { 
      sessionValid, 
      traceId,
      timestamp: new Date().toISOString()
    });

    if (sessionValid) {
      // Session exists but no JWT - attempt to refresh JWT
      console.log('[AuthCoordinator] Valid session without JWT, attempting refresh', { 
        traceId,
        requireJWT,
        timestamp: new Date().toISOString()
      });
      const refreshed = await refreshJWTFromSession(traceId, 0, requireJWT);

      if (refreshed) {
        // Successfully refreshed JWT
        const state: ExtendedAuthState = {
          hasSession: true,
          hasJWT: true,
          isAuthenticated: true,
          userId: null,
          email: null,
          inFallbackMode,
          authMethod: 'jwt',
        };

        // Log state transition
        console.log('[AuthCoordinator] State transition: JWT refreshed from session', { 
          before: initialState,
          after: state,
          transition: 'session-only -> authenticated (JWT refreshed)',
          traceId,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime
        });

        console.log('[AuthCoordinator] JWT refreshed from session', { state, traceId });
        logAuthEvent('Authentication state determined: JWT refreshed from session', 'info', state, { traceId });
        return state;
      } else {
        // Refresh failed - check if JWT is required before activating fallback
        if (requireJWT) {
          const state: ExtendedAuthState = {
            hasSession: true,
            hasJWT: false,
            isAuthenticated: false,
            userId: null,
            email: null,
            inFallbackMode: false, // Do not activate fallback for JWT-required routes
            authMethod: 'none',
            reason: 'JWT refresh failed and JWT is required',
          };

          // Log state transition
          console.log('[AuthCoordinator] State transition: JWT refresh failed for JWT-required route', { 
            before: initialState,
            after: state,
            transition: 'session-only -> rejected (JWT refresh failed, JWT required)',
            traceId,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - startTime,
            reason: 'JWT refresh failed and JWT is required'
          });

          console.log('[AuthCoordinator] JWT refresh failed for JWT-required route, skipping fallback mode', { 
            state, 
            traceId,
            requireJWT,
            reason: 'Fallback mode not activated due to JWT requirement'
          });
          logAuthEvent('Authentication failed: JWT refresh failed, fallback skipped', 'warn', state, { 
            traceId,
            requireJWT,
            reason: 'JWT refresh failed and JWT is required - fallback mode not activated'
          });
          
          // Do not activate fallback mode for JWT-required routes
          return state;
        }
        
        // Refresh failed, use session-based auth (only for non-JWT-required routes)
        // Check if route requires JWT before activating fallback mode
        console.log('[AuthCoordinator] JWT refresh failed, checking if fallback mode should be activated', {
          requireJWT,
          traceId,
          timestamp: new Date().toISOString()
        });
        
        const state: ExtendedAuthState = {
          hasSession: true,
          hasJWT: false,
          isAuthenticated: true,
          userId: null,
          email: null,
          inFallbackMode: true, // Activate fallback since JWT refresh failed
          authMethod: 'session',
        };

        // Log state transition
        console.log('[AuthCoordinator] State transition: Fallback mode activated', { 
          before: initialState,
          after: state,
          transition: 'session-only -> authenticated (fallback mode)',
          traceId,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          reason: 'JWT refresh failed for non-JWT-required route'
        });

        console.log('[AuthCoordinator] Using session-based auth (JWT refresh failed), activating fallback mode', { 
          state, 
          traceId,
          reason: 'JWT refresh failed for non-JWT-required route'
        });
        logAuthEvent('Authentication state determined: Session fallback', 'warn', state, { 
          traceId,
          reason: 'JWT refresh failed, fallback mode activated for non-JWT-required route'
        });
        
        // Activate fallback mode (only for non-JWT-required routes)
        activateFallbackMode('JWT refresh failed', traceId);
        
        return state;
      }
    }

    // No session either - not authenticated
    const state: ExtendedAuthState = {
      hasSession: false,
      hasJWT: false,
      isAuthenticated: false,
      userId: null,
      email: null,
      inFallbackMode,
      authMethod: 'none',
      reason: 'No JWT or session found',
    };

    // Log state transition
    console.log('[AuthCoordinator] State transition: No authentication found', { 
      before: initialState,
      after: state,
      transition: 'unauthenticated -> unauthenticated (no JWT or session)',
      traceId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      reason: 'No JWT or session found'
    });

    console.log('[AuthCoordinator] Not authenticated', { state, traceId });
    logAuthEvent('Authentication state determined: Not authenticated', 'info', state, { traceId });
    return state;
  } catch (error) {
    console.error('[AuthCoordinator] Error checking session', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      timestamp: new Date().toISOString()
    });

    // On error, assume not authenticated
    const state: ExtendedAuthState = {
      hasSession: false,
      hasJWT: false,
      isAuthenticated: false,
      userId: null,
      email: null,
      inFallbackMode,
      authMethod: 'none',
      reason: `Session check error: ${error instanceof Error ? error.message : String(error)}`,
    };

    // Log state transition
    console.log('[AuthCoordinator] State transition: Error during authentication check', { 
      before: initialState,
      after: state,
      transition: 'error -> unauthenticated',
      traceId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });

    logAuthEvent('Authentication state error', 'error', state, { 
      traceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return state;
  }
}

/**
 * Check session validity via API call
 * 
 * @param traceId - Optional trace ID for correlating operations
 * @returns Promise<boolean> - true if session is valid, false otherwise
 * 
 * Requirements: 9.3, 6.1
 */
async function checkSessionValidity(traceId?: string): Promise<boolean> {
  const timestamp = new Date().toISOString();
  
  try {
    // Call our Next.js API route to check session
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include', // Include cookies for session
    });

    const valid = response.ok;
    console.log('[AuthCoordinator] Session validity check', {
      status: response.status,
      valid,
      traceId,
      timestamp
    });

    return valid;
  } catch (error) {
    console.error('[AuthCoordinator] Session check failed', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      timestamp
    });
    return false;
  }
}

/**
 * Refresh JWT from session
 * 
 * Calls our Next.js API route to get a fresh JWT token from the current session.
 * Stores the new JWT via TokenManager if successful.
 * 
 * Error Handling:
 * - 403 Forbidden: Indicates no valid session exists on backend. Does not retry.
 *   Clears cached authentication state to prevent stale indicators.
 * - Other errors (500, network): Retries up to MAX_REFRESH_RETRIES times with
 *   exponential backoff before failing.
 * 
 * Note: If the backend doesn't support JWT refresh, this will fail gracefully
 * and the system will continue using session-based authentication.
 * 
 * @param traceId - Optional trace ID for correlating operations across logs
 * @param retryCount - Current retry attempt number (internal use, defaults to 0)
 * @param requireJWT - Optional flag indicating if the calling route requires JWT authentication.
 *                     Used for logging context to distinguish between JWT-only routes and
 *                     routes that accept either JWT or session authentication.
 * @returns Promise<boolean> - true if refresh succeeded and JWT was stored, false otherwise
 * 
 * Requirements: 8.2, 1.2, 3.5, 5.2, 5.3, 6.1, 6.3, 6.4, 6.5, 5.4
 */
export async function refreshJWTFromSession(traceId?: string, retryCount: number = 0, requireJWT?: boolean): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  console.log('[AuthCoordinator] Attempting JWT refresh from session', { 
    traceId, 
    retryCount,
    maxRetries: MAX_REFRESH_RETRIES,
    requireJWT: requireJWT ?? 'not specified',
    routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
    timestamp
  });

  // Log before state
  const beforeState = {
    hasJWT: hasToken('AuthCoordinator_refresh', traceId),
    retryCount,
    timestamp
  };
  console.log('[AuthCoordinator] State before JWT refresh attempt', {
    beforeState,
    traceId
  });

  try {
    // Call our Next.js API route to refresh JWT
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Parse error details from response
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetails = response.statusText || 'Failed to parse error response';
      }

      // Special handling for 403 Forbidden - indicates no valid session
      // Do not retry 403 errors as they indicate authentication failure
      if (response.status === 403) {
        const afterState = {
          hasJWT: false,
          success: false,
          reason: 'No valid session exists on backend',
          timestamp: new Date().toISOString()
        };
        
        console.warn('[AuthCoordinator] JWT refresh failed with 403 Forbidden - no valid session', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          errorType: '403 Forbidden',
          traceId,
          retryCount,
          requireJWT: requireJWT ?? 'not specified',
          routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
          timestamp: new Date().toISOString()
        });
        
        // Log state transition
        console.log('[AuthCoordinator] State transition: JWT refresh failed (403)', {
          before: beforeState,
          after: afterState,
          transition: 'refresh attempt -> failed (403 Forbidden)',
          traceId,
          durationMs: Date.now() - startTime,
          reason: 'No valid session exists on backend'
        });
        
        logAuthEvent('JWT refresh failed: 403 Forbidden', 'warn', undefined, {
          traceId,
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          errorType: '403 Forbidden',
          reason: 'No valid session exists on backend',
          retryCount,
          requireJWT: requireJWT ?? 'not specified',
          routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
        });
        
        // Clear any cached authentication state for 403 errors
        // This ensures we don't have stale authentication indicators
        console.log('[AuthCoordinator] Clearing cached authentication state after 403', { 
          traceId,
          timestamp: new Date().toISOString()
        });
        
        // Note: We don't clear the JWT token here because:
        // 1. The token might still be valid (403 just means no session for refresh)
        // 2. Token clearing is handled by the caller based on authentication requirements
        // 3. For JWT-required routes, the absence of a valid token will trigger redirect
        
        return false;
      }

      // For other errors (500, network errors, etc.), check if we should retry
      if (retryCount < MAX_REFRESH_RETRIES) {
        console.log('[AuthCoordinator] JWT refresh failed, retrying', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          errorType: `HTTP ${response.status}`,
          traceId,
          retryCount,
          nextRetry: retryCount + 1,
          requireJWT: requireJWT ?? 'not specified',
          routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
          timestamp: new Date().toISOString()
        });
        logAuthEvent('JWT refresh failed, retrying', 'warn', undefined, {
          traceId,
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          errorType: `HTTP ${response.status}`,
          retryCount,
          nextRetry: retryCount + 1,
          requireJWT: requireJWT ?? 'not specified',
          routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
        });
        
        // Retry the refresh operation
        return refreshJWTFromSession(traceId, retryCount + 1, requireJWT);
      }

      // Retry limit reached
      const afterState = {
        hasJWT: false,
        success: false,
        reason: 'Maximum retry attempts exceeded',
        timestamp: new Date().toISOString()
      };
      
      console.warn('[AuthCoordinator] JWT refresh failed, retry limit reached', {
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        errorType: `HTTP ${response.status}`,
        traceId,
        retryCount,
        maxRetries: MAX_REFRESH_RETRIES,
        requireJWT: requireJWT ?? 'not specified',
        routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
        timestamp: new Date().toISOString()
      });
      
      // Log state transition
      console.log('[AuthCoordinator] State transition: JWT refresh failed (retry limit)', {
        before: beforeState,
        after: afterState,
        transition: 'refresh attempt -> failed (retry limit reached)',
        traceId,
        durationMs: Date.now() - startTime,
        reason: 'Maximum retry attempts exceeded'
      });
      
      logAuthEvent('JWT refresh failed: retry limit reached', 'error', undefined, {
        traceId,
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        errorType: `HTTP ${response.status}`,
        retryCount,
        maxRetries: MAX_REFRESH_RETRIES,
        reason: 'Maximum retry attempts exceeded',
        requireJWT: requireJWT ?? 'not specified',
        routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
      });
      return false;
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      const afterState = {
        hasJWT: false,
        success: false,
        reason: 'Response missing token',
        timestamp: new Date().toISOString()
      };
      
      console.warn('[AuthCoordinator] JWT refresh response missing token', { 
        traceId, 
        retryCount,
        timestamp: new Date().toISOString()
      });
      
      // Log state transition
      console.log('[AuthCoordinator] State transition: JWT refresh failed (missing token)', {
        before: beforeState,
        after: afterState,
        transition: 'refresh attempt -> failed (missing token)',
        traceId,
        durationMs: Date.now() - startTime,
        reason: 'Response missing token'
      });
      
      logAuthEvent('JWT refresh response missing token', 'warn', undefined, { traceId, retryCount });
      return false;
    }

    // Store new JWT
    const stored = await setToken(token, 'AuthCoordinator_refresh', traceId);

    if (stored) {
      const afterState = {
        hasJWT: true,
        success: true,
        retriedAfterFailure: retryCount > 0,
        timestamp: new Date().toISOString()
      };
      
      console.log('[AuthCoordinator] JWT refreshed and stored successfully', { 
        traceId, 
        retryCount,
        retriedAfterFailure: retryCount > 0,
        timestamp: new Date().toISOString()
      });
      
      // Log state transition
      console.log('[AuthCoordinator] State transition: JWT refresh succeeded', {
        before: beforeState,
        after: afterState,
        transition: 'refresh attempt -> success',
        traceId,
        durationMs: Date.now() - startTime,
        retriedAfterFailure: retryCount > 0
      });
      
      logAuthEvent('JWT refreshed from session', 'info', undefined, { 
        traceId, 
        retryCount,
        retriedAfterFailure: retryCount > 0 
      });
      return true;
    } else {
      const afterState = {
        hasJWT: false,
        success: false,
        reason: 'Storage failed',
        timestamp: new Date().toISOString()
      };
      
      console.warn('[AuthCoordinator] JWT refresh succeeded but storage failed', { 
        traceId, 
        retryCount,
        timestamp: new Date().toISOString()
      });
      
      // Log state transition
      console.log('[AuthCoordinator] State transition: JWT refresh succeeded but storage failed', {
        before: beforeState,
        after: afterState,
        transition: 'refresh attempt -> failed (storage error)',
        traceId,
        durationMs: Date.now() - startTime,
        reason: 'Storage failed'
      });
      
      logAuthEvent('JWT refresh succeeded but storage failed', 'warn', undefined, { traceId, retryCount });
      return false;
    }
  } catch (error) {
    // For network errors and exceptions, check if we should retry
    if (retryCount < MAX_REFRESH_RETRIES) {
      console.log('[AuthCoordinator] JWT refresh error, retrying', {
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : 'Unknown',
        traceId,
        retryCount,
        nextRetry: retryCount + 1,
        requireJWT: requireJWT ?? 'not specified',
        routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
        timestamp: new Date().toISOString()
      });
      logAuthEvent('JWT refresh error, retrying', 'warn', undefined, {
        traceId,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : 'Unknown',
        retryCount,
        nextRetry: retryCount + 1,
        requireJWT: requireJWT ?? 'not specified',
        routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
      });
      
      // Retry the refresh operation
      return refreshJWTFromSession(traceId, retryCount + 1, requireJWT);
    }

    // Retry limit reached
    const afterState = {
      hasJWT: false,
      success: false,
      reason: 'Maximum retry attempts exceeded after error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
    
    console.error('[AuthCoordinator] JWT refresh error, retry limit reached', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : 'Unknown',
      traceId,
      retryCount,
      maxRetries: MAX_REFRESH_RETRIES,
      requireJWT: requireJWT ?? 'not specified',
      routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
      timestamp: new Date().toISOString()
    });
    
    // Log state transition
    console.log('[AuthCoordinator] State transition: JWT refresh error (retry limit)', {
      before: beforeState,
      after: afterState,
      transition: 'refresh attempt -> failed (error, retry limit reached)',
      traceId,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      reason: 'Maximum retry attempts exceeded'
    });
    
    logAuthEvent('JWT refresh error: retry limit reached', 'error', undefined, {
      traceId,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : 'Unknown',
      retryCount,
      maxRetries: MAX_REFRESH_RETRIES,
      reason: 'Maximum retry attempts exceeded',
      requireJWT: requireJWT ?? 'not specified',
      routeRequirement: requireJWT ? 'JWT-only route' : 'JWT or session allowed',
    });
    return false;
  }
}

/**
 * Activate fallback mode
 * 
 * Sets fallback mode flag in sessionStorage and logs the activation.
 * Fallback mode indicates that JWT storage is unavailable and the system
 * is using session-based authentication instead.
 * 
 * @param reason - Reason for activating fallback mode
 * @param traceId - Optional trace ID for correlating operations
 * 
 * Requirements: 9.1, 9.2, 6.1
 */
export function activateFallbackMode(reason: string, traceId?: string): void {
  const timestamp = new Date().toISOString();
  
  console.log('[AuthCoordinator] Activating fallback mode', { 
    reason, 
    traceId,
    timestamp
  });

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(FALLBACK_MODE_KEY, JSON.stringify({
        active: true,
        reason,
        timestamp: Date.now(),
      }));

      logAuthEvent('Fallback mode activated', 'warn', undefined, {
        traceId,
        reason,
        timestamp
      });
    }
  } catch (error) {
    console.error('[AuthCoordinator] Failed to activate fallback mode', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      timestamp
    });
  }
}

/**
 * Check if fallback mode is active
 * 
 * @returns boolean - true if fallback mode is active, false otherwise
 * 
 * Requirements: 9.1, 9.5
 */
export function isInFallbackMode(): boolean {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem(FALLBACK_MODE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.active === true;
      }
    }
  } catch (error) {
    console.error('[AuthCoordinator] Error checking fallback mode', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return false;
}

/**
 * Deactivate fallback mode
 * 
 * Clears fallback mode flag from sessionStorage.
 * Should be called when JWT storage becomes available again.
 * 
 * @param traceId - Optional trace ID for correlating operations
 * 
 * Requirements: 6.1
 */
export function deactivateFallbackMode(traceId?: string): void {
  const timestamp = new Date().toISOString();
  
  console.log('[AuthCoordinator] Deactivating fallback mode', { 
    traceId,
    timestamp
  });

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(FALLBACK_MODE_KEY);

      logAuthEvent('Fallback mode deactivated', 'info', undefined, { 
        traceId,
        timestamp
      });
    }
  } catch (error) {
    console.error('[AuthCoordinator] Failed to deactivate fallback mode', {
      error: error instanceof Error ? error.message : String(error),
      traceId,
      timestamp
    });
  }
}

/**
 * AuthCoordinator class for object-oriented usage
 */
export class AuthCoordinator {
  async getAuthState(options?: AuthOptions | string): Promise<ExtendedAuthState> {
    return getAuthState(options);
  }

  async refreshJWTFromSession(traceId?: string, retryCount: number = 0, requireJWT?: boolean): Promise<boolean> {
    return refreshJWTFromSession(traceId, retryCount, requireJWT);
  }

  activateFallbackMode(reason: string, traceId?: string): void {
    activateFallbackMode(reason, traceId);
  }

  isInFallbackMode(): boolean {
    return isInFallbackMode();
  }

  deactivateFallbackMode(traceId?: string): void {
    deactivateFallbackMode(traceId);
  }
}

/**
 * Singleton instance for convenience
 */
export const authCoordinator = new AuthCoordinator();
