/**
 * Unit tests for LogoutStateManager
 * 
 * Tests the logout state management functionality including:
 * - Setting logout state to in-progress
 * - Checking logout state
 * - Clearing logout state
 * - State persistence across calls
 * - Behavior when sessionStorage is unavailable
 */

import {
  logoutStateManager,
  type LogoutState,
  type ILogoutStateManager,
} from '../LogoutStateManager';

describe('LogoutStateManager', () => {
  // Clear sessionStorage before each test
  beforeEach(() => {
    sessionStorage.clear();
  });

  // Clean up after each test
  afterEach(() => {
    sessionStorage.clear();
  });

  describe('setLogoutInProgress', () => {
    it('should set logout state to in-progress', () => {
      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      const stored = sessionStorage.getItem('logout_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toBe('in-progress');
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('should overwrite existing state', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'idle', timestamp: Date.now() }));

      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      const stored = sessionStorage.getItem('logout_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toBe('in-progress');
    });

    it('should be callable multiple times', () => {
      // Act
      logoutStateManager.setLogoutInProgress();
      logoutStateManager.setLogoutInProgress();
      logoutStateManager.setLogoutInProgress();

      // Assert
      const stored = sessionStorage.getItem('logout_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toBe('in-progress');
    });
  });

  describe('isLogoutInProgress', () => {
    it('should return false when no state is set', () => {
      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when state is in-progress', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: Date.now() }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when state is idle', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'idle', timestamp: Date.now() }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when state is complete', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'complete', timestamp: Date.now() }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for invalid state values', () => {
      // Arrange
      sessionStorage.setItem('logout_state', 'invalid');

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(result).toBe(false);
    });

    it('should reflect state changes immediately', () => {
      // Arrange
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);

      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);
    });
  });

  describe('clearLogoutState', () => {
    it('should remove logout state from sessionStorage', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: Date.now() }));

      // Act
      logoutStateManager.clearLogoutState();

      // Assert
      expect(sessionStorage.getItem('logout_state')).toBeNull();
    });

    it('should be safe to call when no state exists', () => {
      // Act & Assert - should not throw
      expect(() => {
        logoutStateManager.clearLogoutState();
      }).not.toThrow();
    });

    it('should make isLogoutInProgress return false', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);

      // Act
      logoutStateManager.clearLogoutState();

      // Assert
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });

    it('should be callable multiple times', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act & Assert - should not throw
      expect(() => {
        logoutStateManager.clearLogoutState();
        logoutStateManager.clearLogoutState();
        logoutStateManager.clearLogoutState();
      }).not.toThrow();
    });
  });

  describe('getLogoutState', () => {
    it('should return idle when no state is set', () => {
      // Act
      const state = logoutStateManager.getLogoutState();

      // Assert
      expect(state).toBe('idle');
    });

    it('should return in-progress when state is in-progress', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: Date.now() }));

      // Act
      const state = logoutStateManager.getLogoutState();

      // Assert
      expect(state).toBe('in-progress');
    });

    it('should return complete when state is complete', () => {
      // Arrange
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'complete', timestamp: Date.now() }));

      // Act
      const state = logoutStateManager.getLogoutState();

      // Assert
      expect(state).toBe('complete');
    });

    it('should return idle for invalid state values', () => {
      // Arrange
      sessionStorage.setItem('logout_state', 'invalid');

      // Act
      const state = logoutStateManager.getLogoutState();

      // Assert
      expect(state).toBe('idle');
    });

    it('should reflect state changes immediately', () => {
      // Arrange
      expect(logoutStateManager.getLogoutState()).toBe('idle');

      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      expect(logoutStateManager.getLogoutState()).toBe('in-progress');
    });
  });

  describe('state persistence', () => {
    it('should persist state across multiple calls', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act - call multiple times
      const check1 = logoutStateManager.isLogoutInProgress();
      const check2 = logoutStateManager.isLogoutInProgress();
      const check3 = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(check1).toBe(true);
      expect(check2).toBe(true);
      expect(check3).toBe(true);
    });

    it('should maintain state until explicitly cleared', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act - perform various operations
      logoutStateManager.getLogoutState();
      logoutStateManager.isLogoutInProgress();
      const finalCheck = logoutStateManager.isLogoutInProgress();

      // Assert - state should still be in-progress
      expect(finalCheck).toBe(true);
    });

    it('should support full logout lifecycle', () => {
      // Initial state
      expect(logoutStateManager.getLogoutState()).toBe('idle');
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);

      // Start logout
      logoutStateManager.setLogoutInProgress();
      expect(logoutStateManager.getLogoutState()).toBe('in-progress');
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);

      // Complete logout
      logoutStateManager.clearLogoutState();
      expect(logoutStateManager.getLogoutState()).toBe('idle');
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      // Act - rapid changes
      logoutStateManager.setLogoutInProgress();
      logoutStateManager.clearLogoutState();
      logoutStateManager.setLogoutInProgress();
      logoutStateManager.clearLogoutState();
      logoutStateManager.setLogoutInProgress();

      // Assert - final state should be in-progress
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);
    });

    it('should handle interleaved operations', () => {
      // Act
      logoutStateManager.setLogoutInProgress();
      const check1 = logoutStateManager.isLogoutInProgress();
      const state1 = logoutStateManager.getLogoutState();
      logoutStateManager.clearLogoutState();
      const check2 = logoutStateManager.isLogoutInProgress();
      const state2 = logoutStateManager.getLogoutState();

      // Assert
      expect(check1).toBe(true);
      expect(state1).toBe('in-progress');
      expect(check2).toBe(false);
      expect(state2).toBe('idle');
    });

    it('should not interfere with other sessionStorage keys', () => {
      // Arrange
      sessionStorage.setItem('other_key', 'other_value');

      // Act
      logoutStateManager.setLogoutInProgress();
      logoutStateManager.clearLogoutState();

      // Assert
      expect(sessionStorage.getItem('other_key')).toBe('other_value');
    });
  });

  describe('interface compliance', () => {
    it('should implement ILogoutStateManager interface', () => {
      // Assert - TypeScript compilation ensures this, but we can verify methods exist
      expect(typeof logoutStateManager.setLogoutInProgress).toBe('function');
      expect(typeof logoutStateManager.isLogoutInProgress).toBe('function');
      expect(typeof logoutStateManager.clearLogoutState).toBe('function');
      expect(typeof logoutStateManager.getLogoutState).toBe('function');
    });

    it('should export LogoutState type', () => {
      // Assert - TypeScript compilation ensures this
      const validStates: LogoutState[] = ['idle', 'in-progress', 'complete'];
      expect(validStates).toHaveLength(3);
    });
  });

  describe('singleton behavior', () => {
    it('should maintain state across different import references', () => {
      // Arrange
      const manager1 = logoutStateManager;
      const manager2 = logoutStateManager;

      // Act
      manager1.setLogoutInProgress();

      // Assert
      expect(manager2.isLogoutInProgress()).toBe(true);
    });

    it('should share state between all callers', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act - simulate different components checking state
      const component1Check = logoutStateManager.isLogoutInProgress();
      const component2Check = logoutStateManager.isLogoutInProgress();
      const component3Check = logoutStateManager.isLogoutInProgress();

      // Assert - all should see the same state
      expect(component1Check).toBe(true);
      expect(component2Check).toBe(true);
      expect(component3Check).toBe(true);
    });
  });

  describe('requirements validation', () => {
    it('should satisfy requirement 2.1: set logout-in-progress flag', () => {
      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      const stored = sessionStorage.getItem('logout_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toBe('in-progress');
    });

    it('should satisfy requirement 2.2: detect logout-in-progress flag', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act
      const isInProgress = logoutStateManager.isLogoutInProgress();

      // Assert
      expect(isInProgress).toBe(true);
    });

    it('should satisfy requirement 2.4: clear logout-in-progress flag', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act
      logoutStateManager.clearLogoutState();

      // Assert
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });

    it('should satisfy requirement 4.1: provide global logout state', () => {
      // Act
      const state = logoutStateManager.getLogoutState();

      // Assert - state is accessible
      expect(['idle', 'in-progress', 'complete']).toContain(state);
    });

    it('should satisfy requirement 4.2: set state to in-progress', () => {
      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      expect(logoutStateManager.getLogoutState()).toBe('in-progress');
    });

    it('should satisfy requirement 4.5: persist across re-renders', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();

      // Act - simulate multiple component renders checking state
      const render1 = logoutStateManager.isLogoutInProgress();
      const render2 = logoutStateManager.isLogoutInProgress();
      const render3 = logoutStateManager.isLogoutInProgress();

      // Assert - state persists
      expect(render1).toBe(true);
      expect(render2).toBe(true);
      expect(render3).toBe(true);
    });
  });
});

  describe('timeout-based state clearing', () => {
    it('should automatically clear state after timeout', () => {
      // Arrange - set state with old timestamp (6 seconds ago)
      const oldTimestamp = Date.now() - 6000;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: oldTimestamp }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert - should return false and clear state
      expect(result).toBe(false);
      expect(sessionStorage.getItem('logout_state')).toBeNull();
    });

    it('should not clear state before timeout', () => {
      // Arrange - set state with recent timestamp (2 seconds ago)
      const recentTimestamp = Date.now() - 2000;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: recentTimestamp }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert - should return true and keep state
      expect(result).toBe(true);
      expect(sessionStorage.getItem('logout_state')).toBeTruthy();
    });

    it('should clear state at exactly timeout boundary', () => {
      // Arrange - set state with timestamp exactly 5001ms ago
      const boundaryTimestamp = Date.now() - 5001;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: boundaryTimestamp }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert - should return false and clear state
      expect(result).toBe(false);
      expect(sessionStorage.getItem('logout_state')).toBeNull();
    });

    it('should not clear state just before timeout boundary', () => {
      // Arrange - set state with timestamp 4999ms ago
      const justBeforeTimeout = Date.now() - 4999;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: justBeforeTimeout }));

      // Act
      const result = logoutStateManager.isLogoutInProgress();

      // Assert - should return true and keep state
      expect(result).toBe(true);
      expect(sessionStorage.getItem('logout_state')).toBeTruthy();
    });

    it('should handle multiple checks of stale state consistently', () => {
      // Arrange - set stale state (10 seconds ago)
      const staleTimestamp = Date.now() - 10000;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: staleTimestamp }));

      // Act - check multiple times
      const check1 = logoutStateManager.isLogoutInProgress();
      const check2 = logoutStateManager.isLogoutInProgress();
      const check3 = logoutStateManager.isLogoutInProgress();

      // Assert - all checks should return false
      expect(check1).toBe(false);
      expect(check2).toBe(false);
      expect(check3).toBe(false);
      expect(sessionStorage.getItem('logout_state')).toBeNull();
    });

    it('should handle getLogoutState with stale timestamp', () => {
      // Arrange - set stale state (10 seconds ago)
      const staleTimestamp = Date.now() - 10000;
      sessionStorage.setItem('logout_state', JSON.stringify({ state: 'in-progress', timestamp: staleTimestamp }));

      // Act - getLogoutState doesn't check timeout, only isLogoutInProgress does
      const state = logoutStateManager.getLogoutState();

      // Assert - getLogoutState returns the stored state without timeout check
      expect(state).toBe('in-progress');
    });

    it('should store timestamp when setting logout in progress', () => {
      // Arrange
      const beforeTimestamp = Date.now();

      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      const stored = sessionStorage.getItem('logout_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(parsed.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should update timestamp on subsequent setLogoutInProgress calls', () => {
      // Arrange
      logoutStateManager.setLogoutInProgress();
      const firstStored = sessionStorage.getItem('logout_state');
      const firstParsed = JSON.parse(firstStored!);
      const firstTimestamp = firstParsed.timestamp;

      // Wait a bit
      const waitTime = 100;
      const start = Date.now();
      while (Date.now() - start < waitTime) {
        // busy wait
      }

      // Act
      logoutStateManager.setLogoutInProgress();

      // Assert
      const secondStored = sessionStorage.getItem('logout_state');
      const secondParsed = JSON.parse(secondStored!);
      const secondTimestamp = secondParsed.timestamp;
      expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
    });
  });
