/**
 * Unit tests for AuthCoordinator
 * 
 * Tests the core authentication coordination functionality including:
 * - Getting authentication state with various options
 * - JWT-required authentication
 * - Session fallback behavior
 * - Fallback mode management
 * - Backward compatibility
 * 
 * Requirements: 3.1, 3.2, 1.3, 7.1, 7.2
 */

import {
  getAuthState,
  AuthCoordinator,
  authCoordinator,
  activateFallbackMode,
  deactivateFallbackMode,
  isInFallbackMode,
} from './AuthCoordinator';
import * as tokenManager from '../api/tokenManager';
import * as authLogger from './AuthLogger';

// Mock dependencies
jest.mock('../api/tokenManager');
jest.mock('./AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  logAuthStateChange: jest.fn(),
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
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  describe('getAuthState', () => {
    beforeEach(() => {
      // Mock fetch for session checks
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'No valid session' }),
      });
      // Deactivate fallback mode before each test
      deactivateFallbackMode();
    });

    describe('backward compatibility (no options)', () => {
      it('should return current auth state with JWT', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.hasSession).toBe(true); // Assume session exists if JWT is valid
        expect(state.isAuthenticated).toBe(true);
        expect(state.authMethod).toBe('jwt');
      });

      it('should return current auth state without JWT', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasJWT).toBe(false);
        expect(state.hasSession).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.authMethod).toBe('none');
      });

      it('should work with traceId as string (old signature)', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
        const traceId = 'test-trace-123';

        // Act
        const state = await getAuthState(traceId);

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', traceId);
      });
    });

    describe('requireJWT: true option', () => {
      it('should return unauthenticated when no JWT exists', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert
        expect(state.hasJWT).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.authMethod).toBe('none');
        expect(state.reason).toBe('JWT required for this route');
      });

      it('should return authenticated when JWT exists', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(state.authMethod).toBe('jwt');
        expect(state.reason).toBeUndefined();
      });

      it('should not check session when JWT is missing', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
        const fetchSpy = jest.spyOn(global, 'fetch');

        // Act
        await getAuthState({ requireJWT: true });

        // Assert
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('should include traceId in logs', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
        const traceId = 'test-trace-456';

        // Act
        await getAuthState({ requireJWT: true, traceId });

        // Assert
        expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', traceId);
      });

      it('should not activate fallback mode for JWT-required routes', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert
        expect(state.inFallbackMode).toBe(false);
        expect(state.isAuthenticated).toBe(false);
      });
    });

    describe('requireJWT: false option', () => {
      it('should check session when JWT is missing', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
        const fetchSpy = jest.spyOn(global, 'fetch');

        // Act
        await getAuthState({ requireJWT: false });

        // Assert
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/session', expect.any(Object));
      });

      it('should return authenticated with valid JWT', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState({ requireJWT: false });

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(state.authMethod).toBe('jwt');
      });

      it('should attempt session fallback when JWT is missing', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ valid: true, userId: 'user123', email: 'user@example.com' }),
        });

        // Act
        const state = await getAuthState({ requireJWT: false });

        // Assert
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.any(Object));
      });
    });

    describe('JWT priority over session', () => {
      it('should use JWT when both JWT and session exist', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ valid: true, userId: 'user123', email: 'user@example.com' }),
        });

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.authMethod).toBe('jwt');
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        // Session check should not be called when JWT exists
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should prioritize JWT over session for requireJWT: false', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState({ requireJWT: false });

        // Assert
        expect(state.authMethod).toBe('jwt');
        expect(state.hasJWT).toBe(true);
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    describe('extended auth state properties', () => {
      it('should include inFallbackMode property', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state).toHaveProperty('inFallbackMode');
        expect(typeof state.inFallbackMode).toBe('boolean');
      });

      it('should include authMethod property', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state).toHaveProperty('authMethod');
        expect(['jwt', 'session', 'none']).toContain(state.authMethod);
      });

      it('should include reason when authentication fails', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert
        expect(state).toHaveProperty('reason');
        expect(state.reason).toBe('JWT required for this route');
      });

      it('should not include reason when authentication succeeds', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert
        expect(state.reason).toBeUndefined();
      });
    });
  });

  describe('AuthCoordinator class', () => {
    it('should provide getAuthState method', async () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await coordinator.getAuthState();

      // Assert
      expect(state.hasJWT).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should support options parameter', async () => {
      // Arrange
      const coordinator = new AuthCoordinator();
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const state = await coordinator.getAuthState({ requireJWT: true });

      // Assert
      expect(state.hasJWT).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.reason).toBe('JWT required for this route');
    });
  });

  describe('authCoordinator singleton', () => {
    it('should provide singleton instance', () => {
      // Assert
      expect(authCoordinator).toBeInstanceOf(AuthCoordinator);
    });

    it('should work with singleton instance', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await authCoordinator.getAuthState();

      // Assert
      expect(state.hasJWT).toBe(true);
    });
  });

  describe('fallback mode management', () => {
    it('should activate fallback mode', () => {
      // Act
      activateFallbackMode('localStorage unavailable');

      // Assert
      expect(isInFallbackMode()).toBe(true);
    });

    it('should deactivate fallback mode', () => {
      // Arrange
      activateFallbackMode('test');

      // Act
      deactivateFallbackMode();

      // Assert
      expect(isInFallbackMode()).toBe(false);
    });

    it('should return false when fallback mode is not active', () => {
      // Arrange
      deactivateFallbackMode();

      // Act & Assert
      expect(isInFallbackMode()).toBe(false);
    });
  });
});
