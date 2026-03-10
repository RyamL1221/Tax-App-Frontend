/**
 * Unit tests for AuthCoordinator retry logic
 * 
 * Tests the retry limit functionality for JWT refresh operations:
 * - Maximum retry count enforcement
 * - Retry attempt tracking
 * - Logging when retry limit is reached
 * - No retry for 403 errors (authentication failures)
 * 
 * Requirements: 5.3
 */

import { refreshJWTFromSession } from '../AuthCoordinator';
import * as tokenManager from '../api/tokenManager';
import * as authLogger from '../AuthLogger';

// Mock dependencies
jest.mock('../api/tokenManager');
jest.mock('./AuthLogger', () => ({
  logAuthEvent: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('AuthCoordinator - Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshJWTFromSession retry behavior', () => {
    it('should not retry on 403 Forbidden errors', async () => {
      // Arrange
      const traceId = 'test-trace-403';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed: 403 Forbidden',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          status: 403,
          retryCount: 0,
        })
      );
    });

    it('should retry once on 500 Internal Server Error', async () => {
      // Arrange
      const traceId = 'test-trace-500';
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      
      // Check that retry was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed, retrying',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          status: 500,
          retryCount: 0,
          nextRetry: 1,
        })
      );
      
      // Check that retry limit was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed: retry limit reached',
        'error',
        undefined,
        expect.objectContaining({
          traceId,
          status: 500,
          retryCount: 1,
          maxRetries: 1,
          reason: 'Maximum retry attempts exceeded',
        })
      );
    });

    it('should succeed on second attempt after one retry', async () => {
      // Arrange
      const traceId = 'test-trace-retry-success';
      const token = 'new.jwt.token';
      jest.spyOn(tokenManager, 'setToken').mockResolvedValue(true);
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token }),
        });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(tokenManager.setToken).toHaveBeenCalledWith(token, 'AuthCoordinator_refresh', traceId);
      
      // Check that retry was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed, retrying',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 0,
          nextRetry: 1,
        })
      );
      
      // Check that success was logged with retry info
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refreshed from session',
        'info',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 1,
          retriedAfterFailure: true,
        })
      );
    });

    it('should retry once on network error', async () => {
      // Arrange
      const traceId = 'test-trace-network-error';
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      
      // Check that retry was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh error, retrying',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          error: 'Network error',
          retryCount: 0,
          nextRetry: 1,
        })
      );
      
      // Check that retry limit was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh error: retry limit reached',
        'error',
        undefined,
        expect.objectContaining({
          traceId,
          error: 'Network error',
          retryCount: 1,
          maxRetries: 1,
          reason: 'Maximum retry attempts exceeded',
        })
      );
    });

    it('should succeed on second attempt after network error', async () => {
      // Arrange
      const traceId = 'test-trace-network-recovery';
      const token = 'recovered.jwt.token';
      jest.spyOn(tokenManager, 'setToken').mockResolvedValue(true);
      
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token }),
        });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(tokenManager.setToken).toHaveBeenCalledWith(token, 'AuthCoordinator_refresh', traceId);
      
      // Check that retry was logged
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh error, retrying',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          error: 'Network error',
          retryCount: 0,
          nextRetry: 1,
        })
      );
      
      // Check that success was logged with retry info
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refreshed from session',
        'info',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 1,
          retriedAfterFailure: true,
        })
      );
    });

    it('should not retry more than once', async () => {
      // Arrange
      const traceId = 'test-trace-max-retries';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry (not 2 retries)
      
      // Verify retry limit reached log
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed: retry limit reached',
        'error',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 1,
          maxRetries: 1,
        })
      );
    });

    it('should track retry count correctly', async () => {
      // Arrange
      const traceId = 'test-trace-retry-tracking';
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        });

      // Act
      await refreshJWTFromSession(traceId);

      // Assert - verify retry count progression
      const logCalls = (authLogger.logAuthEvent as jest.Mock).mock.calls;
      
      // First call should have retryCount: 0
      const firstRetryLog = logCalls.find(call => 
        call[0] === 'JWT refresh failed, retrying' && call[3].retryCount === 0
      );
      expect(firstRetryLog).toBeDefined();
      expect(firstRetryLog[3].nextRetry).toBe(1);
      
      // Final call should have retryCount: 1
      const finalLog = logCalls.find(call => 
        call[0] === 'JWT refresh failed: retry limit reached'
      );
      expect(finalLog).toBeDefined();
      expect(finalLog[3].retryCount).toBe(1);
      expect(finalLog[3].maxRetries).toBe(1);
    });

    it('should succeed on first attempt without retry', async () => {
      // Arrange
      const traceId = 'test-trace-no-retry';
      const token = 'valid.jwt.token';
      jest.spyOn(tokenManager, 'setToken').mockResolvedValue(true);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token }),
      });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry needed
      expect(tokenManager.setToken).toHaveBeenCalledWith(token, 'AuthCoordinator_refresh', traceId);
      
      // Check that success was logged without retry
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refreshed from session',
        'info',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 0,
          retriedAfterFailure: false,
        })
      );
    });

    it('should handle missing token in response without retry', async () => {
      // Arrange
      const traceId = 'test-trace-missing-token';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Success but no token' }),
      });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry for missing token
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh response missing token',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 0,
        })
      );
    });

    it('should handle token storage failure without retry', async () => {
      // Arrange
      const traceId = 'test-trace-storage-failure';
      const token = 'valid.jwt.token';
      jest.spyOn(tokenManager, 'setToken').mockResolvedValue(false); // Storage fails
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token }),
      });

      // Act
      const result = await refreshJWTFromSession(traceId);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry for storage failure
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh succeeded but storage failed',
        'warn',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 0,
        })
      );
    });
  });

  describe('retry count parameter', () => {
    it('should accept explicit retry count parameter', async () => {
      // Arrange
      const traceId = 'test-trace-explicit-retry';
      const token = 'valid.jwt.token';
      jest.spyOn(tokenManager, 'setToken').mockResolvedValue(true);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token }),
      });

      // Act - call with explicit retry count
      const result = await refreshJWTFromSession(traceId, 0);

      // Assert
      expect(result).toBe(true);
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refreshed from session',
        'info',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 0,
        })
      );
    });

    it('should not retry when already at max retry count', async () => {
      // Arrange
      const traceId = 'test-trace-at-max';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      // Act - call with retry count already at max
      const result = await refreshJWTFromSession(traceId, 1);

      // Assert
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional retry
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT refresh failed: retry limit reached',
        'error',
        undefined,
        expect.objectContaining({
          traceId,
          retryCount: 1,
          maxRetries: 1,
        })
      );
    });
  });
});
