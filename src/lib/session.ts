/**
 * Session Management Utilities
 * 
 * Provides functions for:
 * - Creating session tokens
 * - Validating session tokens
 * - Managing session expiration
 * - Setting secure HTTP-only cookies
 * 
 * Enhanced with comprehensive logging for debugging authentication issues.
 * 
 * Requirements:
 * - 8.1: Create secure session tokens on successful authentication
 * - 8.2: Store session tokens in HTTP-only cookies
 * - 8.4: Handle session expiration
 * - 2.1: Log session operations with success/failure status
 * - 2.6: Log validation results
 */

import { cookies } from 'next/headers';
import { logAuthEvent, logTokenOperation, createAuthState } from './auth/AuthLogger';

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  COOKIE_NAME: 'session_token',
  MAX_AGE: 60 * 60 * 24 * 7, // 7 days in seconds
  SECURE: process.env.NODE_ENV === 'production',
  HTTP_ONLY: true,
  SAME_SITE: 'lax' as const,
  PATH: '/',
};

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Session token structure (encoded in cookie)
 */
export interface SessionToken {
  data: SessionData;
  signature: string;
}

/**
 * Generate a random session token
 * In production, this should use a cryptographically secure method
 * and include proper signing/encryption
 */
export function generateSessionToken(userId: string, email: string): string {
  // Validate inputs - reject empty or whitespace-only strings
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new Error('Invalid email: must be a non-empty string');
  }

  const now = Date.now();
  const expiresAt = now + (SESSION_CONFIG.MAX_AGE * 1000);
  
  const sessionData: SessionData = {
    userId: userId.trim(),
    email: email.trim(),
    createdAt: now,
    expiresAt,
  };

  // In production, this should be properly signed/encrypted
  // For now, we use base64 encoding
  const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  return token;
}

/**
 * Decode and validate a session token
 * Returns the session data if valid, null if invalid or expired
 */
export function validateSessionToken(token: string): SessionData | null {
  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const sessionData: SessionData = JSON.parse(decoded);

    // Check if session has expired (>= means expired at or before now)
    const now = Date.now();
    if (now >= sessionData.expiresAt) {
      return null;
    }

    // Validate required fields exist and are not empty/whitespace-only
    if (
      !sessionData.userId || 
      typeof sessionData.userId !== 'string' ||
      sessionData.userId.trim().length === 0 ||
      !sessionData.email || 
      typeof sessionData.email !== 'string' ||
      sessionData.email.trim().length === 0 ||
      !sessionData.createdAt || 
      typeof sessionData.createdAt !== 'number' ||
      !sessionData.expiresAt ||
      typeof sessionData.expiresAt !== 'number'
    ) {
      return null;
    }

    return sessionData;
  } catch (error) {
    // Invalid token format
    return null;
  }
}

/**
 * Check if a session token is expired
 */
export function isSessionExpired(token: string): boolean {
  const sessionData = validateSessionToken(token);
  return sessionData === null;
}

/**
 * Create a session by setting an HTTP-only cookie
 * Requirements: 8.1, 8.2, 2.1
 */
