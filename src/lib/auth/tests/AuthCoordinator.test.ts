/**
 * Unit tests for AuthCoordinator
 * 
 * Tests the core authentication coordination functionality including:
 * - Getting authentication state with JWT-only authentication
 * - Backward compatibility with old API signatures
 * - Fallback mode functions (now no-ops)
 * 
 * Note: Session-based authentication and JWT refresh have been removed.
 * The AuthCoordinator now only checks for JWT tokens in localStorage.
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3
 */

import {
  getAuthState,
  AuthCoordinator,
  authCoordinator,
  activateFallbackMode,
  deactivateFallbackMode,
  isInFallbackMode,
} from '../AuthCoordinator';
import * as tokenManager from '../api/tokenManager';

// Mock dependencies
jest.mock('../api/tokenManager');
jest.mock('./AuthLogger', () => ({
  logAuthEvent: jest.fn(),
}));

describe('AuthCoordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getAuthState - JWT-only authentication', () => {
    describe('when JWT exists', () => {
      it('should return authenticated state', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(state.authMethod).toBe('jwt');
        expect(state.reason).toBeUndefined();
      });

      it('should set hasSession to false (deprecated field)', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasSession).toBe(false);
      });

      it('should set inFallbackMode to false', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.inFallbackMode).toBe(false);
      });
    });

    describe('when JWT does not exist', () => {
      it('should return unauthenticated state', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasJWT).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.authMethod).toBe('none');
        expect(state.reason).toBe('No JWT token found');
      });

      it('should set hasSession to false', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.hasSession).toBe(false);
      });

      it('should set inFallbackMode to false', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState();

        // Assert
        expect(state.inFallbackMode).toBe(false);
      });
    });

    describe('no API calls', () => {
      let originalFetch: typeof global.fetch;
      let fetchMock: jest.Mock;

      beforeEach(() => {
        originalFetch = global.fetch;
        fetchMock = jest.fn();
        global.fetch = fetchMock;
      });

      afterEach(() => {
        global.fetch = originalFetch;
      });

      it('should not make any HTTP requests when JWT exists', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);

        // Act
        await getAuthState();

        // Assert
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('should not make any HTTP requests when JWT does not exist', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        await getAuthState();

        // Assert
        expect(fetchMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('backward compatibility', () => {
    describe('traceId as string (old signature)', () => {
      it('should work with traceId as string', async () => {
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

    describe('options object (new signature)', () => {
      it('should work with options object', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(true);
        const traceId = 'test-trace-456';

        // Act
        const state = await getAuthState({ traceId });

        // Assert
        expect(state.hasJWT).toBe(true);
        expect(state.isAuthenticated).toBe(true);
        expect(tokenManager.hasToken).toHaveBeenCalledWith('AuthCoordinator', traceId);
      });

      it('should ignore requireJWT option (deprecated)', async () => {
        // Arrange
        jest.spyOn(tokenManager, 'hasToken').mockReturnValue(false);

        // Act
        const state = await getAuthState({ requireJWT: true });

        // Assert - should still return unauthenticated (JWT-only mode)
        expect(state.hasJWT).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.authMethod).toBe('none');
      });
    });
  });

  describe('error handling', () => {
    it('should return unauthenticated state when hasToken throws', async () => {
      // Arrange
      jest.spyOn(tokenManager, 'hasToken').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Act
      const state = await getAuthState();

      // Assert
      expect(state.hasJWT).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.authMethod).toBe('none');
      expect(state.reason).toContain('Error checking JWT');
      expect(state.reason).toContain('localStorage unavailable');
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
      const state = await coordinator.getAuthState({ traceId: 'test-123' });

      // Assert
      expect(state.hasJWT).toBe(false);
      expect(state.isAuthenticated).toBe(false);
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

  describe('fallback mode functions (deprecated - now no-ops)', () => {
    it('activateFallbackMode should be a no-op', () => {
      // Act
      activateFallbackMode('test reason');

      // Assert - should not throw and isInFallbackMode should still return false
      expect(isInFallbackMode()).toBe(false);
    });

    it('deactivateFallbackMode should be a no-op', () => {
      // Act
      deactivateFallbackMode();

      // Assert - should not throw
      expect(isInFallbackMode()).toBe(false);
    });

    it('isInFallbackMode should always return false', () => {
      // Act & Assert
      expect(isInFallbackMode()).toBe(false);
      
      // Even after calling activateFallbackMode
      activateFallbackMode('test');
      expect(isInFallbackMode()).toBe(false);
    });
  });
});
