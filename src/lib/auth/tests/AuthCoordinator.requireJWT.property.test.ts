/**
 * Property-Based Tests for AuthCoordinator requireJWT functionality
 * 
 * Tests the JWT requirement enforcement using property-based testing
 * to verify correctness across many generated authentication states.
 * 
 * Feature: fix-dashboard-auth-redirect
 * Property 1: Dashboard access requires valid JWT
 * Validates: Requirements 1.1, 1.4, 4.1
 */

import { test, expect, describe, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { getAuthState, type AuthOptions, type ExtendedAuthState } from '../AuthCoordinator';
import * as tokenManager from '../api/tokenManager';

// Mock only AuthLogger (not tokenManager - we'll spy on it instead)
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

/**
 * Arbitrary for authentication states
 * Generates random combinations of JWT and session states
 */
const authStateArbitrary = fc.record({
  hasJWT: fc.boolean(),
  hasSession: fc.boolean(),
  sessionValid: fc.boolean(),
  refreshSucceeds: fc.boolean(),
});

/**
 * Arbitrary for trace IDs
 */
const traceIdArbitrary = fc.option(
  fc.string({ minLength: 5, maxLength: 20 }),
  { nil: undefined }
);

describe('AuthCoordinator - Property-Based Tests for requireJWT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  });

  /**
   * Property 1: Dashboard access requires valid JWT
   * 
   * **Validates: Requirements 1.1, 1.4, 4.1**
   * 
   * For any authentication state, when requireJWT is true:
   * - If no JWT exists, isAuthenticated must be false
   * - If JWT exists, isAuthenticated must be true
   * - Session state should not affect the result when requireJWT is true
   */
  describe('Property 1: Dashboard access requires valid JWT', () => {
    test('No JWT → isAuthenticated: false, Valid JWT → isAuthenticated: true', () => {
      // Create spy once for this test
      const hasTokenSpy = jest.spyOn(tokenManager, 'hasToken');
      
      try {
        fc.assert(
          fc.property(
            authStateArbitrary,
            traceIdArbitrary,
            async (authState, traceId) => {
              // Set spy return value for this iteration
              hasTokenSpy.mockReturnValue(authState.hasJWT);

            // Mock session check
            if (authState.hasSession && authState.sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                })
                .mockResolvedValueOnce({
                  ok: authState.refreshSucceeds,
                  status: authState.refreshSucceeds ? 200 : 403,
                  json: async () => ({ token: 'mock-jwt-token' }),
                });
            } else {
              (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
              });
            }

            // Call getAuthState with requireJWT: true
            const options: AuthOptions = { requireJWT: true, traceId };
            const state = await getAuthState(options);

            // Property assertions
            if (!authState.hasJWT) {
              // No JWT → must be unauthenticated
              expect(state.isAuthenticated).toBe(false);
              expect(state.hasJWT).toBe(false);
              expect(state.authMethod).toBe('none');
              expect(state.reason).toBe('JWT required for this route');
              
              // Session check should be skipped when requireJWT is true and no JWT
              expect(global.fetch).not.toHaveBeenCalled();
            } else {
              // Valid JWT → must be authenticated
              expect(state.isAuthenticated).toBe(true);
              expect(state.hasJWT).toBe(true);
              expect(state.authMethod).toBe('jwt');
              expect(state.reason).toBeUndefined();
            }

            // Session state should not affect authentication when requireJWT is true
            // and JWT is present or absent
            if (authState.hasJWT) {
              // JWT present → authenticated regardless of session
              expect(state.isAuthenticated).toBe(true);
            } else {
              // JWT absent → not authenticated regardless of session
              expect(state.isAuthenticated).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
      } finally {
        // Restore spy
        hasTokenSpy.mockRestore();
      }
    });

    test('Session-only authentication never grants access when requireJWT is true', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // sessionValid
          fc.boolean(), // refreshSucceeds
          traceIdArbitrary,
          async (sessionValid, refreshSucceeds, traceId) => {
            // Setup: No JWT, but valid session
            hasTokenSpy.mockReturnValue(false);

            // Mock session check
            if (sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                })
                .mockResolvedValueOnce({
                  ok: refreshSucceeds,
                  status: refreshSucceeds ? 200 : 403,
                  json: async () => ({ token: 'mock-jwt-token' }),
                });
            } else {
              (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
              });
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Session-only never grants access
            expect(state.isAuthenticated).toBe(false);
            expect(state.hasJWT).toBe(false);
            expect(state.authMethod).toBe('none');
            
            // Session check should be skipped
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('JWT presence is the sole determinant of authentication when requireJWT is true', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // hasJWT
          fc.record({
            hasSession: fc.boolean(),
            sessionValid: fc.boolean(),
            refreshSucceeds: fc.boolean(),
            inFallbackMode: fc.boolean(),
          }),
          traceIdArbitrary,
          async (hasJWT, sessionState, traceId) => {
            // Setup mocks
            hasTokenSpy.mockReturnValue(hasJWT);

            // Mock session (should be ignored when requireJWT is true and no JWT)
            if (sessionState.hasSession && sessionState.sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                })
                .mockResolvedValueOnce({
                  ok: sessionState.refreshSucceeds,
                  status: sessionState.refreshSucceeds ? 200 : 403,
                  json: async () => ({ token: 'mock-jwt-token' }),
                });
            } else {
              (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
              });
            }

            // Set fallback mode if specified
            if (sessionState.inFallbackMode && typeof window !== 'undefined') {
              sessionStorage.setItem('auth_fallback_mode', JSON.stringify({
                active: true,
                reason: 'Test fallback mode',
                timestamp: Date.now(),
              }));
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: JWT presence is the ONLY factor that matters
            expect(state.isAuthenticated).toBe(hasJWT);
            expect(state.hasJWT).toBe(hasJWT);
            
            if (hasJWT) {
              expect(state.authMethod).toBe('jwt');
              expect(state.reason).toBeUndefined();
            } else {
              expect(state.authMethod).toBe('none');
              expect(state.reason).toBe('JWT required for this route');
            }

            // Session state, fallback mode, and other factors should not affect result
            // when requireJWT is true
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Reason field is always set when authentication fails with requireJWT', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasSession: fc.boolean(),
            sessionValid: fc.boolean(),
          }),
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT (authentication will fail)
            hasTokenSpy.mockReturnValue(false);

            // Mock session
            (global.fetch as jest.Mock).mockResolvedValue({
              ok: sessionState.sessionValid,
              status: sessionState.sessionValid ? 200 : 401,
            });

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Reason must be set when authentication fails
            expect(state.isAuthenticated).toBe(false);
            expect(state.reason).toBeDefined();
            expect(state.reason).toBe('JWT required for this route');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('hasJWT and isAuthenticated are always consistent when requireJWT is true', () => {
      fc.assert(
        fc.property(
          authStateArbitrary,
          traceIdArbitrary,
          async (authState, traceId) => {
            // Setup mocks
            hasTokenSpy.mockReturnValue(authState.hasJWT);

            // Mock session
            if (authState.hasSession && authState.sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                })
                .mockResolvedValueOnce({
                  ok: authState.refreshSucceeds,
                  status: authState.refreshSucceeds ? 200 : 403,
                  json: async () => ({ token: 'mock-jwt-token' }),
                });
            } else {
              (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
              });
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: hasJWT and isAuthenticated must always match
            expect(state.hasJWT).toBe(state.isAuthenticated);
            
            // Additional consistency checks
            if (state.isAuthenticated) {
              expect(state.authMethod).toBe('jwt');
              expect(state.reason).toBeUndefined();
            } else {
              expect(state.authMethod).toBe('none');
              expect(state.reason).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: requireJWT flag behavior is consistent
   */
  describe('Property: requireJWT flag behavior consistency', () => {
    test('requireJWT: true always skips session check when no JWT', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasSession: fc.boolean(),
            sessionValid: fc.boolean(),
            refreshSucceeds: fc.boolean(),
          }),
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Call getAuthState with requireJWT: true
            await getAuthState({ requireJWT: true, traceId });

            // Property: Session check should never be called
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('requireJWT: false allows session fallback', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // sessionValid
          traceIdArbitrary,
          async (sessionValid, traceId) => {
            // Setup: No JWT, but session exists
            hasTokenSpy.mockReturnValue(false);

            // Mock session check
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({
                ok: sessionValid,
                status: sessionValid ? 200 : 401,
              })
              .mockResolvedValueOnce({
                ok: false,
                status: 403,
              });

            // Call getAuthState with requireJWT: false
            const state = await getAuthState({ requireJWT: false, traceId });

            // Property: Session check should be attempted
            expect(global.fetch).toHaveBeenCalled();

            // If session is valid, should use session-based auth
            if (sessionValid) {
              expect(state.hasSession).toBe(true);
              // May be authenticated via session fallback
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge cases and boundary conditions
   */
  describe('Edge cases', () => {
    test('Empty or undefined traceId does not affect authentication logic', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // hasJWT
          fc.option(fc.constant(undefined), { nil: '' }),
          async (hasJWT, traceId) => {
            // Setup
            hasTokenSpy.mockReturnValue(hasJWT);

            // Call with various traceId values
            const state = await getAuthState({ 
              requireJWT: true, 
              traceId: traceId as string | undefined 
            });

            // Property: Authentication result should be consistent
            expect(state.isAuthenticated).toBe(hasJWT);
            expect(state.hasJWT).toBe(hasJWT);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Multiple calls with same state produce consistent results', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // hasJWT
          traceIdArbitrary,
          async (hasJWT, traceId) => {
            // Setup
            hasTokenSpy.mockReturnValue(hasJWT);

            // Call multiple times
            const state1 = await getAuthState({ requireJWT: true, traceId });
            const state2 = await getAuthState({ requireJWT: true, traceId });

            // Property: Results should be identical
            expect(state1.isAuthenticated).toBe(state2.isAuthenticated);
            expect(state1.hasJWT).toBe(state2.hasJWT);
            expect(state1.authMethod).toBe(state2.authMethod);
            expect(state1.reason).toBe(state2.reason);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
