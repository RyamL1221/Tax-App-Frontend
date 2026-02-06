/**
 * TokenManager - Manages secure storage and retrieval of JWT tokens
 * 
 * This class provides methods to store, retrieve, and clear JWT tokens
 * in browser localStorage. It ensures tokens are never logged to the console
 * for security purposes.
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5
 */

const STORAGE_KEY = 'tax_app_jwt_token';

export class TokenManager {
  /**
   * Store a JWT token in localStorage
   * @param token - The JWT token to store
   * Requirements: 2.1
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, token);
    }
  }

  /**
   * Retrieve the stored JWT token from localStorage
   * @returns The stored JWT token or null if not found
   * Requirements: 2.3
   */
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  }

  /**
   * Remove the JWT token from localStorage
   * Requirements: 2.4
   */
  clearToken(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Check if a JWT token exists in localStorage
   * @returns true if a token exists, false otherwise
   * Requirements: 2.3
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }
}

// Export a singleton instance for convenience
export const tokenManager = new TokenManager();
