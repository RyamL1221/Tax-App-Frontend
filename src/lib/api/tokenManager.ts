/**
 * TokenManager - Manages secure storage and retrieval of JWT tokens
 * 
 * This module provides functions to store, retrieve, and clear JWT tokens
 * in browser localStorage. It ensures tokens are never logged to the console
 * for security purposes and validates tokens before use.
 * 
 * Enhanced with comprehensive logging via AuthLogger to track all token operations.
 * 
 * Features:
 * - JWT format validation (three base64-url segments with dots)
 * - Retry logic for transient storage failures
 * - Immediate verification after storage
 * - LocalStorage diagnostics and availability testing
 * - Comprehensive logging with trace ID support
 * - Storage key consistency verification
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 
 *              4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.5, 10.1, 10.2, 10.3, 10.4
 */

import { logTokenOperation } from '../auth/AuthLogger';
import { logoutStateManager } from '../auth/LogoutStateManager';

/**
 * Storage key constant for JWT token
 * Using const assertion to prevent modification
 * Requirements: 3.1, 3.5
 */
export const TOKEN_STORAGE_KEY = 'jwt_token' as const;

/**
 * JWT format validation regex
 * Matches three base64-url segments separated by dots
 * Requirements: 10.1, 10.2
 */
const JWT_FORMAT_REGEX = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

/**
 * LocalStorage diagnostics result
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export interface LocalStorageDiagnostics {
  available: boolean;
  readable: boolean;
  writable: boolean;
  error?: string;
  browserContext: {
    isPrivateMode: boolean;
    quotaExceeded: boolean;
  };
}

/**
 * Test localStorage availability and detect browser restrictions
 * 
 * Performs comprehensive diagnostics to detect:
 * - localStorage object existence
 * - Read/write permissions
 * - Private/incognito mode (SecurityError)
 * - Quota exceeded errors
 * 
 * @returns LocalStorageDiagnostics object with test results
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function testLocalStorageAvailability(): LocalStorageDiagnostics {
  const result: LocalStorageDiagnostics = {
    available: false,
    readable: false,
    writable: false,
    browserContext: {
      isPrivateMode: false,
      quotaExceeded: false,
    },
  };

  try {
    // Test if localStorage object exists
    if (typeof window === 'undefined' || !window.localStorage) {
      result.error = 'localStorage object not available';
      return result;
    }

    result.available = true;

    // Test read access
    try {
      const testKey = '__ls_test_read__';
      localStorage.getItem(testKey);
      result.readable = true;
    } catch (readError) {
      result.error = 'localStorage read access denied';
      if (readError instanceof Error && readError.name === 'SecurityError') {
        result.browserContext.isPrivateMode = true;
      }
      return result;
    }

    // Test write access
    try {
      const testKey = '__ls_test_write__';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      
      // Verify write succeeded
      const retrieved = localStorage.getItem(testKey);
      if (retrieved === testValue) {
        result.writable = true;
        // Clean up test data
        localStorage.removeItem(testKey);
      } else {
        result.error = 'localStorage write verification failed';
      }
    } catch (writeError) {
      if (writeError instanceof Error) {
        if (writeError.name === 'SecurityError') {
          result.browserContext.isPrivateMode = true;
          result.error = 'Private/incognito mode detected';
        } else if (writeError.name === 'QuotaExceededError') {
          result.browserContext.quotaExceeded = true;
          result.error = 'localStorage quota exceeded';
        } else {
          result.error = `localStorage write error: ${writeError.message}`;
        }
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

/**
 * Validate JWT token format
 * 
 * Checks that the token:
 * - Is a non-empty string
 * - Matches JWT format (three base64-url segments separated by dots)
 * 
 * @param token - The token to validate
 * @returns true if token matches JWT format, false otherwise
 * 
 * Requirements: 10.1, 10.2
 */
export function validateTokenFormat(token: string | null): boolean {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return false;
  }
  
  return JWT_FORMAT_REGEX.test(token.trim());
}

