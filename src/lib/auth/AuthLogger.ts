/**
 * AuthLogger - Centralized authentication logging
 * 
 * Provides comprehensive logging for all authentication operations including:
 * - Authentication state changes
 * - Token operations (set, get, clear, validate)
 * - API authentication failures
 * - Redirects due to authentication issues
 * 
 * Security: Never logs actual token values, only metadata
 * Environment: Verbose logging in development, minimal in production
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { logoutStateManager } from './LogoutStateManager';

/**
 * Authentication state interface
 * 
 * Simplified to contain only essential fields. Authentication status
 * is determined directly from JWT token presence, not derived from
 * other fields.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export interface AuthState {
  /**
   * Whether the user is authenticated
   * Determined by JWT token presence and validity
   */
  isAuthenticated: boolean;
  
  /**
   * User ID extracted from JWT token
   * null if not authenticated
   */
  userId: string | null;
  
  /**
   * User email extracted from JWT token
   * null if not authenticated
   */
  email: string | null;
}

/**
 * Log level type
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log entry structure
 */
export interface AuthLogEntry {
  timestamp: number;
  level: LogLevel;
  event: string;
  traceId?: string;
  authState?: AuthState;
  context?: Record<string, unknown>;
}

/**
 * Determine if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Format timestamp for logging
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Core logging function
 * Logs to console in development, minimal logging in production
 */
function log(entry: AuthLogEntry): void {
  const { timestamp, level, event, traceId, authState, context } = entry;
  const formattedTime = formatTimestamp(timestamp);
  
  // Check logout state and add to context
  const logoutInProgress = logoutStateManager.isLogoutInProgress();
  const enhancedContext = {
    ...context,
    logoutInProgress,
    ...(traceId && { traceId }),
  };
  
  // In production, only log warnings and errors
  if (!isDevelopment() && level !== 'warn' && level !== 'error') {
    return;
  }
  
  // Build log message with trace ID if available
  const prefix = `[AuthLogger ${formattedTime}]`;
  const traceInfo = traceId ? ` [Trace: ${traceId}]` : '';
  const message = `${prefix}${traceInfo} ${event}`;
  
  // Select console method based on level
  const consoleMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       console.log;
  
  // In development, log full details
  if (isDevelopment()) {
    consoleMethod(message, {
      level,
      authState,
      context: enhancedContext,
    });
  } else {
    // In production, log minimal info
    consoleMethod(message);
  }
}

/**
 * Log authentication state change
 * 
 * @param event - Description of the event that caused the state change
 * @param oldState - Previous authentication state
 * @param newState - New authentication state
 * @param context - Additional context information
 * 
 * Requirements: 2.1, 2.6
 */
export function logAuthStateChange(
  event: string,
  oldState: AuthState,
  newState: AuthState,
  context?: Record<string, unknown>
): void {
  const entry: AuthLogEntry = {
    timestamp: Date.now(),
    level: 'info',
    event: `Auth State Change: ${event}`,
    authState: newState,
    context: {
      ...context,
      oldState,
      changes: {
        isAuthenticated: oldState.isAuthenticated !== newState.isAuthenticated,
      },
    },
  };
  
  log(entry);
}

/**
 * Log token operation
 * 
 * @param operation - Type of token operation (set, get, clear, validate)
 * @param success - Whether the operation succeeded
 * @param reason - Optional reason for failure or additional context
 * @param source - Optional source component that initiated the operation
 * @param traceId - Optional trace ID for correlating operations across the auth flow
 * 
 * Security: Never logs actual token values
 * Requirements: 2.2, 2.5, 1.1, 1.2, 2.1
 */
export function logTokenOperation(
  operation: 'set' | 'get' | 'clear' | 'validate',
  success: boolean,
  reason?: string,
  source?: string,
  traceId?: string
): void {
  const level: LogLevel = success ? 'info' : 'warn';
  const status = success ? 'succeeded' : 'failed';
  
  const entry: AuthLogEntry = {
    timestamp: Date.now(),
    level,
    event: `Token ${operation} ${status}`,
    traceId,
    context: {
      operation,
      success,
      reason,
      source,
      note: 'Token value not logged for security',
    },
  };
  
  log(entry);
}

