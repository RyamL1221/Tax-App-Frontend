/**
 * Tests for comprehensive state transition logging in AuthCoordinator
 * 
 * Validates: Requirements 6.1, 6.4, 6.5
 * - Log before and after states for all transitions
 * - Include trace ID in all logs
 * - Add timestamp to log entries
 * - Log the specific reason for authentication failures
 */

import { getAuthState, refreshJWTFromSession } from '../AuthCoordinator';
import * as tokenManager from '../api/tokenManager';

// Mock tokenManager
jest.mock('../api/tokenManager', () => ({
  hasToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AuthCoordinator - Comprehensive State Transition Logging', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Spy on console methods to capture logs
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Requirement 6.1: Before/After State Logging', () => {
    it('should log initial state before authentication check', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert: Check for initial state log
      const initialStateLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('Initial state before authentication check')
      );
      expect(initialStateLogs.length).toBeGreaterThan(0);
      
      const initialStateLog = initialStateLogs[0][1];
      expect(initialStateLog).toHaveProperty('initialState');
      expect(initialStateLog.initialState).toHaveProperty('hasJWT');
      expect(initialStateLog.initialState).toHaveProperty('inFallbackMode');
      expect(initialStateLog.initialState).toHaveProperty('requireJWT');
      expect(initialStateLog.initialState).toHaveProperty('timestamp');
    });

    it('should log state transition with before and after states', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert: Check for state transition log
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('State transition:')
      );
      expect(transitionLogs.length).toBeGreaterThan(0);
      
      const transitionLog = transitionLogs[0][1];
      expect(transitionLog).toHaveProperty('before');
      expect(transitionLog).toHaveProperty('after');
      expect(transitionLog).toHaveProperty('transition');
      expect(transitionLog).toHaveProperty('durationMs');
    });

    it('should log JWT authentication transition', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act
      await getAuthState({ traceId: 'test-123' });

      // Assert: Check for JWT authentication transition
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('State transition: JWT authentication')
      );
      expect(transitionLogs.length).toBeGreaterThan(0);
      
      const transitionLog = transitionLogs[0][1];
      expect(transitionLog.transition).toBe('unauthenticated -> authenticated (JWT)');
      expect(transitionLog.before).toHaveProperty('hasJWT', true);
      expect(transitionLog.after).toHaveProperty('isAuthenticated', true);
      expect(transitionLog.after).toHaveProperty('authMethod', 'jwt');
    });

    it('should log JWT requirement not met transition', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert: Check for JWT requirement transition
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('State transition: JWT requirement not met')
      );
      expect(transitionLogs.length).toBeGreaterThan(0);
      
      const transitionLog = transitionLogs[0][1];
      expect(transitionLog.transition).toBe('unauthenticated -> rejected (JWT required)');
      expect(transitionLog.reason).toBe('JWT required for this route');
    });
  });

  describe('Requirement 6.4: Trace ID in All Logs', () => {
    it('should include trace ID in all authentication logs', async () => {
      // Arrange
      const traceId = 'trace-abc-123';
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act
      await getAuthState({ traceId });

      // Assert: Check that trace ID appears in logs
      const logsWithTraceId = consoleLogSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.traceId === traceId;
      });
      
      expect(logsWithTraceId.length).toBeGreaterThan(0);
    });

    it('should include trace ID in JWT refresh logs', async () => {
      // Arrange
      const traceId = 'trace-refresh-456';
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'new-jwt-token' }),
      });
      (tokenManager.setToken as jest.Mock).mockResolvedValue(true);

      // Act
      await refreshJWTFromSession(traceId);

      // Assert: Check that trace ID appears in refresh logs
      const logsWithTraceId = consoleLogSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.traceId === traceId;
      });
      
      expect(logsWithTraceId.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.5: Timestamps in Log Entries', () => {
    it('should include ISO timestamp in authentication logs', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act
      await getAuthState({ traceId: 'test-123' });

      // Assert: Check for timestamps in logs
      const logsWithTimestamp = consoleLogSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.timestamp && typeof logData.timestamp === 'string';
      });
      
      expect(logsWithTimestamp.length).toBeGreaterThan(0);
      
      // Verify timestamp is in ISO format
      const firstLog = logsWithTimestamp[0][1];
      expect(firstLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include timestamp in state transition logs', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert: Check for timestamps in transition logs
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('State transition:')
      );
      
      expect(transitionLogs.length).toBeGreaterThan(0);
      const transitionLog = transitionLogs[0][1];
      expect(transitionLog).toHaveProperty('timestamp');
      expect(transitionLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include timestamp in JWT refresh logs', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      // Act
      await refreshJWTFromSession('test-123');

      // Assert: Check for timestamps in refresh logs
      const logsWithTimestamp = consoleWarnSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.timestamp && typeof logData.timestamp === 'string';
      });
      
      expect(logsWithTimestamp.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.1: Specific Failure Reasons', () => {
    it('should log specific reason for JWT requirement failure', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act
      const state = await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert
      expect(state.reason).toBe('JWT required for this route');
      
      const reasonLogs = consoleLogSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.reason === 'JWT required for this route';
      });
      expect(reasonLogs.length).toBeGreaterThan(0);
    });

    it('should log specific reason for JWT refresh failure (403)', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'No valid session' }),
      });

      // Act
      await refreshJWTFromSession('test-123');

      // Assert: Check for 403 status in logs
      const statusLogs = consoleWarnSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.status === 403;
      });
      expect(statusLogs.length).toBeGreaterThan(0);
      
      // Also check for state transition log with reason
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.reason === 'No valid session exists on backend';
      });
      expect(transitionLogs.length).toBeGreaterThan(0);
    });

    it('should log specific reason for session check error', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      const errorMessage = 'Network timeout';
      (global.fetch as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const state = await getAuthState({ traceId: 'test-123' });

      // Assert: State should indicate no session found (because session check failed)
      expect(state.reason).toBe('No JWT or session found');
      
      // But the error should be logged
      const errorLogs = consoleErrorSpy.mock.calls.filter(call => {
        const logData = call[1];
        return logData && logData.error === errorMessage;
      });
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Duration Tracking', () => {
    it('should include duration in milliseconds for state transitions', async () => {
      // Arrange
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act
      await getAuthState({ traceId: 'test-123' });

      // Assert: Check for durationMs in transition logs
      const transitionLogs = consoleLogSpy.mock.calls.filter(call => 
        call[0].includes('State transition:')
      );
      
      expect(transitionLogs.length).toBeGreaterThan(0);
      const transitionLog = transitionLogs[0][1];
      expect(transitionLog).toHaveProperty('durationMs');
      expect(typeof transitionLog.durationMs).toBe('number');
      expect(transitionLog.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
