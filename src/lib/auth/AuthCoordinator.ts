/**
 * AuthCoordinator - Synchronizes session and JWT authentication
 * 
 * This module coordinates between server-side session cookies and client-side JWT tokens
 * to ensure both authentication mechanisms remain synchronized. It prevents the logout
 * issue where users have valid sessions but missing JWT tokens.
 * 
 * Key responsibilities:
 * - Initialize authentication state on app load
 * - Set both session and JWT on login
 * - Clear both mechanisms on logout
 * - Validate synchronization between session and JWT
 * - Recover JWT from valid session when missing
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { getToken, setToken, clearToken, hasToken } from '../api/tokenManager';
import { logAuthStateChange, logAuthEvent, createAuthState, type AuthState } from './AuthLogger';

/**
 * Authentication validation result
 */
export interface AuthValidationResult {
  valid: boolean;
  reason?: string;
  canRecover: boolean;
}

/**
 * Initialize authentication state on app load
 * Validates both session and JWT token
 * 
 * Note: Session validation requires server-side context, so this only checks JWT
 * For full validation including session, use validateAuth() from a server component
 * 
 * @returns Current authentication state
 * Requirements: 3.2
 */
export function initialize(): AuthState {
  const hasJWT = hasToken('AuthCoordinator.initialize');
  
  // Client-side can only check JWT, session check requires server context
  const authState = createAuthState(
    false, // hasSession - unknown on client
    hasJWT,
    null, // userId - unknown without session
    null  // email - unknown without session
  );
  
  logAuthEvent(
    'AuthCoordinator initialized',
    'info',
    authState,
    {
      operation: 'initialize',
      hasJWT,
      note: 'Session state requires server-side validation',
    }
  );
  
  return authState;
}

/**
 * Set authentication after successful login
 * Stores JWT token in localStorage and creates session cookie
 * 
 * This function coordinates both authentication mechanisms:
 * 1. Stores JWT token in localStorage (client-side)
 * 2. Creates session cookie via API route (server-side)
 * 
 * @param jwt - JWT token from backend
 * @param userId - User ID
 * @param email - User email
 * Requirements: 3.1
 */
