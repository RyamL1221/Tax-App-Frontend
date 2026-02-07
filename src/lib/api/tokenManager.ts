/**
 * TokenManager - Manages secure storage and retrieval of JWT tokens
 * 
 * This module provides functions to store, retrieve, and clear JWT tokens
 * in browser localStorage. It ensures tokens are never logged to the console
 * for security purposes and validates tokens before use.
 * 
 * Enhanced with comprehensive logging via AuthLogger to track all token operations.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 6.2, 8.2, 8.3, 2.2, 2.5
 */

import { logTokenOperation } from '../auth/AuthLogger';

const STORAGE_KEY = 'jwt_token';

/**
 * Validate that a token is a non-null, non-empty string
 * @param token - The token to validate
 * @param source - Optional source component that initiated the validation
 * @returns true if token is valid, false otherwise
 * Requirements: 1.5, 8.2, 8.3, 2.2, 2.5
 */
export function isValidToken(token: string | null, source?: string): boolean {
  const valid = token !== null && typeof token === 'string' && token.trim().length > 0;
  
  // Only log explicit validation calls (when source is provided)
  // Don't log internal validation checks to avoid noise
  if (source) {
    if (!valid) {
      const reason = token === null ? 'Token is null' : 
                     typeof token !== 'string' ? 'Token is not a string' : 
                     'Token is empty';
      logTokenOperation('validate', false, reason, source);
    } else {
      logTokenOperation('validate', true, undefined, source);
    }
  }
  
  return valid;
}

/**
 * Store a JWT token in localStorage
 * @param token - The JWT token to store
 * @param source - Optional source component that initiated the operation (e.g., 'login', 'recovery', 'refresh')
 * Requirements: 1.1, 1.3, 6.2, 2.2, 2.5
 */
export function setToken(token: string, source?: string): void {
  // Validate token before storing
  if (!isValidToken(token)) {
    logTokenOperation('set', false, 'Invalid token format', source);
    console.warn('TokenManager: Attempted to store invalid token (token value not logged for security)');
    return;
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, token.trim());
      logTokenOperation('set', true, undefined, source);
    } else {
      logTokenOperation('set', false, 'localStorage not available', source);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logTokenOperation('set', false, `Storage error: ${errorMessage}`, source);
    console.error('TokenManager: Failed to store token in localStorage', error);
    throw new Error('Unable to save session. Please check browser settings.');
  }
}

/**
 * Retrieve the stored JWT token from localStorage
 * @param source - Optional source component that initiated the operation
 * @returns The stored JWT token or null if not found or invalid
 * Requirements: 1.4, 1.5, 8.2, 2.2, 2.5
 */
export function getToken(source?: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem(STORAGE_KEY);
      
      // Validate token before returning
      if (!isValidToken(token)) {
        if (token !== null) {
          logTokenOperation('get', false, 'Invalid token detected', source);
          console.warn('TokenManager: Invalid token detected and removed (token value not logged for security)');
          clearToken('invalid_token_detected', source);
        } else {
          logTokenOperation('get', false, 'No token found', source);
        }
        return null;
      }
      
      logTokenOperation('get', true, undefined, source);
      return token;
    }
    logTokenOperation('get', false, 'localStorage not available', source);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logTokenOperation('get', false, `Storage error: ${errorMessage}`, source);
    console.error('TokenManager: Failed to retrieve token from localStorage', error);
    return null;
  }
}

/**
 * Remove the JWT token from localStorage
 * @param reason - Reason for clearing the token (e.g., 'logout', 'expired', 'invalid')
 * @param source - Optional source component that initiated the operation
 * Requirements: 1.4, 4.1, 4.5, 2.2, 2.5
 */
export function clearToken(reason?: string, source?: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const hadToken = localStorage.getItem(STORAGE_KEY) !== null;
      localStorage.removeItem(STORAGE_KEY);
      
      if (hadToken) {
        logTokenOperation('clear', true, reason, source);
      }
    } else {
      logTokenOperation('clear', false, 'localStorage not available', source);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logTokenOperation('clear', false, `Storage error: ${errorMessage}`, source);
    console.error('TokenManager: Failed to clear token from localStorage', error);
  }
}

/**
 * Check if a valid JWT token exists in localStorage
 * @param source - Optional source component that initiated the check
 * @returns true if a valid token exists, false otherwise
 * Requirements: 1.5, 8.3, 2.2, 2.5
 */
export function hasToken(source?: string): boolean {
  const token = getToken(source);
  return isValidToken(token);
}

/**
 * TokenManager class for backward compatibility
 * Provides the same functionality as the exported functions
 */
export class TokenManager {
  setToken(token: string, source?: string): void {
    setToken(token, source);
  }

  getToken(source?: string): string | null {
    return getToken(source);
  }

  clearToken(reason?: string, source?: string): void {
    clearToken(reason, source);
  }

  hasToken(source?: string): boolean {
    return hasToken(source);
  }

  isValidToken(token: string | null, source?: string): boolean {
    return isValidToken(token, source);
  }
}

/**
 * Singleton instance for backward compatibility
 * Use the exported functions directly for new code
 */
export const tokenManager = new TokenManager();