export async function createSession(userId: string, email: string): Promise<string> {
  try {
    const token = generateSessionToken(userId, email);
    const cookieStore = await cookies();

    // Set HTTP-only, secure, sameSite cookie
    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, token, {
      httpOnly: SESSION_CONFIG.HTTP_ONLY,
      secure: SESSION_CONFIG.SECURE,
      sameSite: SESSION_CONFIG.SAME_SITE,
      maxAge: SESSION_CONFIG.MAX_AGE,
      path: SESSION_CONFIG.PATH,
    });

    // Log successful session creation
    logAuthEvent(
      'Session created successfully',
      'info',
      createAuthState(true, false, userId, email),
      {
        operation: 'createSession',
        userId,
        email,
        expiresIn: SESSION_CONFIG.MAX_AGE,
      }
    );

    return token;
  } catch (error) {
    // Log session creation failure
    logAuthEvent(
      'Session creation failed',
      'error',
      createAuthState(false, false, userId, email),
      {
        operation: 'createSession',
        userId,
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    throw error;
  }
}

/**
 * Get the current session from cookies
 * Returns session data if valid, null otherwise
 * Requirements: 2.1, 2.6
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME);

    if (!sessionCookie?.value) {
      // Log missing session cookie
      logAuthEvent(
        'Session cookie not found',
        'debug',
        createAuthState(false, false),
        {
          operation: 'getSession',
          reason: 'No session cookie present',
        }
      );
      return null;
    }

    const sessionData = validateSessionToken(sessionCookie.value);

    if (!sessionData) {
      // Log invalid or expired session
      logAuthEvent(
        'Session validation failed',
        'warn',
        createAuthState(false, false),
        {
          operation: 'getSession',
          reason: 'Session token invalid or expired',
        }
      );
      return null;
    }

    // Log successful session retrieval
    logAuthEvent(
      'Session retrieved successfully',
      'debug',
      createAuthState(true, false, sessionData.userId, sessionData.email),
      {
        operation: 'getSession',
        userId: sessionData.userId,
        email: sessionData.email,
        expiresAt: sessionData.expiresAt,
      }
    );

    return sessionData;
  } catch (error) {
    // Log session retrieval error
    logAuthEvent(
      'Session retrieval error',
      'error',
      createAuthState(false, false),
      {
        operation: 'getSession',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    return null;
  }
}

/**
 * Clear the session by deleting the session cookie
 * Requirements: 8.4, 2.1
 */
export async function clearSession(): Promise<void> {
  try {
    // Get session data before clearing for logging
    const sessionData = await getSession();
    
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);

    // Log successful session clearing
    logAuthEvent(
      'Session cleared successfully',
      'info',
      createAuthState(false, false, sessionData?.userId || null, sessionData?.email || null),
      {
        operation: 'clearSession',
        hadSession: sessionData !== null,
        userId: sessionData?.userId,
        email: sessionData?.email,
      }
    );
  } catch (error) {
    // Log session clearing error
    logAuthEvent(
      'Session clearing error',
      'error',
      createAuthState(false, false),
      {
        operation: 'clearSession',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    throw error;
  }
}

/**
 * Validate and refresh a session if it's close to expiring
 * Returns true if session is valid, false otherwise
 * Requirements: 2.6
 */
export async function validateAndRefreshSession(): Promise<boolean> {
  try {
    const sessionData = await getSession();

    if (!sessionData) {
      // Log validation failure
      logAuthEvent(
        'Session validation failed - no valid session',
        'debug',
        createAuthState(false, false),
        {
          operation: 'validateAndRefreshSession',
          result: false,
        }
      );
      return false;
    }

    // Check if session is close to expiring (within 1 day)
    const now = Date.now();
    const timeUntilExpiry = sessionData.expiresAt - now;
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (timeUntilExpiry < oneDayInMs) {
      // Refresh the session
      await createSession(sessionData.userId, sessionData.email);
      
      // Log session refresh
      logAuthEvent(
        'Session refreshed due to approaching expiration',
        'info',
        createAuthState(true, false, sessionData.userId, sessionData.email),
        {
          operation: 'validateAndRefreshSession',
          timeUntilExpiry,
          refreshThreshold: oneDayInMs,
        }
      );
    } else {
      // Log successful validation without refresh
      logAuthEvent(
        'Session validated successfully',
        'debug',
        createAuthState(true, false, sessionData.userId, sessionData.email),
        {
          operation: 'validateAndRefreshSession',
          result: true,
          timeUntilExpiry,
        }
      );
    }

    return true;
  } catch (error) {
    // Log validation error
    logAuthEvent(
      'Session validation error',
      'error',
      createAuthState(false, false),
      {
        operation: 'validateAndRefreshSession',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    return false;
  }
}