/**
 * Validate that a token is a non-null, non-empty string
 * @param token - The token to validate
 * @param source - Optional source component that initiated the validation
 * @param traceId - Optional trace ID for correlating operations
 * @returns true if token is valid, false otherwise
 * Requirements: 1.5, 8.2, 8.3, 2.2, 2.5
 */
export function isValidToken(token: string | null, source?: string, traceId?: string): boolean {
  const valid = token !== null && typeof token === 'string' && token.trim().length > 0;
  
  // Only log explicit validation calls (when source is provided)
  // Don't log internal validation checks to avoid noise
  if (source) {
    if (!valid) {
      const reason = token === null ? 'Token is null' : 
                     typeof token !== 'string' ? 'Token is not a string' : 
                     'Token is empty';
      logTokenOperation('validate', false, reason, source, traceId);
    } else {
      logTokenOperation('validate', true, undefined, source, traceId);
    }
  }
  
  return valid;
}

/**
 * Store a JWT token in localStorage with retry logic and verification
 * 
 * Enhanced with:
 * - JWT format validation before storage
 * - Detailed logging at each step
 * - Immediate verification after storage
 * - Retry logic for transient failures
 * - Comprehensive error handling
 * 
 * @param token - The JWT token to store
 * @param source - Optional source component that initiated the operation (e.g., 'login', 'recovery', 'refresh')
 * @param traceId - Optional trace ID for correlating operations
 * @returns Promise<boolean> - true if storage succeeded, false otherwise
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.5, 10.1, 10.2
 */
