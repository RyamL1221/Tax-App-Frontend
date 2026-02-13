/**
 * AuthCoordinator - Unified authentication state management
 * 
 * Provides a single source of truth for authentication status using JWT-only
 * authentication. If a JWT token exists in localStorage, the user is authenticated;
 * otherwise, the user is unauthenticated.
 * 
 * Features:
 * - JWT-only authentication (no session fallback)
 * - Simple, synchronous authentication checks
 * - Comprehensive logging with trace ID support
 * 
 * Note: Session-based authentication and JWT refresh have been removed to
 * simplify the authentication flow and eliminate infinite loop issues.
 * 
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

import { hasToken } from '../api/tokenManager';
import { logAuthEvent, type AuthState } from './AuthLogger';

/**
 * Authentication options for route-level requirements
 */
export interface AuthOptions {
  /**
   * If true, only JWT authentication is accepted.
   * @deprecated This option is no longer needed as JWT is the only authentication method.
   * Kept for backward compatibility.
   */
  requireJWT?: boolean;
  
  /**
   * Trace ID for correlating log entries across operations.
   */
  traceId?: string;
}

/**
 * Extended authentication state with fallback mode indicator
 * 
 * Used internally by AuthCoordinator for detailed state tracking.
 * Includes additional fields for backward compatibility and internal use.
 * 
 * Note: hasSession and inFallbackMode are always false in JWT-only mode.
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export interface ExtendedAuthState extends AuthState {
  /**
   * Whether a session exists
   * @deprecated Always false - session authentication has been removed
   */
  hasSession: boolean;
  
  /**
   * Whether a JWT token exists
   */
  hasJWT: boolean;
  
  /**
   * Whether fallback mode is active
   * @deprecated Always false - fallback mode has been removed
   */
  inFallbackMode: boolean;
  
  /**
   * Authentication method used
   * Will be 'jwt' if authenticated, 'none' if not
   * @deprecated 'session' is no longer a valid value
   */
  authMethod: 'jwt' | 'session' | 'none';
  
  /**
   * Reason for authentication failure (if applicable)
   */
  reason?: string;
}

/**
 * Get unified authentication state
 * 
 * Checks for a valid JWT token in localStorage. If JWT exists, the user is
 * authenticated; otherwise, the user is unauthenticated.
 * 
 * This is a simplified implementation that:
 * - Does NOT check for session cookies
 * - Does NOT attempt to refresh JWT tokens
 * - Does NOT make any HTTP requests
 * 
 * @param options - Optional authentication options including traceId
 * @returns Promise<ExtendedAuthState> - Unified authentication state
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 6.1, 6.2
 */
export async function getAuthState(options?: AuthOptions | string): Promise<ExtendedAuthState> {
  const timestamp = new Date().toISOString();
  
  // Support both old signature (traceId as string) and new signature (options object)
  const opts: AuthOptions = typeof options === 'string' 
    ? { traceId: options } 
    : (options || {});
  
  const { traceId } = opts;
  
  console.log('[AuthCoordinator] Getting auth state (JWT-only mode)', { 
    traceId,
    timestamp
  });

  try {
    // Check JWT in localStorage
    const hasJWT = hasToken('AuthCoordinator', traceId);
    
    console.log('[AuthCoordinator] JWT check result', { 
      hasJWT, 
      traceId,
      timestamp: new Date().toISOString()
    });

    if (hasJWT) {
      // Authenticated via JWT
      const state: ExtendedAuthState = {
        hasSession: false, // Deprecated - always false
        hasJWT: true,
        isAuthenticated: true,
        userId: null, // Would need to decode JWT to get this
        email: null, // Would need to decode JWT to get this
        inFallbackMode: false, // Deprecated - always false
        authMethod: 'jwt',
      };

      console.log('[AuthCoordinator] Authenticated via JWT', { 
        state, 
        traceId,
        timestamp: new Date().toISOString()
      });
      
      logAuthEvent('Authentication state determined: JWT', 'info', state, { traceId });
      return state;
    }

    // No JWT = Not authenticated
    const state: ExtendedAuthState = {
      hasSession: false,
      hasJWT: false,
      isAuthenticated: false,
      userId: null,
      email: null,
      inFallbackMode: false,
      authMethod: 'none',
      reason: 'No JWT token found',
    };

    console.log('[AuthCoordinator] Not authenticated (no JWT)', { 
      state, 
      traceId,
      timestamp: new Date().toISOString()
    });
    
    logAuthEvent('Authentication state determined: Not authenticated', 'info', state, { traceId });
    return state;
  } catch (error) {
    console.error('[AuthCoordinator] Error checking JWT', {
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
      inFallbackMode: false,
      authMethod: 'none',
      reason: `Error checking JWT: ${error instanceof Error ? error.message : String(error)}`,
    };

    logAuthEvent('Authentication state error', 'error', state, { 
      traceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return state;
  }
}

/**
 * Activate fallback mode
 * 
 * @deprecated This function is a no-op. Fallback mode has been removed.
 * Kept for backward compatibility with existing code.
 * 
 * @param _reason - Reason for activating fallback mode (ignored)
 * @param _traceId - Optional trace ID (ignored)
 */
export function activateFallbackMode(_reason: string, _traceId?: string): void {
  // No-op: Fallback mode has been removed
  console.log('[AuthCoordinator] activateFallbackMode called (no-op - fallback mode removed)');
}

/**
 * Check if fallback mode is active
 * 
 * @deprecated Always returns false. Fallback mode has been removed.
 * Kept for backward compatibility with existing code.
 * 
 * @returns boolean - Always false
 */
export function isInFallbackMode(): boolean {
  // Always return false: Fallback mode has been removed
  return false;
}

/**
 * Deactivate fallback mode
 * 
 * @deprecated This function is a no-op. Fallback mode has been removed.
 * Kept for backward compatibility with existing code.
 * 
 * @param _traceId - Optional trace ID (ignored)
 */
export function deactivateFallbackMode(_traceId?: string): void {
  // No-op: Fallback mode has been removed
  console.log('[AuthCoordinator] deactivateFallbackMode called (no-op - fallback mode removed)');
}

/**
 * AuthCoordinator class for object-oriented usage
 * 
 * Provides the same functionality as the standalone functions but in a class format.
 * Note: refreshJWTFromSession has been removed as JWT refresh is no longer supported.
 */
export class AuthCoordinator {
  /**
   * Get unified authentication state
   * @see getAuthState
   */
  async getAuthState(options?: AuthOptions | string): Promise<ExtendedAuthState> {
    return getAuthState(options);
  }

  /**
   * Activate fallback mode
   * @deprecated No-op - fallback mode has been removed
   */
  activateFallbackMode(reason: string, traceId?: string): void {
    activateFallbackMode(reason, traceId);
  }

  /**
   * Check if fallback mode is active
   * @deprecated Always returns false - fallback mode has been removed
   */
  isInFallbackMode(): boolean {
    return isInFallbackMode();
  }

  /**
   * Deactivate fallback mode
   * @deprecated No-op - fallback mode has been removed
   */
  deactivateFallbackMode(traceId?: string): void {
    deactivateFallbackMode(traceId);
  }
}

/**
 * Singleton instance for convenience
 */
export const authCoordinator = new AuthCoordinator();
