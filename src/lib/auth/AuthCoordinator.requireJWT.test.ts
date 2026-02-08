/**
 * Unit tests for AuthCoordinator requireJWT functionality
 * 
 * Tests the new AuthOptions interface and requireJWT logic added in task 1
 * of the fix-dashboard-auth-redirect spec.
 * 
 * Requirements: 1.3, 3.1, 3.4, 7.1, 7.2
 */

import { getAuthState, type AuthOptions, type ExtendedAuthState } from './AuthCoordinator';
import * as tokenManager from '../api/tokenManager';

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

describe('AuthCoordinator - requireJWT functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  });

  describe('AuthOptions interface', () => {
    it('should accept requireJWT option', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      const options: AuthOptions = { requireJWT: true };

      // Act
      const state = await getAuthState(options);

      // Assert
      expect(state.isAuthenticated).toBe(false);
      expect(state.reason).toBe('JWT required for this route');
    });

    it('should accept traceId option', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      const options: AuthOptions = { traceId: 'test-trace-123' };

      // Act
      const state = await getAuthState(options);

      // Assert
      expect(state).toBeDefined();
      expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', 'test-trace-123');
    });

    it('should accept both requireJWT and traceId', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      const options: AuthOptions = { requireJWT: true, traceId: 'test-trace-456' };

      // Act
      const state = await getAuthState(options);

      // Assert
      expect(state.isAuthenticated).toBe(false);
      expect(state.reason).toBe('JWT required for this route');
      expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', 'test-trace-456');
    });
  });

  describe('requireJWT: true behavior', () => {
    it('should return unauthenticated when no JWT and requireJWT is true', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const state = await getAuthState({ requireJWT: true });

      // Assert
      expect(state.isAuthenticated).toBe(false);
      expect(state.hasJWT).toBe(false);
      expect(state.authMethod).toBe('none');
      expect(state.reason).toBe('JWT required for this route');
    });

    it('should skip session check when requireJWT is true and no JWT', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      const fetchSpy = jest.spyOn(global, 'fetch');

      // Act
      await getAuthState({ requireJWT: true });

      // Assert
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return authenticated when JWT exists and requireJWT is true', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await getAuthState({ requireJWT: true });

      // Assert
      expect(state.isAuthenticated).toBe(true);
      expect(state.hasJWT).toBe(true);
      expect(state.authMethod).toBe('jwt');
      expect(state.reason).toBeUndefined();
    });
  });

  describe('requireJWT: false behavior', () => {
    it('should attempt session check when requireJWT is false and no JWT', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Act
      await getAuthState({ requireJWT: false });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('should use session fallback when requireJWT is false', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        });

      // Act
      const state = await getAuthState({ requireJWT: false });

      // Assert
      expect(state.isAuthenticated).toBe(true);
      expect(state.authMethod).toBe('session');
      expect(state.inFallbackMode).toBe(true);
    });
  });

  describe('backward compatibility', () => {
    it('should accept string traceId (old signature)', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await getAuthState('legacy-trace-id');

      // Assert
      expect(state.isAuthenticated).toBe(true);
      expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', 'legacy-trace-id');
    });

    it('should default requireJWT to false when not specified', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Act
      await getAuthState();

      // Assert
      expect(global.fetch).toHaveBeenCalled(); // Session check should happen
    });

    it('should work with no parameters', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await getAuthState();

      // Assert
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('reason field', () => {
    it('should include reason when JWT is required but missing', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      const state = await getAuthState({ requireJWT: true });

      // Assert
      expect(state.reason).toBe('JWT required for this route');
    });

    it('should include reason when no JWT or session found', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Act
      const state = await getAuthState({ requireJWT: false });

      // Assert
      expect(state.reason).toBe('No JWT or session found');
    });

    it('should include reason when session check errors', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const state = await getAuthState({ requireJWT: false });

      // Assert
      // When session check fails, we still return "No JWT or session found"
      // The error is logged but not exposed in the reason field
      expect(state.reason).toBe('No JWT or session found');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should not include reason when authenticated', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

      // Act
      const state = await getAuthState({ requireJWT: true });

      // Assert
      expect(state.reason).toBeUndefined();
    });
  });

  describe('logging enhancements', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log route requirement when requireJWT is true', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-123' });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AuthCoordinator] Getting unified auth state',
        expect.objectContaining({
          requireJWT: true,
          traceId: 'test-123',
          routeRequirement: 'JWT-only',
        })
      );
    });

    it('should log route requirement when requireJWT is false', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      // Act
      await getAuthState({ requireJWT: false, traceId: 'test-456' });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AuthCoordinator] Getting unified auth state',
        expect.objectContaining({
          requireJWT: false,
          traceId: 'test-456',
          routeRequirement: 'JWT or session',
        })
      );
    });

    it('should log JWT check result with requireJWT flag', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      await getAuthState({ requireJWT: true });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AuthCoordinator] JWT check result',
        expect.objectContaining({
          hasJWT: false,
          requireJWT: true,
        })
      );
    });

    it('should log when skipping session check for JWT-required route', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

      // Act
      await getAuthState({ requireJWT: true, traceId: 'test-789' });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[AuthCoordinator] JWT required but not found, skipping session check',
        expect.objectContaining({
          state: expect.objectContaining({
            reason: 'JWT required for this route',
          }),
          traceId: 'test-789',
          requireJWT: true,
        })
      );
    });
  });
});
