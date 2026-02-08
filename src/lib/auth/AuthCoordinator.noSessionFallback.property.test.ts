/**
 * Property-Based Tests for AuthCoordinator No Session Fallback
 * 
 * Tests that session-only authentication never grants access when JWT is required.
 * Verifies that the requireJWT flag properly prevents session-based fallback.
 * 
 * Feature: fix-dashboard-auth-redirect
 * Property 3: No session fallback for dashboard
 * Validates: Requirements 1.3, 7.1, 7.2, 7.5
 */

import { test, expect, describe, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { getAuthState, type AuthOptions, type ExtendedAuthState } from './AuthCoordinator';
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
 * Arbitrary for session states (with valid session but no JWT)
 * Generates various session configurations to test fallback prevention
 */
const sessionOnlyStateArbitrary = fc.record({
  sessionValid: fc.boolean(),
  refreshSucceeds: fc.boolean(),
  sessionHasUserData: fc.boolean(),
  userId: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
});

/**
 * Arbitrary for trace IDs
 */
const traceIdArbitrary = fc.option(
  fc.string({ minLength: 5, maxLength: 20 }),
  { nil: undefined }
);

describe('AuthCoordinator - Property 3: No Session Fallback for Dashboard', () => {
  let hasTokenSpy: jest.SpiedFunction<typeof tokenManager.hasToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create spy for each test
    hasTokenSpy = jest.spyOn(tokenManager, 'hasToken');
    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    // Restore spy after each test
    hasTokenSpy.mockRestore();
  });

  /**
   * Property 3: No session fallback for dashboard
   * 
   * **Validates: Requirements 1.3, 7.1, 7.2, 7.5**
   * 
   * For any authentication state with a valid session but no JWT:
   * - When requireJWT is true, isAuthenticated must be false
   * - Session validity should not affect the result
   * - JWT refresh attempts should be skipped
   * - authMethod should be 'none', not 'session'
   */
  describe('Session-only never grants access when requireJWT is true', () => {
    test('Valid session without JWT → isAuthenticated: false', async () => {
      await fc.assert(
        fc.asyncProperty(
          sessionOnlyStateArbitrary,
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT, but potentially valid session
            hasTokenSpy.mockReturnValue(false);

            // Mock session check (should not be called due to requireJWT)
            if (sessionState.sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    valid: true,
                    userId: sessionState.userId,
                    email: sessionState.email,
                  }),
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

            // Call getAuthState with requireJWT: true
            const options: AuthOptions = { requireJWT: true, traceId };
            const state = await getAuthState(options);

            // Property assertions: Session-only NEVER grants access
            expect(state.isAuthenticated).toBe(false);
            expect(state.hasJWT).toBe(false);
            expect(state.authMethod).toBe('none');
            expect(state.authMethod).not.toBe('session');
            expect(state.reason).toBe('JWT required for this route');

            // Session check should be skipped entirely
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Session validity does not affect authentication when requireJWT is true', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // sessionValid - should not matter
          fc.boolean(), // refreshSucceeds - should not matter
          traceIdArbitrary,
          async (sessionValid, refreshSucceeds, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Mock session (should not be called)
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({
                ok: sessionValid,
                status: sessionValid ? 200 : 401,
              })
              .mockResolvedValueOnce({
                ok: refreshSucceeds,
                status: refreshSucceeds ? 200 : 403,
                json: async () => ({ token: 'mock-jwt-token' }),
              });

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Result is always the same regardless of session state
            expect(state.isAuthenticated).toBe(false);
            expect(state.hasJWT).toBe(false);
            expect(state.authMethod).toBe('none');
            expect(state.reason).toBe('JWT required for this route');

            // Session check should never happen
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('JWT refresh is never attempted when requireJWT is true and no JWT', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          sessionOnlyStateArbitrary,
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Mock session and refresh (should not be called)
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({
                ok: sessionState.sessionValid,
                status: sessionState.sessionValid ? 200 : 401,
              })
              .mockResolvedValueOnce({
                ok: sessionState.refreshSucceeds,
                status: sessionState.refreshSucceeds ? 200 : 403,
                json: async () => ({ token: 'mock-jwt-token' }),
              });

            // Call getAuthState with requireJWT: true
            await getAuthState({ requireJWT: true, traceId });

            // Property: No API calls should be made
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('authMethod is never "session" when requireJWT is true', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          sessionOnlyStateArbitrary,
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Mock session (should not be called)
            if (sessionState.sessionValid) {
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
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: authMethod must never be 'session'
            expect(state.authMethod).not.toBe('session');
            expect(state.authMethod).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Fallback mode is never activated when requireJWT is true and no JWT', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          sessionOnlyStateArbitrary,
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Clear fallback mode before test
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.removeItem('auth_fallback_mode');
            }

            // Mock session (should not be called)
            if (sessionState.sessionValid) {
              (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                  ok: true,
                  status: 200,
                })
                .mockResolvedValueOnce({
                  ok: false, // Refresh fails
                  status: 403,
                });
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Fallback mode should not be activated
            expect(state.inFallbackMode).toBe(false);

            // Verify fallback mode was not set in sessionStorage
            if (typeof window !== 'undefined' && window.sessionStorage) {
              const fallbackMode = sessionStorage.getItem('auth_fallback_mode');
              expect(fallbackMode).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Contrast test: Session fallback works when requireJWT is false
   * 
   * This verifies that the requireJWT flag is the controlling factor,
   * not a general bug in session handling.
   */
  describe('Contrast: Session fallback works when requireJWT is false', () => {
    test('Valid session without JWT → isAuthenticated: true when requireJWT is false', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // refreshSucceeds
          traceIdArbitrary,
          async (refreshSucceeds, traceId) => {
            // Setup: No JWT, but valid session
            hasTokenSpy.mockReturnValue(false);

            // Mock session check - valid session
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

            // Call getAuthState with requireJWT: false (or omitted)
            const state = await getAuthState({ requireJWT: false, traceId });

            // Property: Session fallback should work
            expect(global.fetch).toHaveBeenCalled();

            // If refresh fails, should use session-based auth
            if (!refreshSucceeds) {
              expect(state.hasSession).toBe(true);
              expect(state.isAuthenticated).toBe(true);
              expect(state.authMethod).toBe('session');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('requireJWT flag is the determining factor for session fallback', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // requireJWT
          traceIdArbitrary,
          async (requireJWT, traceId) => {
            // Setup: No JWT, valid session, refresh fails
            hasTokenSpy.mockReturnValue(false);

            // Mock session check - valid session, refresh fails
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({
                ok: true,
                status: 200,
              })
              .mockResolvedValueOnce({
                ok: false,
                status: 403,
              });

            // Call getAuthState with the requireJWT flag
            const state = await getAuthState({ requireJWT, traceId });

            // Property: requireJWT determines whether session fallback is used
            if (requireJWT) {
              // No session fallback
              expect(state.isAuthenticated).toBe(false);
              expect(state.authMethod).toBe('none');
              expect(global.fetch).not.toHaveBeenCalled();
            } else {
              // Session fallback allowed
              expect(global.fetch).toHaveBeenCalled();
              // May use session-based auth
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
  describe('Edge cases for session fallback prevention', () => {
    test('Session with user data still does not grant access when requireJWT is true', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }), // userId
          fc.emailAddress(), // email
          traceIdArbitrary,
          async (userId, email, traceId) => {
            // Setup: No JWT, but session with user data
            hasTokenSpy.mockReturnValue(false);

            // Mock session with rich user data (should not be called)
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                valid: true,
                userId,
                email,
                expiresAt: Date.now() + 3600000,
              }),
            });

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Even with rich session data, no access granted
            expect(state.isAuthenticated).toBe(false);
            expect(state.authMethod).toBe('none');
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Multiple session checks with requireJWT produce consistent results', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          sessionOnlyStateArbitrary,
          traceIdArbitrary,
          async (sessionState, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            // Call multiple times
            const state1 = await getAuthState({ requireJWT: true, traceId });
            const state2 = await getAuthState({ requireJWT: true, traceId });
            const state3 = await getAuthState({ requireJWT: true, traceId });

            // Property: All results should be identical
            expect(state1.isAuthenticated).toBe(false);
            expect(state2.isAuthenticated).toBe(false);
            expect(state3.isAuthenticated).toBe(false);

            expect(state1.authMethod).toBe('none');
            expect(state2.authMethod).toBe('none');
            expect(state3.authMethod).toBe('none');

            // No API calls should have been made
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Session expiration does not matter when requireJWT is true', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -3600000, max: 3600000 }), // expiresAt offset
          traceIdArbitrary,
          async (expiresOffset, traceId) => {
            // Setup: No JWT
            hasTokenSpy.mockReturnValue(false);

            const expiresAt = Date.now() + expiresOffset;
            const isExpired = expiresAt < Date.now();

            // Mock session with expiration (should not be called)
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: !isExpired,
              status: isExpired ? 401 : 200,
              json: async () => ({
                valid: !isExpired,
                expiresAt,
              }),
            });

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Property: Result is the same regardless of session expiration
            expect(state.isAuthenticated).toBe(false);
            expect(state.authMethod).toBe('none');
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Security-focused properties
   */
  describe('Security properties', () => {
    test('No JWT means no authentication for protected routes, regardless of session', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionValid: fc.boolean(),
            sessionHasUserData: fc.boolean(),
            refreshSucceeds: fc.boolean(),
            inFallbackMode: fc.boolean(),
          }),
          traceIdArbitrary,
          async (securityState, traceId) => {
            // Setup: No JWT (the security boundary)
            hasTokenSpy.mockReturnValue(false);

            // Set fallback mode if specified
            if (securityState.inFallbackMode && typeof window !== 'undefined') {
              sessionStorage.setItem('auth_fallback_mode', JSON.stringify({
                active: true,
                reason: 'Test fallback mode',
                timestamp: Date.now(),
              }));
            }

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Security property: No JWT = No access, period
            expect(state.isAuthenticated).toBe(false);
            expect(state.hasJWT).toBe(false);
            expect(state.authMethod).not.toBe('session');
            expect(state.authMethod).not.toBe('jwt');
            expect(state.authMethod).toBe('none');

            // No session checks should bypass the JWT requirement
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Session-based authentication cannot be used to bypass JWT requirement', async () => {
      
      await fc.assert(
        fc.asyncProperty(
          traceIdArbitrary,
          async (traceId) => {
            // Setup: No JWT, but perfect session conditions
            hasTokenSpy.mockReturnValue(false);

            // Mock perfect session (should not be called)
            (global.fetch as jest.Mock)
              .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                  valid: true,
                  userId: 'user-123',
                  email: 'user@example.com',
                  expiresAt: Date.now() + 3600000,
                }),
              })
              .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ token: 'fresh-jwt-token' }),
              });

            // Call getAuthState with requireJWT: true
            const state = await getAuthState({ requireJWT: true, traceId });

            // Security property: Even with perfect session, no bypass
            expect(state.isAuthenticated).toBe(false);
            expect(state.authMethod).toBe('none');
            expect(state.reason).toBe('JWT required for this route');

            // Session should not be checked
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