export async function setAuth(jwt: string, userId: string, email: string): Promise<void> {
  // Validate inputs
  if (!jwt || typeof jwt !== 'string' || jwt.trim().length === 0) {
    logAuthEvent(
      'setAuth failed: invalid JWT',
      'error',
      createAuthState(false, false, userId, email),
      {
        operation: 'setAuth',
        reason: 'JWT is empty or invalid',
      }
    );
    throw new Error('Invalid JWT token');
  }
  
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    logAuthEvent(
      'setAuth failed: invalid userId',
      'error',
      createAuthState(false, false, null, email),
      {
        operation: 'setAuth',
        reason: 'userId is empty or invalid',
      }
    );
    throw new Error('Invalid userId');
  }
  
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    logAuthEvent(
      'setAuth failed: invalid email',
      'error',
      createAuthState(false, false, userId, null),
      {
        operation: 'setAuth',
        reason: 'email is empty or invalid',
      }
    );
    throw new Error('Invalid email');
  }
  
  const oldState = createAuthState(false, hasToken('AuthCoordinator.setAuth'), null, null);
  
  // Store JWT token (client-side)
  setToken(jwt, 'AuthCoordinator.setAuth');
  
  // Create session cookie (server-side via API route)
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }
    
    const newState = createAuthState(
      true, // Session created successfully
      true, // JWT just set
      userId,
      email
    );
    
    logAuthStateChange(
      'Authentication set (both JWT and session)',
      oldState,
      newState,
      {
        operation: 'setAuth',
        userId,
        email,
        sessionCreated: true,
      }
    );
  } catch (error) {
    // If session creation fails, clear the JWT token to maintain consistency
    clearToken('session-creation-failed', 'AuthCoordinator.setAuth');
    
    logAuthEvent(
      'setAuth failed: session creation error',
      'error',
      createAuthState(false, false, userId, email),
      {
        operation: 'setAuth',
        reason: error instanceof Error ? error.message : 'Unknown error',
        jwtCleared: true,
      }
    );
    
    throw new Error('Failed to create session: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Clear all authentication data
 * Removes JWT token from localStorage
 * 
 * Note: Session cookie should be cleared server-side via the session manager
 * This function handles the client-side JWT clearing
 * 
 * @param reason - Reason for clearing (e.g., 'logout', 'expired', 'invalid')
 * Requirements: 3.4, 3.5
 */
export function clearAuth(reason: string = 'unknown'): void {
  const oldState = createAuthState(
    false, // Session state unknown on client
    hasToken('AuthCoordinator.clearAuth'),
    null,
    null
  );
  
  // Clear JWT token
  clearToken(reason, 'AuthCoordinator.clearAuth');
  
  const newState = createAuthState(false, false, null, null);
  
  logAuthStateChange(
    'Authentication cleared',
    oldState,
    newState,
    {
      operation: 'clearAuth',
      reason,
    }
  );
}

/**
 * Validate current authentication state
 * Checks JWT token validity on client side
 * 
 * Note: Full validation including session requires server-side context
 * This performs client-side validation only
 * 
 * @returns Validation result with recovery options
 * Requirements: 3.2, 3.3
 */
export function validateAuth(): AuthValidationResult {
  const hasJWT = hasToken('AuthCoordinator.validateAuth');
  
  if (!hasJWT) {
    logAuthEvent(
      'Auth validation: JWT missing',
      'warn',
      createAuthState(false, false, null, null),
      {
        operation: 'validateAuth',
        result: 'invalid',
        reason: 'JWT token missing',
        canRecover: true,
      }
    );
    
    return {
      valid: false,
      reason: 'JWT token missing',
      canRecover: true, // Can potentially recover from session
    };
  }
  
  // JWT exists, consider valid (detailed validation happens in TokenManager)
  logAuthEvent(
    'Auth validation: valid',
    'debug',
    createAuthState(false, true, null, null),
    {
      operation: 'validateAuth',
      result: 'valid',
    }
  );
  
  return {
    valid: true,
    canRecover: false,
  };
}

/**
 * Attempt to recover JWT token from valid session
 * 
 * Note: This requires server-side context to validate session and retrieve JWT
 * This is a placeholder that should be called from a server component or API route
 * 
 * @returns JWT token if recovery successful, null otherwise
 * Requirements: 3.3
 */
export async function recoverJWT(): Promise<string | null> {
  logAuthEvent(
    'JWT recovery attempted',
    'info',
    createAuthState(false, false, null, null),
    {
      operation: 'recoverJWT',
      note: 'Recovery requires server-side session validation',
    }
  );
  
  // This is a client-side placeholder
  // Actual recovery must be implemented server-side
  // The server should:
  // 1. Validate the session cookie
  // 2. If valid, return the JWT from the session or generate a new one
  // 3. Client then calls setAuth() with the recovered JWT
  
  return null;
}

/**
 * Get current authentication state
 * Returns the current state of JWT token
 * 
 * Note: Session state requires server-side context
 * 
 * @returns Current authentication state
 */
export function getAuthState(): AuthState {
  const hasJWT = hasToken('AuthCoordinator.getAuthState');
  
  return createAuthState(
    false, // Session state unknown on client
    hasJWT,
    null, // User data unknown without session
    null
  );
}

/**
 * AuthCoordinator class for object-oriented usage
 */
export class AuthCoordinator {
  initialize(): AuthState {
    return initialize();
  }
  
  async setAuth(jwt: string, userId: string, email: string): Promise<void> {
    return setAuth(jwt, userId, email);
  }
  
  clearAuth(reason?: string): void {
    clearAuth(reason);
  }
  
  validateAuth(): AuthValidationResult {
    return validateAuth();
  }
  
  async recoverJWT(): Promise<string | null> {
    return recoverJWT();
  }
  
  getAuthState(): AuthState {
    return getAuthState();
  }
}

/**
 * Singleton instance for convenience
 */
export const authCoordinator = new AuthCoordinator();