export async function setToken(token: string, source?: string, traceId?: string): Promise<boolean> {
  // Log storage attempt with storage key and trace ID
  console.log('[TokenManager] setToken attempt', {
    storageKey: TOKEN_STORAGE_KEY,
    source,
    traceId,
    timestamp: new Date().toISOString(),
  });

  // Validate token is non-empty string
  if (!isValidToken(token)) {
    logTokenOperation('set', false, 'Invalid token format: empty or null', source, traceId);
    console.warn('TokenManager: Attempted to store invalid token (token value not logged for security)');
    return false;
  }

  // Validate JWT format (three base64 segments with dots)
  if (!validateTokenFormat(token)) {
    logTokenOperation('set', false, 'Invalid token format: does not match JWT structure', source, traceId);
    console.warn('TokenManager: Token does not match JWT format (token value not logged for security)');
    return false;
  }

  console.log('[TokenManager] Token format validation passed', { traceId });

  // Attempt storage with retry logic
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Attempt to store token
        localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
        console.log('[TokenManager] localStorage.setItem succeeded', {
          storageKey: TOKEN_STORAGE_KEY,
          attempt,
          traceId,
        });

        // Immediate verification - retrieve and compare
        const retrieved = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (retrieved === token.trim()) {
          console.log('[TokenManager] Immediate verification passed', { traceId });
          logTokenOperation('set', true, undefined, source, traceId);
          return true;
        } else {
          console.error('[TokenManager] Immediate verification failed', {
            storageKey: TOKEN_STORAGE_KEY,
            retrieved: retrieved ? 'value present but mismatched' : 'null',
            attempt,
            traceId,
          });
          
          if (attempt < maxAttempts) {
            console.log('[TokenManager] Retrying storage after verification failure', { traceId });
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          
          logTokenOperation('set', false, 'Verification failed: retrieved value does not match', source, traceId);
          return false;
        }
      } else {
        logTokenOperation('set', false, 'localStorage not available', source, traceId);
        console.error('[TokenManager] localStorage not available');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Error';
      
      console.error('[TokenManager] Storage error', {
        error: errorMessage,
        errorName,
        storageKey: TOKEN_STORAGE_KEY,
        attempt,
        traceId,
        timestamp: new Date().toISOString(),
      });

      // Check for specific error types
      if (errorName === 'SecurityError') {
        logTokenOperation('set', false, `Storage error (SecurityError - private mode?): ${errorMessage}`, source, traceId);
        return false; // Don't retry SecurityError
      } else if (errorName === 'QuotaExceededError') {
        logTokenOperation('set', false, `Storage error (QuotaExceededError): ${errorMessage}`, source, traceId);
        return false; // Don't retry QuotaExceededError
      }

      // Retry for other errors
      if (attempt < maxAttempts) {
        console.log('[TokenManager] Retrying storage after error', {
          attempt,
          nextAttempt: attempt + 1,
          traceId,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        logTokenOperation('set', false, `Storage error after ${maxAttempts} attempts: ${errorMessage}`, source, traceId);
        return false;
      }
    }
  }

  return false;
}

/**
 * Retrieve the stored JWT token from localStorage with validation
 * 
 * Enhanced with:
 * - Detailed logging of retrieval attempt
 * - Raw value logging (truncated for security)
 * - Format validation of retrieved token
 * - Automatic clearing of invalid tokens
 * 
 * @param source - Optional source component that initiated the operation
 * @param traceId - Optional trace ID for correlating operations
 * @returns The stored JWT token or null if not found or invalid
 * 
 * Requirements: 1.4, 1.5, 2.1, 2.2, 2.3, 10.3, 10.4
 */
export function getToken(source?: string, traceId?: string): string | null {
  // Log retrieval attempt with storage key and trace ID
  console.log('[TokenManager] getToken attempt', {
    storageKey: TOKEN_STORAGE_KEY,
    source,
    traceId,
    timestamp: new Date().toISOString(),
  });

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Retrieve raw value from localStorage
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      
      // Log raw value retrieved (truncated for security)
      console.log('[TokenManager] Raw value retrieved', {
        storageKey: TOKEN_STORAGE_KEY,
        valuePresent: token !== null,
        valueLength: token?.length || 0,
        valuePreview: token ? `${token.substring(0, 20)}...` : 'null',
        traceId,
      });
      
      // Validate token before returning
      if (!isValidToken(token)) {
        if (token !== null) {
          // Check if logout is in progress before logging error
          if (!logoutStateManager.isLogoutInProgress()) {
            console.warn('[TokenManager] Invalid token detected (empty or wrong type)', {
              storageKey: TOKEN_STORAGE_KEY,
              traceId,
            });
            logTokenOperation('get', false, 'Invalid token detected: empty or wrong type', source, traceId);
            clearToken('invalid_token_detected', source, traceId);
          }
        } else {
          // Only log missing token if not during logout
          if (!logoutStateManager.isLogoutInProgress()) {
            console.log('[TokenManager] No token found in storage', {
              storageKey: TOKEN_STORAGE_KEY,
              traceId,
            });
            logTokenOperation('get', false, 'No token found', source, traceId);
          }
        }
        return null;
      }

      // Validate JWT format
      if (!validateTokenFormat(token)) {
        if (!logoutStateManager.isLogoutInProgress()) {
          console.warn('[TokenManager] Token format validation failed', {
            storageKey: TOKEN_STORAGE_KEY,
            traceId,
          });
          logTokenOperation('get', false, 'Invalid token format: does not match JWT structure', source, traceId);
          clearToken('invalid_token_format', source, traceId);
        }
        return null;
      }

      console.log('[TokenManager] Token retrieval successful', {
        storageKey: TOKEN_STORAGE_KEY,
        traceId,
      });
      logTokenOperation('get', true, undefined, source, traceId);
      return token;
    }
    
    console.error('[TokenManager] localStorage not available');
    logTokenOperation('get', false, 'localStorage not available', source, traceId);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TokenManager] Retrieval error', {
      error: errorMessage,
      storageKey: TOKEN_STORAGE_KEY,
      traceId,
      timestamp: new Date().toISOString(),
    });
    logTokenOperation('get', false, `Storage error: ${errorMessage}`, source, traceId);
    return null;
  }
}

