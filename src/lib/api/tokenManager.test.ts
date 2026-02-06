/**
 * Unit tests for TokenManager
 * Tests token storage, retrieval, clearing, and security requirements
 */

import { TokenManager } from './tokenManager';

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    tokenManager = new TokenManager();
    // Clear localStorage before each test
    localStorage.clear();
    
    // Spy on console methods to ensure no token logging
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('setToken', () => {
    it('should store a token in localStorage', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      tokenManager.setToken(token);
      
      expect(localStorage.getItem('tax_app_jwt_token')).toBe(token);
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      tokenManager.setToken(token);
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });

    it('should overwrite existing token', () => {
      const token1 = 'token1';
      const token2 = 'token2';
      
      tokenManager.setToken(token1);
      tokenManager.setToken(token2);
      
      expect(localStorage.getItem('tax_app_jwt_token')).toBe(token2);
    });
  });

  describe('getToken', () => {
    it('should retrieve a stored token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('tax_app_jwt_token', token);
      
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should return null when no token is stored', () => {
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBeNull();
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('tax_app_jwt_token', token);
      
      tokenManager.getToken();
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });
  });

  describe('clearToken', () => {
    it('should remove the token from localStorage', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('tax_app_jwt_token', token);
      
      tokenManager.clearToken();
      
      expect(localStorage.getItem('tax_app_jwt_token')).toBeNull();
    });

    it('should not throw error when no token exists', () => {
      expect(() => tokenManager.clearToken()).not.toThrow();
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('tax_app_jwt_token', token);
      
      tokenManager.clearToken();
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });
  });

  describe('hasToken', () => {
    it('should return true when a token exists', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('tax_app_jwt_token', token);
      
      expect(tokenManager.hasToken()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(tokenManager.hasToken()).toBe(false);
    });

    it('should return false after token is cleared', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      tokenManager.setToken(token);
      tokenManager.clearToken();
      
      expect(tokenManager.hasToken()).toBe(false);
    });
  });

  describe('token storage round-trip', () => {
    it('should retrieve the exact same token that was stored', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      tokenManager.setToken(token);
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should handle tokens with special characters', () => {
      const token = 'token.with-special_chars/+=';
      
      tokenManager.setToken(token);
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should handle empty string tokens', () => {
      const token = '';
      
      tokenManager.setToken(token);
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBe(token);
    });
  });

  describe('security requirements', () => {
    it('should never log token values during any operation', () => {
      const token = 'secret-token-value';
      
      // Perform all operations
      tokenManager.setToken(token);
      tokenManager.getToken();
      tokenManager.hasToken();
      tokenManager.clearToken();
      
      // Verify token was never logged
      const allCalls = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls
      ];
      
      allCalls.forEach(call => {
        call.forEach(arg => {
          if (typeof arg === 'string') {
            expect(arg).not.toContain(token);
          }
        });
      });
    });
  });
});
