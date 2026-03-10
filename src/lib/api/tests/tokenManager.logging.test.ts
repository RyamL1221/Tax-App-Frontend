/**
 * Integration tests for TokenManager logging functionality
 * Verifies that AuthLogger is properly integrated with TokenManager
 * Requirements: 2.2, 2.5
 */

import { setToken, getToken, clearToken, isValidToken, hasToken } from '../tokenManager';

// Mock the AuthLogger module
jest.mock('../auth/AuthLogger', () => ({
  logTokenOperation: jest.fn(),
}));

import { logTokenOperation } from '../auth/AuthLogger';

describe('TokenManager Logging Integration', () => {
  const mockLogTokenOperation = logTokenOperation as jest.MockedFunction<typeof logTokenOperation>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Clear mock calls
    mockLogTokenOperation.mockClear();
  });

  describe('setToken logging', () => {
    it('should log successful token set operation', () => {
      const token = 'valid-token-123';
      
      setToken(token, 'login');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'set',
        true,
        undefined,
        'login'
      );
    });

    it('should log failed token set operation for invalid token', () => {
      setToken('', 'login');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'set',
        false,
        'Invalid token format',
        'login'
      );
    });

    it('should log without source when not provided', () => {
      const token = 'valid-token-123';
      
      setToken(token);
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'set',
        true,
        undefined,
        undefined
      );
    });
  });

  describe('getToken logging', () => {
    it('should log successful token retrieval', () => {
      const token = 'valid-token-123';
      localStorage.setItem('jwt_token', token);
      
      getToken('api-call');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'get',
        true,
        undefined,
        'api-call'
      );
    });

    it('should log failed token retrieval when no token exists', () => {
      getToken('api-call');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'get',
        false,
        'No token found',
        'api-call'
      );
    });

    it('should log failed token retrieval for invalid token', () => {
      localStorage.setItem('jwt_token', '');
      
      getToken('api-call');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'get',
        false,
        'Invalid token detected',
        'api-call'
      );
    });

    it('should log without source when not provided', () => {
      const token = 'valid-token-123';
      localStorage.setItem('jwt_token', token);
      
      getToken();
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'get',
        true,
        undefined,
        undefined
      );
    });
  });

  describe('clearToken logging', () => {
    it('should log successful token clear operation', () => {
      const token = 'valid-token-123';
      localStorage.setItem('jwt_token', token);
      
      clearToken('logout', 'user-action');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'clear',
        true,
        'logout',
        'user-action'
      );
    });

    it('should not log when no token exists to clear', () => {
      clearToken('logout', 'user-action');
      
      // Should not log when there was no token to clear
      expect(mockLogTokenOperation).not.toHaveBeenCalled();
    });

    it('should log without reason and source when not provided', () => {
      const token = 'valid-token-123';
      localStorage.setItem('jwt_token', token);
      
      clearToken();
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'clear',
        true,
        undefined,
        undefined
      );
    });
  });

  describe('isValidToken logging', () => {
    it('should log validation when source is provided', () => {
      isValidToken('valid-token', 'validation-check');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'validate',
        true,
        undefined,
        'validation-check'
      );
    });

    it('should log failed validation when source is provided', () => {
      isValidToken(null, 'validation-check');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'validate',
        false,
        'Token is null',
        'validation-check'
      );
    });

    it('should not log when source is not provided (internal validation)', () => {
      isValidToken('valid-token');
      
      // Should not log internal validation checks
      expect(mockLogTokenOperation).not.toHaveBeenCalled();
    });

    it('should log appropriate reason for empty string', () => {
      isValidToken('', 'validation-check');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'validate',
        false,
        'Token is empty',
        'validation-check'
      );
    });

    it('should log appropriate reason for non-string', () => {
      isValidToken(123 as any, 'validation-check');
      
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'validate',
        false,
        'Token is not a string',
        'validation-check'
      );
    });
  });

  describe('hasToken logging', () => {
    it('should trigger getToken logging with source', () => {
      const token = 'valid-token-123';
      localStorage.setItem('jwt_token', token);
      
      hasToken('auth-check');
      
      // hasToken calls getToken internally, which should log
      expect(mockLogTokenOperation).toHaveBeenCalledWith(
        'get',
        true,
        undefined,
        'auth-check'
      );
    });
  });

  describe('logging context tracking', () => {
    it('should track different sources across operations', () => {
      const token = 'valid-token-123';
      
      // Login flow
      setToken(token, 'login');
      expect(mockLogTokenOperation).toHaveBeenLastCalledWith(
        'set',
        true,
        undefined,
        'login'
      );
      
      // API call
      getToken('api-call');
      expect(mockLogTokenOperation).toHaveBeenLastCalledWith(
        'get',
        true,
        undefined,
        'api-call'
      );
      
      // Logout
      clearToken('logout', 'user-action');
      expect(mockLogTokenOperation).toHaveBeenLastCalledWith(
        'clear',
        true,
        'logout',
        'user-action'
      );
      
      // Verify all three operations were logged
      expect(mockLogTokenOperation).toHaveBeenCalledTimes(3);
    });

    it('should track different reasons for clearing', () => {
      const token = 'valid-token-123';
      
      // Test different clear reasons
      const reasons = ['logout', 'expired', 'invalid', 'session_timeout'];
      
      reasons.forEach(reason => {
        localStorage.setItem('jwt_token', token);
        clearToken(reason, 'test');
        
        expect(mockLogTokenOperation).toHaveBeenLastCalledWith(
          'clear',
          true,
          reason,
          'test'
        );
      });
      
      expect(mockLogTokenOperation).toHaveBeenCalledTimes(reasons.length);
    });
  });

  describe('security - never log token values', () => {
    it('should never pass token values to logger', () => {
      const secretToken = 'super-secret-token-value-12345';
      
      // Perform all operations
      setToken(secretToken, 'login');
      getToken('api-call');
      clearToken('logout', 'user-action');
      
      // Check all calls to logTokenOperation
      mockLogTokenOperation.mock.calls.forEach(call => {
        call.forEach(arg => {
          if (typeof arg === 'string') {
            expect(arg).not.toContain(secretToken);
          }
        });
      });
    });
  });
});
