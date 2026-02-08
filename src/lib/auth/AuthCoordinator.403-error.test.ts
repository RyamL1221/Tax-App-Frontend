/**
 * Unit tests for AuthCoordinator 403 error handling
 * 
 * Tests that 403 errors from JWT refresh are properly handled:
 * - Returns isAuthenticated: false
 * - Logs HTTP status code and error details
 * - Includes trace ID in error logs
 * - Clears any cached authentication state
 * 
 * Requirements: 1.2, 3.5, 5.2, 6.3
 */

import { getAuthState, refreshJWTFromSession } from './AuthCoordinator';
import * as tokenManager from '../api/tokenManager';

// Mock tokenManager
jest.mock('../api/tokenManager', () => ({
  hasToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock AuthLogger
jest.mock('./AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AuthCoordinator - 403 Error Handling', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create spies but don't suppress output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('refreshJWTFromSession with 403 error', () => {
    it('should return false when refresh returns 403', async () => {
      // Mock 403 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      const result = await refreshJWTFromSession('test-trace-id');

      expect(result).toBe(false);
    });

    it('should log HTTP status code and error details for 403', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // Mock 403 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      await refreshJWTFromSession('test-trace-id');

      // Verify logging includes status code and error details
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('403 Forbidden'),
        expect.objectContaining({
          status: 403,
          statusText: 'Forbidden',
          errorDetails: 'No valid session',
          traceId: 'test-trace-id',
        })
      );
    });

    it('should include trace ID in error logs', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const traceId = 'unique-trace-id-123';
      
      // Mock 403 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      await refreshJWTFromSession(traceId);

      // Verify trace ID is included in logs
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          traceId,
        })
      );
    });

    it('should log clearing of cached authentication state', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      // Mock 403 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      await refreshJWTFromSession('test-trace-id');

      // Verify logging of cache clearing
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Clearing cached authentication state'),
        expect.objectContaining({
          traceId: 'test-trace-id',
        })
      );
    });

    it('should handle 403 with different error response formats', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // Mock 403 response with message field instead of error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Session expired' }),
      });

      const result = await refreshJWTFromSession('test-trace-id');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 403,
          errorDetails: 'Session expired',
        })
      );
    });

    it('should handle 403 with unparseable error response', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // Mock 403 response that fails to parse
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await refreshJWTFromSession('test-trace-id');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 403,
          errorDetails: 'Forbidden',
        })
      );
    });
  });

  describe('getAuthState with 403 error and requireJWT', () => {
    it('should return isAuthenticated: false when no JWT and requireJWT is true', async () => {
      // Mock no JWT token
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      const state = await getAuthState({ requireJWT: true, traceId: 'test-trace-id' });

      expect(state.isAuthenticated).toBe(false);
      expect(state.hasJWT).toBe(false);
      expect(state.authMethod).toBe('none');
      expect(state.reason).toBe('JWT required for this route');
    });

    it('should not activate fallback mode when no JWT and requireJWT is true', async () => {
      // Mock no JWT token
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      const state = await getAuthState({ requireJWT: true, traceId: 'test-trace-id' });

      expect(state.inFallbackMode).toBe(false);
    });

    it('should log the reason for authentication failure when JWT is required but missing', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      // Mock no JWT token
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      await getAuthState({ requireJWT: true, traceId: 'test-trace-id' });

      // Verify logging includes reason
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('JWT required but not found'),
        expect.objectContaining({
          requireJWT: true,
        })
      );
    });

    it('should include trace ID in all authentication logs', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const traceId = 'unique-trace-id-456';
      
      // Mock no JWT token
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      
      // Mock valid session
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        // Mock 403 on refresh
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: 'No valid session' }),
        });

      await getAuthState({ requireJWT: true, traceId });

      // Verify trace ID is in multiple log calls
      const logsWithTraceId = consoleLogSpy.mock.calls.filter(
        call => call[1] && typeof call[1] === 'object' && call[1].traceId === traceId
      );
      
      expect(logsWithTraceId.length).toBeGreaterThan(0);
    });
  });

  describe('getAuthState with 403 error and requireJWT: false', () => {
    it('should activate fallback mode when refresh fails with 403 and requireJWT is false', async () => {
      // Mock no JWT token
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      
      // Mock valid session
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        // Mock 403 on refresh
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: 'No valid session' }),
        });

      const state = await getAuthState({ requireJWT: false, traceId: 'test-trace-id' });

      // For non-JWT-required routes, fallback mode should be activated
      expect(state.inFallbackMode).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.authMethod).toBe('session');
    });
  });

  describe('Other HTTP error codes', () => {
    it('should return false for 500 errors', async () => {
      // Mock 500 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      const result = await refreshJWTFromSession('test-trace-id');

      expect(result).toBe(false);
    });

    it('should return false for network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await refreshJWTFromSession('test-trace-id');

      expect(result).toBe(false);
    });
  });
});
