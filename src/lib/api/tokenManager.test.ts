/**
 * Unit tests for TokenManager
 * Tests token storage, retrieval, clearing, validation, and security requirements
 * Requirements: 1.1, 1.3, 1.4, 1.5, 6.2, 8.2, 8.3
 */

import { TokenManager, setToken, getToken, clearToken, hasToken, isValidToken } from './tokenManager';

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

  describe('isValidToken', () => {
    it('should return true for valid non-empty string tokens', () => {
      expect(isValidToken('valid-token')).toBe(true);
      expect(isValidToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token')).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidToken(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidToken('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isValidToken('   ')).toBe(false);
      expect(isValidToken('\t\n')).toBe(false);
    });

    it('should return true for token with leading/trailing whitespace', () => {
      expect(isValidToken('  token  ')).toBe(true);
    });
  });

  describe('setToken', () => {
    it('should store a valid token in localStorage with correct key', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setToken(token);
      
      expect(localStorage.getItem('jwt_token')).toBe(token);
    });

    it('should trim whitespace from token before storing', () => {
      const token = '  token-with-spaces  ';
      
      setToken(token);
      
      expect(localStorage.getItem('jwt_token')).toBe('token-with-spaces');
    });

    it('should not store invalid tokens (empty string)', () => {
      setToken('');
      
      expect(localStorage.getItem('jwt_token')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid token')
      );
    });

    it('should not store invalid tokens (whitespace only)', () => {
      setToken('   ');
      
      expect(localStorage.getItem('jwt_token')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid token')
      );
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setToken(token);
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });

    it('should overwrite existing token', () => {
      const token1 = 'token1';
      const token2 = 'token2';
      
      setToken(token1);
      setToken(token2);
      
      expect(localStorage.getItem('jwt_token')).toBe(token2);
    });

    it('should work with TokenManager class instance', () => {
      const token = 'test-token';
      
      tokenManager.setToken(token);
      
      expect(localStorage.getItem('jwt_token')).toBe(token);
    });
  });

  describe('getToken', () => {
    it('should retrieve a stored valid token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('jwt_token', token);
      
      const retrieved = getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should return null when no token is stored', () => {
      const retrieved = getToken();
      
      expect(retrieved).toBeNull();
    });

    it('should return null and clear invalid token (empty string)', () => {
      localStorage.setItem('jwt_token', '');
      
      const retrieved = getToken();
      
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('jwt_token')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid token detected')
      );
    });

    it('should return null and clear invalid token (whitespace only)', () => {
      localStorage.setItem('jwt_token', '   ');
      
      const retrieved = getToken();
      
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('jwt_token', token);
      
      getToken();
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });

    it('should work with TokenManager class instance', () => {
      const token = 'test-token';
      localStorage.setItem('jwt_token', token);
      
      const retrieved = tokenManager.getToken();
      
      expect(retrieved).toBe(token);
    });
  });

  describe('clearToken', () => {
    it('should remove the token from localStorage', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('jwt_token', token);
      
      clearToken();
      
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('should be idempotent (safe to call multiple times)', () => {
      const token = 'test-token';
      localStorage.setItem('jwt_token', token);
      
      clearToken();
      clearToken();
      clearToken();
      
      expect(localStorage.getItem('jwt_token')).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not throw error when no token exists', () => {
      expect(() => clearToken()).not.toThrow();
    });

    it('should not log the token value to console', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('jwt_token', token);
      
      clearToken();
      
      // Check that token was not logged
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining(token));
    });

    it('should work with TokenManager class instance', () => {
      const token = 'test-token';
      localStorage.setItem('jwt_token', token);
      
      tokenManager.clearToken();
      
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });
  });

  describe('hasToken', () => {
    it('should return true when a valid token exists', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      localStorage.setItem('jwt_token', token);
      
      expect(hasToken()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(hasToken()).toBe(false);
    });

    it('should return false when token is invalid (empty string)', () => {
      localStorage.setItem('jwt_token', '');
      
      expect(hasToken()).toBe(false);
    });

    it('should return false when token is invalid (whitespace only)', () => {
      localStorage.setItem('jwt_token', '   ');
      
      expect(hasToken()).toBe(false);
    });

    it('should return false after token is cleared', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      setToken(token);
      clearToken();
      
      expect(hasToken()).toBe(false);
    });

    it('should work with TokenManager class instance', () => {
      const token = 'test-token';
      localStorage.setItem('jwt_token', token);
      
      expect(tokenManager.hasToken()).toBe(true);
    });
  });

  describe('token storage round-trip', () => {
    it('should retrieve the exact same token that was stored', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      setToken(token);
      const retrieved = getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should handle tokens with special characters', () => {
      const token = 'token.with-special_chars/+=';
      
      setToken(token);
      const retrieved = getToken();
      
      expect(retrieved).toBe(token);
    });

    it('should trim whitespace during storage but preserve internal spaces', () => {
      const token = '  token with spaces  ';
      
      setToken(token);
      const retrieved = getToken();
      
      expect(retrieved).toBe('token with spaces');
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage quota exceeded error in setToken', () => {
      const token = 'test-token';
      
      // Mock localStorage.setItem to throw quota exceeded error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      expect(() => setToken(token)).toThrow('Unable to save session');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store token'),
        expect.any(Error)
      );
      
      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle localStorage unavailable error in getToken', () => {
      // Mock localStorage.getItem to throw error
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      
      const retrieved = getToken();
      
      expect(retrieved).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to retrieve token'),
        expect.any(Error)
      );
      
      // Restore mock
      jest.restoreAllMocks();
    });

    it('should handle localStorage error in clearToken gracefully', () => {
      // Mock localStorage.removeItem to throw error
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      
      expect(() => clearToken()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to clear token'),
        expect.any(Error)
      );
      
      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('security requirements', () => {
    it('should never log token values during any operation', () => {
      const token = 'secret-token-value';
      
      // Perform all operations
      setToken(token);
      getToken();
      hasToken();
      clearToken();
      
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

    it('should log warnings without token values for invalid tokens', () => {
      setToken('');
      
      // Should have console.warn for invalid token
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid token')
      );
      
      // Verify token value is never logged in any console output
      const allCalls = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls
      ];
      
      allCalls.forEach(call => {
        call.forEach(arg => {
          // The empty string token shouldn't appear, but more importantly,
          // the message should indicate security awareness
          if (typeof arg === 'string') {
            // Either the old format or AuthLogger format is acceptable
            const hasSecurityNote = arg.includes('token value not logged for security') || 
                                   arg.includes('Token set failed') ||
                                   arg.includes('invalid token');
            expect(hasSecurityNote).toBe(true);
          }
        });
      });
    });
  });
});