/**
 * Log API authentication failure
 * 
 * @param url - The API endpoint that failed
 * @param status - HTTP status code
 * @param authState - Current authentication state
 * @param willRetry - Whether the request will be retried
 * @param context - Additional context information
 * 
 * Requirements: 2.3, 2.4
 */
export function logAuthFailure(
  url: string,
  status: number,
  authState: AuthState,
  willRetry: boolean,
  context?: Record<string, unknown>
): void {
  const entry: AuthLogEntry = {
    timestamp: Date.now(),
    level: 'warn',
    event: `API Auth Failure: ${status} ${url}`,
    authState,
    context: {
      ...context,
      url,
      status,
      willRetry,
    },
  };
  
  log(entry);
}

/**
 * Log redirect due to authentication issues
 * 
 * @param from - Source location (current page)
 * @param to - Destination location (redirect target)
 * @param reason - Reason for the redirect
 * @param authState - Current authentication state
 * @param context - Additional context information
 * 
 * Requirements: 2.6
 */
export function logRedirect(
  from: string,
  to: string,
  reason: string,
  authState: AuthState,
  context?: Record<string, unknown>
): void {
  const entry: AuthLogEntry = {
    timestamp: Date.now(),
    level: 'info',
    event: `Auth Redirect: ${from} → ${to}`,
    authState,
    context: {
      ...context,
      from,
      to,
      reason,
    },
  };
  
  log(entry);
}

/**
 * Log general authentication event
 * 
 * @param event - Event description
 * @param level - Log level
 * @param authState - Optional current authentication state
 * @param context - Optional additional context
 */
export function logAuthEvent(
  event: string,
  level: LogLevel = 'info',
  authState?: AuthState,
  context?: Record<string, unknown>
): void {
  const entry: AuthLogEntry = {
    timestamp: Date.now(),
    level,
    event,
    authState,
    context,
  };
  
  log(entry);
}

/**
 * Create a simplified auth state object for logging
 * Helper function to create auth state from available information
 * 
 * @param isAuthenticated - Whether the user is authenticated
 * @param userId - User ID (optional)
 * @param email - User email (optional)
 * @returns AuthState object
 * 
 * Requirements: 6.1, 4.2
 */
export function createAuthState(
  isAuthenticated: boolean,
  userId: string | null = null,
  email: string | null = null
): AuthState {
  return {
    isAuthenticated,
    userId,
    email,
  };
}

/**
 * AuthLogger class for object-oriented usage
 */
export class AuthLogger {
  logAuthStateChange(
    event: string,
    oldState: AuthState,
    newState: AuthState,
    context?: Record<string, unknown>
  ): void {
    logAuthStateChange(event, oldState, newState, context);
  }

  logTokenOperation(
    operation: 'set' | 'get' | 'clear' | 'validate',
    success: boolean,
    reason?: string,
    source?: string,
    traceId?: string
  ): void {
    logTokenOperation(operation, success, reason, source, traceId);
  }

  logAuthFailure(
    url: string,
    status: number,
    authState: AuthState,
    willRetry: boolean,
    context?: Record<string, unknown>
  ): void {
    logAuthFailure(url, status, authState, willRetry, context);
  }

  logRedirect(
    from: string,
    to: string,
    reason: string,
    authState: AuthState,
    context?: Record<string, unknown>
  ): void {
    logRedirect(from, to, reason, authState, context);
  }

  logAuthEvent(
    event: string,
    level: LogLevel = 'info',
    authState?: AuthState,
    context?: Record<string, unknown>
  ): void {
    logAuthEvent(event, level, authState, context);
  }

  createAuthState(
    isAuthenticated: boolean,
    userId: string | null = null,
    email: string | null = null
  ): AuthState {
    return createAuthState(isAuthenticated, userId, email);
  }
}

/**
 * Singleton instance for convenience
 */
export const authLogger = new AuthLogger();
