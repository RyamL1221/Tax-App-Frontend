/**
 * TokenManager - Manages secure storage and retrieval of JWT tokens
 * 
 * This module provides functions to store, retrieve, and clear JWT tokens
 * in browser localStorage. It ensures tokens are never logged to the console
 * for security purposes and validates tokens before use.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 6.2, 8.2, 8.3
 */

const STORAGE_KEY = 'jwt_token';

/**
 * Validate that a token is a non-null, non-empty string
 * @param token - The token to validate
 * @returns true if token is valid, false otherwise
 * Requirements: 1.5, 8.2, 8.3
 */
export function isValidToken(token: string | null): boolean {
  return token !== null && typeof token === 'string' && token.trim().length > 0;
}

/**
 * Store a JWT token in localStorage
 * @param token - The JWT token to store
 * Requirements: 1.1, 1.3, 6.2
 */
export function setToken(token: string): void {
  // Validate token before storing
  if (!isValidToken(token)) {
    console.warn('TokenManager: Attempted to store invalid token (token value not logged for security)');
    return;
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, token.trim());
    }
  } catch (error) {
    console.error('TokenManager: Failed to store token in localStorage', error);
    throw new Error('Unable to save session. Please check browser settings.');
  }
}

/**
 * Retrieve the stored JWT token from localStorage
 * @returns The stored JWT token or null if not found or invalid
 * Requirements: 1.4, 1.5, 8.2
 */
export function getToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem(STORAGE_KEY);
      
      // Validate token before returning
      if (!isValidToken(token)) {
        if (token !== null) {
          console.warn('TokenManager: Invalid token detected and removed (token value not logged for security)');
          clearToken();
        }
        return null;
      }
      
      return token;
    }
    return null;
  } catch (error) {
    console.error('TokenManager: Failed to retrieve token from localStorage', error);
    return null;
  }
}

/**
 * Remove the JWT token from localStorage
 * Requirements: 1.4, 4.1, 4.5
 */
export function clearToken(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('TokenManager: Failed to clear token from localStorage', error);
  }
}

/**
 * Check if a valid JWT token exists in localStorage
 * @returns true if a valid token exists, false otherwise
 * Requirements: 1.5, 8.3
 */
export function hasToken(): boolean {
  const token = getToken();
  return isValidToken(token);
}

/**
 * TokenManager class for backward compatibility
 * Provides the same functionality as the exported functions
 */
export class TokenManager {
  setToken(token: string): void {
    setToken(token);
  }

  getToken(): string | null {
    return getToken();
  }

  clearToken(): void {
    clearToken();
  }

  hasToken(): boolean {
    return hasToken();
  }

  isValidToken(token: string | null): boolean {
    return isValidToken(token);
  }
}

/**
 * Singleton instance for backward compatibility
 * Use the exported functions directly for new code
 */
export const tokenManager = new TokenManager();