/**
 * Remove the JWT token from localStorage
 * @param reason - Reason for clearing the token (e.g., 'logout', 'expired', 'invalid')
 * @param source - Optional source component that initiated the operation
 * @param traceId - Optional trace ID for correlating operations
 * Requirements: 1.4, 4.1, 4.5, 2.2, 2.5, 3.2, 3.3
 */
export function clearToken(reason?: string, source?: string, traceId?: string): void {
  console.log('[TokenManager] clearToken attempt', {
    storageKey: TOKEN_STORAGE_KEY,
    reason,
    source,
    traceId,
    timestamp: new Date().toISOString(),
  });

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const hadToken = localStorage.getItem(TOKEN_STORAGE_KEY) !== null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      
      if (hadToken) {
        console.log('[TokenManager] Token cleared from storage', {
          storageKey: TOKEN_STORAGE_KEY,
          reason,
          traceId,
        });
        logTokenOperation('clear', true, reason, source, traceId);
      } else {
        console.log('[TokenManager] No token to clear', {
          storageKey: TOKEN_STORAGE_KEY,
          traceId,
        });
      }
    } else {
      logTokenOperation('clear', false, 'localStorage not available', source, traceId);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TokenManager] Clear error', {
      error: errorMessage,
      storageKey: TOKEN_STORAGE_KEY,
      traceId,
      timestamp: new Date().toISOString(),
    });
    logTokenOperation('clear', false, `Storage error: ${errorMessage}`, source, traceId);
  }
}

/**
 * Check if a valid JWT token exists in localStorage
 * 
 * Enhanced with:
 * - Detailed logging of check attempt
 * - Complete decision path logging
 * - Token presence and validity checks
 * 
 * @param source - Optional source component that initiated the check
 * @param traceId - Optional trace ID for correlating operations
 * @returns true if a valid token exists, false otherwise
 * 
 * Requirements: 1.5, 2.4, 6.3
 */
export function hasToken(source?: string, traceId?: string): boolean {
  console.log('[TokenManager] hasToken check', {
    storageKey: TOKEN_STORAGE_KEY,
    source,
    traceId,
    timestamp: new Date().toISOString(),
  });

  // Call getToken internally to leverage all validation logic
  const token = getToken(source, traceId);
  const result = token !== null;

  console.log('[TokenManager] hasToken result', {
    hasToken: result,
    tokenPresent: token !== null,
    tokenValid: result,
    storageKey: TOKEN_STORAGE_KEY,
    traceId,
  });

  return result;
}

/**
 * Get the storage key used for token storage
 * Useful for testing and verification
 * 
 * @returns The storage key constant
 * Requirements: 3.1, 3.2
 */
export function getStorageKey(): string {
  return TOKEN_STORAGE_KEY;
}

/**
 * TokenManager class for backward compatibility
 * Provides the same functionality as the exported functions
 */
export class TokenManager {
  async setToken(token: string, source?: string, traceId?: string): Promise<boolean> {
    return setToken(token, source, traceId);
  }

  getToken(source?: string, traceId?: string): string | null {
    return getToken(source, traceId);
  }

  clearToken(reason?: string, source?: string, traceId?: string): void {
    clearToken(reason, source, traceId);
  }

  hasToken(source?: string, traceId?: string): boolean {
    return hasToken(source, traceId);
  }

  isValidToken(token: string | null, source?: string, traceId?: string): boolean {
    return isValidToken(token, source, traceId);
  }

  validateTokenFormat(token: string | null): boolean {
    return validateTokenFormat(token);
  }

  testLocalStorageAvailability(): LocalStorageDiagnostics {
    return testLocalStorageAvailability();
  }

  getStorageKey(): string {
    return getStorageKey();
  }
}

/**
 * Singleton instance for backward compatibility
 * Use the exported functions directly for new code
 */
export const tokenManager = new TokenManager();
