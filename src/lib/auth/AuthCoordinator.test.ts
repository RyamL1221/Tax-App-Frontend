/**
 * Unit tests for AuthCoordinator
 * 
 * Tests the core authentication coordination functionality including:
 * - Initialization with various auth states
 * - Setting authentication (both session and JWT)
 * - Clearing authentication (both mechanisms)
 * - Validating authentication state
 * - JWT recovery from valid session
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import {
  initialize,
  setAuth,
  clearAuth,
  validateAuth,
  recoverJWT,
  getAuthState,
  AuthCoordinator,
  authCoordinator,
} from './AuthCoordinator';
import * as tokenManager from '../api/tokenManager';
import * as authLogger from './AuthLogger';

// Mock dependencies
jest.mock('../api/tokenManager');
jest.mock('./AuthLogger', () => ({
  logAuthStateChange: jest.fn(),
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn((hasSession, hasJWT, userId, email) => ({
    hasSession,
    hasJWT,
    isAuthenticated: hasSession && hasJWT,
    userId: userId || null,
    email: email || null,
  })),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('AuthCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('initialize', () => {
    it('should return auth state with JWT present', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = initialize();

      // Assert
      expect(state.hasJWT).toBe(true);
      expect(state.hasSession).toBe(false); // Unknown on client
      expect(state.isAuthenticated).toBe(false); // Requires both
      expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator.initialize');
      expect(authLogger.logAuthEvent).toHaveBeenCalled();
    });

    it('should return auth state with JWT missing', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const state = initialize();

      // Assert
      expect(state.hasJWT).toBe(false);
      expect(state.hasSession).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should log initialization event', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      initialize();

      // Assert
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'AuthCoordinator initialized',
        'info',
        expect.objectContaining({
          hasJWT: true,
        }),
        expect.objectContaining({
          operation: 'initialize',
        })
      );
    });
  });

  describe('setAuth', () => {
    beforeEach(() => {
      // Mock successful fetch response for session creation
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Session created successfully' }),
      });
    });

    it('should set JWT token and create session with valid inputs', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user123';
      const email = 'user@example.com';
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});

      // Act
      await setAuth(jwt, userId, email);

      // Assert
      expect(tokenManager.setToken).toHaveBeenCalledWith(jwt, 'AuthCoordinator.setAuth');
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      });
      expect(authLogger.logAuthStateChange).toHaveBeenCalledWith(
        'Authentication set (both JWT and session)',
        expect.objectContaining({ hasJWT: false }),
        expect.objectContaining({ hasJWT: true, userId, email, hasSession: true }),
        expect.objectContaining({ operation: 'setAuth', sessionCreated: true })
      );
    });

    it('should throw error for empty JWT', async () => {
      // Arrange
      const jwt = '';
      const userId = 'user123';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid JWT token');
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'setAuth failed: invalid JWT',
        'error',
        expect.any(Object),
        expect.objectContaining({ reason: 'JWT is empty or invalid' })
      );
    });

    it('should throw error for whitespace-only JWT', async () => {
      // Arrange
      const jwt = '   ';
      const userId = 'user123';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid JWT token');
    });

    it('should throw error for empty userId', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = '';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid userId');
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'setAuth failed: invalid userId',
        'error',
        expect.any(Object),
        expect.objectContaining({ reason: 'userId is empty or invalid' })
      );
    });

    it('should throw error for whitespace-only userId', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = '   ';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid userId');
    });

    it('should throw error for empty email', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user123';
      const email = '';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid email');
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'setAuth failed: invalid email',
        'error',
        expect.any(Object),
        expect.objectContaining({ reason: 'email is empty or invalid' })
      );
    });

    it('should throw error for whitespace-only email', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user123';
      const email = '   ';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid email');
    });

    it('should replace existing JWT token', async () => {
      // Arrange
      const jwt = 'new.jwt.token';
      const userId = 'user123';
      const email = 'user@example.com';
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true); // Existing token
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});

      // Act
      await setAuth(jwt, userId, email);

      // Assert
      expect(tokenManager.setToken).toHaveBeenCalledWith(jwt, 'AuthCoordinator.setAuth');
      expect(authLogger.logAuthStateChange).toHaveBeenCalledWith(
        'Authentication set (both JWT and session)',
        expect.objectContaining({ hasJWT: true }), // Old state had JWT
        expect.objectContaining({ hasJWT: true, hasSession: true }), // New state has both
        expect.any(Object)
      );
    });

    it('should clear JWT if session creation fails', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user123';
      const email = 'user@example.com';
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});
      
      // Mock failed session creation
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Session creation failed' }),
      });

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Failed to create session');
      expect(tokenManager.setToken).toHaveBeenCalledWith(jwt, 'AuthCoordinator.setAuth');
      expect(tokenManager.clearToken).toHaveBeenCalledWith('session-creation-failed', 'AuthCoordinator.setAuth');
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'setAuth failed: session creation error',
        'error',
        expect.any(Object),
        expect.objectContaining({
          reason: 'Session creation failed',
          jwtCleared: true,
        })
      );
    });

    it('should clear JWT if session API throws error', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user123';
      const email = 'user@example.com';
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Failed to create session: Network error');
      expect(tokenManager.clearToken).toHaveBeenCalledWith('session-creation-failed', 'AuthCoordinator.setAuth');
    });
  });

  describe('clearAuth', () => {
    it('should clear JWT token', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});

      // Act
      clearAuth('logout');

      // Assert
      expect(tokenManager.clearToken).toHaveBeenCalledWith('logout', 'AuthCoordinator.clearAuth');
      expect(authLogger.logAuthStateChange).toHaveBeenCalledWith(
        'Authentication cleared',
        expect.objectContaining({ hasJWT: true }),
        expect.objectContaining({ hasJWT: false }),
        expect.objectContaining({ reason: 'logout' })
      );
    });

    it('should use default reason if not provided', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});

      // Act
      clearAuth();

      // Assert
      expect(tokenManager.clearToken).toHaveBeenCalledWith('unknown', 'AuthCoordinator.clearAuth');
      expect(authLogger.logAuthStateChange).toHaveBeenCalledWith(
        'Authentication cleared',
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({ reason: 'unknown' })
      );
    });

    it('should clear even when no JWT exists', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});

      // Act
      clearAuth('expired');

      // Assert
      expect(tokenManager.clearToken).toHaveBeenCalledWith('expired', 'AuthCoordinator.clearAuth');
      expect(authLogger.logAuthStateChange).toHaveBeenCalledWith(
        'Authentication cleared',
        expect.objectContaining({ hasJWT: false }),
        expect.objectContaining({ hasJWT: false }),
        expect.any(Object)
      );
    });

    it('should handle various clear reasons', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});
      const reasons = ['logout', 'expired', 'invalid', 'session_mismatch'];

      // Act & Assert
      reasons.forEach(reason => {
        clearAuth(reason);
        expect(tokenManager.clearToken).toHaveBeenCalledWith(reason, 'AuthCoordinator.clearAuth');
      });
    });
  });

  describe('validateAuth', () => {
    it('should return valid when JWT exists', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const result = validateAuth();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.canRecover).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'Auth validation: valid',
        'debug',
        expect.objectContaining({ hasJWT: true }),
        expect.objectContaining({ result: 'valid' })
      );
    });

    it('should return invalid when JWT missing', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const result = validateAuth();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('JWT token missing');
      expect(result.canRecover).toBe(true);
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'Auth validation: JWT missing',
        'warn',
        expect.objectContaining({ hasJWT: false }),
        expect.objectContaining({
          result: 'invalid',
          reason: 'JWT token missing',
          canRecover: true,
        })
      );
    });

    it('should indicate recovery is possible when JWT missing', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const result = validateAuth();

      // Assert
      expect(result.canRecover).toBe(true);
    });
  });

  describe('recoverJWT', () => {
    it('should return null (placeholder implementation)', async () => {
      // Act
      const result = await recoverJWT();

      // Assert
      expect(result).toBeNull();
      expect(authLogger.logAuthEvent).toHaveBeenCalledWith(
        'JWT recovery attempted',
        'info',
        expect.any(Object),
        expect.objectContaining({
          operation: 'recoverJWT',
          note: 'Recovery requires server-side session validation',
        })
      );
    });

    it('should log recovery attempt', async () => {
      // Act
      await recoverJWT();

      // Assert
      expect(authLogger.logAuthEvent).toHaveBeenCalled();
    });
  });

  describe('getAuthState', () => {
    it('should return current auth state with JWT', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = getAuthState();

      // Assert
      expect(state.hasJWT).toBe(true);
      expect(state.hasSession).toBe(false); // Unknown on client
      expect(state.isAuthenticated).toBe(false);
    });

    it('should return current auth state without JWT', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const state = getAuthState();

      // Assert
      expect(state.hasJWT).toBe(false);
      expect(state.hasSession).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('AuthCoordinator class', () => {
    beforeEach(() => {
      // Mock successful fetch response for session creation
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Session created successfully' }),
      });
    });

    it('should provide initialize method', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const coordinator = new AuthCoordinator();
      const state = coordinator.initialize();

      // Assert
      expect(state.hasJWT).toBe(true);
    });

    it('should provide setAuth method', async () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});

      // Act
      await coordinator.setAuth('jwt', 'user123', 'user@example.com');

      // Assert
      expect(tokenManager.setToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should provide clearAuth method', () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});

      // Act
      coordinator.clearAuth('logout');

      // Assert
      expect(tokenManager.clearToken).toHaveBeenCalled();
    });

    it('should provide validateAuth method', () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const result = coordinator.validateAuth();

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should provide recoverJWT method', async () => {
      // Arrange
      const coordinator = new AuthCoordinator();

      // Act
      const result = await coordinator.recoverJWT();

      // Assert
      expect(result).toBeNull();
    });

    it('should provide getAuthState method', () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = coordinator.getAuthState();

      // Assert
      expect(state.hasJWT).toBe(true);
    });
  });

  describe('authCoordinator singleton', () => {
    it('should provide singleton instance', () => {
      // Assert
      expect(authCoordinator).toBeInstanceOf(AuthCoordinator);
    });

    it('should work with singleton instance', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = authCoordinator.getAuthState();

      // Assert
      expect(state.hasJWT).toBe(true);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      // Mock successful fetch response for session creation
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Session created successfully' }),
      });
    });

    it('should handle null JWT gracefully', async () => {
      // Arrange
      const jwt = null as unknown as string;
      const userId = 'user123';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid JWT token');
    });

    it('should handle undefined JWT gracefully', async () => {
      // Arrange
      const jwt = undefined as unknown as string;
      const userId = 'user123';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid JWT token');
    });

    it('should handle non-string JWT gracefully', async () => {
      // Arrange
      const jwt = 123 as unknown as string;
      const userId = 'user123';
      const email = 'user@example.com';

      // Act & Assert
      await expect(setAuth(jwt, userId, email)).rejects.toThrow('Invalid JWT token');
    });

    it('should handle special characters in userId and email', async () => {
      // Arrange
      const jwt = 'valid.jwt.token';
      const userId = 'user-123_test@domain';
      const email = 'user+test@example.com';
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});

      // Act
      await setAuth(jwt, userId, email);

      // Assert
      expect(tokenManager.setToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle multiple rapid setAuth calls', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      jest.spyOn(tokenManager, 'setToken').mockImplementation(() => {});

      // Act
      await setAuth('jwt1', 'user1', 'user1@example.com');
      await setAuth('jwt2', 'user2', 'user2@example.com');
      await setAuth('jwt3', 'user3', 'user3@example.com');

      // Assert
      expect(tokenManager.setToken).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple rapid clearAuth calls', () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
      jest.spyOn(tokenManager, 'clearToken').mockImplementation(() => {});

      // Act
      clearAuth('reason1');
      clearAuth('reason2');
      clearAuth('reason3');

      // Assert
      expect(tokenManager.clearToken).toHaveBeenCalledTimes(3);
    });
  });
});
