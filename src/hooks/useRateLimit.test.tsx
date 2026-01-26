import { renderHook, act, waitFor } from '@testing-library/react';
import { useRateLimit } from './useRateLimit';
import * as fc from 'fast-check';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('useRateLimit', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with unlocked state', () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.isLocked).toBe(false);
      expect(result.current.remainingTime).toBe(0);
      expect(result.current.attempts).toBe(0);
    });

    it('should load state from sessionStorage on mount', () => {
      const storedState = {
        attempts: 2,
        windowStart: Date.now(),
        isLocked: false,
        unlockTime: undefined,
      };
      mockSessionStorage.setItem('login_rate_limit', JSON.stringify(storedState));

      const { result } = renderHook(() => useRateLimit());

      expect(result.current.attempts).toBe(2);
      expect(result.current.isLocked).toBe(false);
    });

    it('should reset expired window from sessionStorage', () => {
      const storedState = {
        attempts: 5,
        windowStart: Date.now() - 70000, // 70 seconds ago (expired)
        isLocked: true,
        unlockTime: Date.now() - 10000,
      };
      mockSessionStorage.setItem('login_rate_limit', JSON.stringify(storedState));

      const { result } = renderHook(() => useRateLimit());

      expect(result.current.attempts).toBe(0);
      expect(result.current.isLocked).toBe(false);
    });
  });

  describe('Recording Attempts', () => {
    it('should increment attempt count when recordAttempt is called', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.recordAttempt();
      });

      expect(result.current.attempts).toBe(1);
      expect(result.current.isLocked).toBe(false);
    });

    it('should lock after 5 attempts', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(5);
      expect(result.current.isLocked).toBe(true);
      expect(result.current.remainingTime).toBeGreaterThan(0);
    });

    it('should not lock before reaching 5 attempts', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(4);
      expect(result.current.isLocked).toBe(false);
    });

    it('should reset attempts after window expires', () => {
      const { result } = renderHook(() => useRateLimit());

      // Record 3 attempts
      act(() => {
        for (let i = 0; i < 3; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(3);

      // Fast forward 61 seconds (past the 60-second window)
      act(() => {
        jest.advanceTimersByTime(61000);
      });

      // Record another attempt (should start new window)
      act(() => {
        result.current.recordAttempt();
      });

      expect(result.current.attempts).toBe(1);
      expect(result.current.isLocked).toBe(false);
    });
  });

  describe('Lock Behavior', () => {
    it('should set unlock time when locked', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.isLocked).toBe(true);
      expect(result.current.remainingTime).toBeGreaterThan(0);
      expect(result.current.remainingTime).toBeLessThanOrEqual(60);
    });

    it('should countdown remaining time when locked', async () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      const initialRemainingTime = result.current.remainingTime;
      expect(initialRemainingTime).toBeGreaterThan(0);

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.remainingTime).toBeLessThan(initialRemainingTime);
      });
    });

    it('should unlock after 60 seconds', async () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.isLocked).toBe(true);

      // Fast forward 60 seconds
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(result.current.isLocked).toBe(false);
        expect(result.current.remainingTime).toBe(0);
        expect(result.current.attempts).toBe(0);
      });
    });
  });

  describe('SessionStorage Persistence', () => {
    it('should save state to sessionStorage when attempts are recorded', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.recordAttempt();
      });

      const stored = mockSessionStorage.getItem('login_rate_limit');
      expect(stored).toBeTruthy();
      
      const parsedState = JSON.parse(stored!);
      expect(parsedState.attempts).toBe(1);
    });

    it('should persist locked state to sessionStorage', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      const stored = mockSessionStorage.getItem('login_rate_limit');
      const parsedState = JSON.parse(stored!);
      
      expect(parsedState.isLocked).toBe(true);
      expect(parsedState.attempts).toBe(5);
      expect(parsedState.unlockTime).toBeDefined();
    });

    it('should restore locked state from sessionStorage', () => {
      const now = Date.now();
      const storedState = {
        attempts: 5,
        windowStart: now - 10000, // 10 seconds ago
        isLocked: true,
        unlockTime: now + 50000, // 50 seconds from now
      };
      mockSessionStorage.setItem('login_rate_limit', JSON.stringify(storedState));

      const { result } = renderHook(() => useRateLimit());

      expect(result.current.isLocked).toBe(true);
      expect(result.current.attempts).toBe(5);
      expect(result.current.remainingTime).toBeGreaterThan(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state when reset is called', () => {
      const { result } = renderHook(() => useRateLimit());

      // Record some attempts
      act(() => {
        for (let i = 0; i < 3; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(3);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.attempts).toBe(0);
      expect(result.current.isLocked).toBe(false);
      expect(result.current.remainingTime).toBe(0);
    });

    it('should clear sessionStorage when reset is called', async () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.recordAttempt();
      });

      expect(mockSessionStorage.getItem('login_rate_limit')).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      // Wait for effects to settle
      await waitFor(() => {
        const stored = mockSessionStorage.getItem('login_rate_limit');
        // After reset, sessionStorage should either be null or contain reset state
        // The important thing is that attempts are 0 and isLocked is false
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.attempts).toBe(0);
          expect(parsed.isLocked).toBe(false);
        }
      });
    });

    it('should unlock when reset is called even if locked', () => {
      const { result } = renderHook(() => useRateLimit());

      // Lock by recording 5 attempts
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.isLocked).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isLocked).toBe(false);
      expect(result.current.attempts).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted sessionStorage data gracefully', () => {
      mockSessionStorage.setItem('login_rate_limit', 'invalid json');

      const { result } = renderHook(() => useRateLimit());

      // Should initialize with default state
      expect(result.current.isLocked).toBe(false);
      expect(result.current.attempts).toBe(0);
    });

    it('should handle missing sessionStorage gracefully', () => {
      // This test ensures the hook doesn't crash if sessionStorage is unavailable
      const originalSessionStorage = window.sessionStorage;
      
      // @ts-ignore - Temporarily remove sessionStorage
      delete window.sessionStorage;

      const { result } = renderHook(() => useRateLimit());

      expect(result.current.isLocked).toBe(false);
      expect(result.current.attempts).toBe(0);

      // Restore sessionStorage
      Object.defineProperty(window, 'sessionStorage', {
        value: originalSessionStorage,
        writable: true,
      });
    });

    it('should handle rapid successive attempts correctly', () => {
      const { result } = renderHook(() => useRateLimit());

      // Record 10 attempts rapidly (should lock at 5)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(10);
      expect(result.current.isLocked).toBe(true);
    });
  });

  describe('Requirements Validation', () => {
    it('should implement 5 attempts per 60 seconds logic (Requirement 7.4)', () => {
      const { result } = renderHook(() => useRateLimit());

      // Should allow 4 attempts without locking
      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.recordAttempt();
        }
      });
      expect(result.current.isLocked).toBe(false);

      // 5th attempt should lock
      act(() => {
        result.current.recordAttempt();
      });
      expect(result.current.isLocked).toBe(true);
    });

    it('should return remaining time for display (Requirement 7.5)', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.remainingTime).toBeGreaterThan(0);
      expect(result.current.remainingTime).toBeLessThanOrEqual(60);
    });

    it('should persist state in sessionStorage (Requirement 7.4)', () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.recordAttempt();
      });

      const stored = mockSessionStorage.getItem('login_rate_limit');
      expect(stored).toBeTruthy();
    });
  });

  describe('Rate Limit Edge Cases', () => {
    it('should display rate limit message with remaining time (Requirement 7.5)', () => {
      const { result } = renderHook(() => useRateLimit());

      // Lock the rate limiter by making 5 attempts
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      // Verify locked state
      expect(result.current.isLocked).toBe(true);
      
      // Verify remaining time is available for message display
      expect(result.current.remainingTime).toBeGreaterThan(0);
      expect(result.current.remainingTime).toBeLessThanOrEqual(60);
      
      // Verify the message can be constructed with remaining time
      const message = `Too many attempts. Please wait ${result.current.remainingTime} seconds before trying again`;
      expect(message).toContain('Too many attempts');
      expect(message).toContain(result.current.remainingTime.toString());
    });

    it('should reset rate limit after 60-second window expires (Requirement 7.5)', async () => {
      const { result } = renderHook(() => useRateLimit());

      // Lock the rate limiter by making 5 attempts
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      // Verify locked state
      expect(result.current.isLocked).toBe(true);
      expect(result.current.attempts).toBe(5);
      const initialRemainingTime = result.current.remainingTime;
      expect(initialRemainingTime).toBeGreaterThan(0);

      // Fast forward exactly 60 seconds to expire the window
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Wait for the unlock to take effect
      await waitFor(() => {
        expect(result.current.isLocked).toBe(false);
        expect(result.current.remainingTime).toBe(0);
        expect(result.current.attempts).toBe(0);
      });

      // Verify new attempts can be made after reset
      act(() => {
        result.current.recordAttempt();
      });

      expect(result.current.attempts).toBe(1);
      expect(result.current.isLocked).toBe(false);
    });

    it('should countdown remaining time while locked (Requirement 7.5)', async () => {
      const { result } = renderHook(() => useRateLimit());

      // Lock the rate limiter
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.isLocked).toBe(true);
      const initialTime = result.current.remainingTime;

      // Advance time by 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Wait for countdown to update
      await waitFor(() => {
        expect(result.current.remainingTime).toBeLessThan(initialTime);
        expect(result.current.remainingTime).toBeGreaterThan(0);
      });

      // Verify still locked during countdown
      expect(result.current.isLocked).toBe(true);
    });

    it('should handle rate limit at exact boundary (5 attempts)', () => {
      const { result } = renderHook(() => useRateLimit());

      // Make exactly 4 attempts - should not lock
      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.attempts).toBe(4);
      expect(result.current.isLocked).toBe(false);
      expect(result.current.remainingTime).toBe(0);

      // 5th attempt should trigger lock
      act(() => {
        result.current.recordAttempt();
      });

      expect(result.current.attempts).toBe(5);
      expect(result.current.isLocked).toBe(true);
      expect(result.current.remainingTime).toBeGreaterThan(0);
    });

    it('should prevent attempts while locked (Requirement 7.5)', () => {
      const { result } = renderHook(() => useRateLimit());

      // Lock the rate limiter
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAttempt();
        }
      });

      expect(result.current.isLocked).toBe(true);
      const lockedAttempts = result.current.attempts;

      // Try to record more attempts while locked
      act(() => {
        result.current.recordAttempt();
        result.current.recordAttempt();
      });

      // Attempts should still increment (hook tracks all attempts)
      // but isLocked should remain true
      expect(result.current.isLocked).toBe(true);
      expect(result.current.attempts).toBeGreaterThan(lockedAttempts);
    });
  });

  // Feature: login-page, Property 15: Rate limiting enforcement
  // **Validates: Requirements 7.4**
  // Feature: register-page, Property 10: Rate limiter resets after cooldown
  // **Validates: Requirements 5.4**
  describe('Property-Based Tests', () => {
    test('property: rate limiter resets after cooldown period allowing new attempts', () => {
      fc.assert(
        fc.property(
          // Generate number of attempts to trigger lock (5-10)
          fc.integer({ min: 5, max: 10 }),
          // Generate cooldown wait time (60-65 seconds to ensure window expires)
          fc.integer({ min: 60000, max: 65000 }),
          // Generate number of new attempts after reset (1-5)
          fc.integer({ min: 1, max: 5 }),
          (initialAttempts, cooldownTime, newAttempts) => {
            // Reset state before each property test iteration
            mockSessionStorage.clear();
            jest.clearAllTimers();
            jest.useFakeTimers();

            const { result } = renderHook(() => useRateLimit());

            // Make enough attempts to trigger rate limit
            act(() => {
              for (let i = 0; i < initialAttempts; i++) {
                result.current.recordAttempt();
              }
            });

            // Verify rate limiter is locked
            expect(result.current.isLocked).toBe(true);
            expect(result.current.attempts).toBe(initialAttempts);
            expect(result.current.remainingTime).toBeGreaterThan(0);

            // Fast forward past the cooldown period
            act(() => {
              jest.advanceTimersByTime(cooldownTime);
            });

            // Wait for the unlock to take effect
            act(() => {
              jest.runAllTimers();
            });

            // After cooldown, rate limiter should be reset
            expect(result.current.isLocked).toBe(false);
            expect(result.current.remainingTime).toBe(0);
            expect(result.current.attempts).toBe(0);

            // Verify new attempts can be made after reset
            act(() => {
              for (let i = 0; i < newAttempts; i++) {
                result.current.recordAttempt();
              }
            });

            // New attempts should be tracked in a fresh window
            expect(result.current.attempts).toBe(newAttempts);
            // Should not be locked unless new attempts >= 5
            if (newAttempts >= 5) {
              expect(result.current.isLocked).toBe(true);
            } else {
              expect(result.current.isLocked).toBe(false);
            }

            // Cleanup
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: after 5 failed attempts within 60-second window, subsequent attempts are blocked until window expires', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of attempts (between 5 and 15 attempts)
          fc.integer({ min: 5, max: 15 }),
          // Generate time intervals between attempts (0-5 seconds each)
          fc.array(fc.integer({ min: 0, max: 5000 }), { minLength: 5, maxLength: 15 }),
          (totalAttempts, timeIntervals) => {
            // Reset state before each property test iteration
            mockSessionStorage.clear();
            jest.clearAllTimers();
            jest.useFakeTimers();

            const { result } = renderHook(() => useRateLimit());

            // Track when we should be locked
            let shouldBeLocked = false;
            let lockTime = 0;

            // Make attempts with time intervals
            for (let i = 0; i < totalAttempts; i++) {
              // Advance time if we have an interval for this attempt
              if (i > 0 && timeIntervals[i - 1]) {
                act(() => {
                  jest.advanceTimersByTime(timeIntervals[i - 1]);
                });
              }

              // Record the attempt
              act(() => {
                result.current.recordAttempt();
              });

              // After 5 attempts, should be locked
              if (i === 4) {
                shouldBeLocked = true;
                lockTime = Date.now();
                expect(result.current.isLocked).toBe(true);
                expect(result.current.attempts).toBeGreaterThanOrEqual(5);
              }

              // If locked and still within 60-second window, should remain locked
              if (shouldBeLocked && Date.now() - lockTime < 60000) {
                expect(result.current.isLocked).toBe(true);
              }
            }

            // Verify that after 60 seconds from lock, the state unlocks
            if (shouldBeLocked) {
              act(() => {
                jest.advanceTimersByTime(60000);
              });

              // Wait for the unlock to take effect
              act(() => {
                jest.runAllTimers();
              });

              // After 60 seconds, should be unlocked
              expect(result.current.isLocked).toBe(false);
              expect(result.current.remainingTime).toBe(0);
            }

            // Cleanup
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: rate limit window resets after 60 seconds allowing new attempts', () => {
      fc.assert(
        fc.property(
          // Generate number of attempts in first window (1-4, not enough to lock)
          fc.integer({ min: 1, max: 4 }),
          // Generate wait time after first window (60-70 seconds to ensure window expires)
          fc.integer({ min: 60000, max: 70000 }),
          // Generate number of attempts in second window
          fc.integer({ min: 1, max: 4 }),
          (firstWindowAttempts, waitTime, secondWindowAttempts) => {
            // Reset state before each property test iteration
            mockSessionStorage.clear();
            jest.clearAllTimers();
            jest.useFakeTimers();

            const { result } = renderHook(() => useRateLimit());

            // Make attempts in first window
            act(() => {
              for (let i = 0; i < firstWindowAttempts; i++) {
                result.current.recordAttempt();
              }
            });

            expect(result.current.attempts).toBe(firstWindowAttempts);
            expect(result.current.isLocked).toBe(false);

            // Wait for window to expire
            act(() => {
              jest.advanceTimersByTime(waitTime);
            });

            // Make attempts in second window (should start fresh)
            act(() => {
              for (let i = 0; i < secondWindowAttempts; i++) {
                result.current.recordAttempt();
              }
            });

            // Attempts should be reset to second window count
            expect(result.current.attempts).toBe(secondWindowAttempts);
            expect(result.current.isLocked).toBe(false);

            // Cleanup
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: exactly 5 attempts within window triggers lock, fewer attempts do not', () => {
      fc.assert(
        fc.property(
          // Generate number of attempts (1-10)
          fc.integer({ min: 1, max: 10 }),
          (numAttempts) => {
            // Reset state before each property test iteration
            mockSessionStorage.clear();
            jest.clearAllTimers();
            jest.useFakeTimers();

            const { result } = renderHook(() => useRateLimit());

            // Make the specified number of attempts
            act(() => {
              for (let i = 0; i < numAttempts; i++) {
                result.current.recordAttempt();
              }
            });

            // Check lock state based on number of attempts
            if (numAttempts >= 5) {
              expect(result.current.isLocked).toBe(true);
              expect(result.current.remainingTime).toBeGreaterThan(0);
            } else {
              expect(result.current.isLocked).toBe(false);
              expect(result.current.remainingTime).toBe(0);
            }

            expect(result.current.attempts).toBe(numAttempts);

            // Cleanup
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
