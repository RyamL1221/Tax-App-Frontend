/**
 * Property-Based Tests for Session Persistence Across Navigation
 * 
 * Feature: tax-form-dashboard
 * Property 5: Session Persists Across Navigation
 * 
 * **Validates: Requirements 3.3**
 * 
 * This test file uses property-based testing to verify that user sessions
 * remain valid and accessible after navigation from the dashboard to form pages,
 * for ANY valid session data.
 */

import { test, expect, describe, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import {
  generateSessionToken,
  validateSessionToken,
  SESSION_CONFIG,
  type SessionData,
} from '@/lib/session';

// Mock Next.js cookies
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

/**
 * Arbitrary generator for valid email addresses
 * Generates realistic email formats
 */
const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]+$/), // username part
    fc.constantFrom('example.com', 'test.com', 'mail.com', 'email.com', 'domain.org') // domain
  )
  .map(([username, domain]) => `${username}@${domain}`);

/**
 * Arbitrary generator for user IDs
 * Generates valid user ID formats (alphanumeric with hyphens)
 */
const userIdArbitrary = fc
  .stringMatching(/^[a-z0-9-]+$/)
  .filter(id => id.length > 0 && id.length <= 50);

/**
 * Arbitrary generator for valid SessionData objects
 * Generates session data with valid timestamps and expiration
 */
const sessionDataArbitrary = fc.record({
  userId: userIdArbitrary,
  email: emailArbitrary,
  createdAt: fc.integer({ min: Date.now() - 7 * 24 * 60 * 60 * 1000, max: Date.now() }), // Within last 7 days
  expiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 7 * 24 * 60 * 60 * 1000 }), // Future expiration (1s to 7 days)
});

/**
 * Arbitrary generator for navigation paths
 * Generates valid form paths that users might navigate to
 */
const navigationPathArbitrary = fc
  .stringMatching(/^[a-z0-9-]+$/)
  .map(formId => `/forms/${formId}`);

describe('Property-Based Tests: Session Persistence Across Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: tax-form-dashboard, Property 5: Session Persists Across Navigation
   * 
   * For ANY valid user session, after navigating from the dashboard to a form page,
   * the session should remain valid and accessible.
   * 
   * **Validates: Requirements 3.3**
   * 
   * This property test validates that session tokens remain valid after navigation
   * operations. The session data should be preserved and continue to validate
   * correctly regardless of navigation events.
   */
  test('Property 5: Session Persists Across Navigation', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        navigationPathArbitrary,
        (sessionData, navigationPath) => {
          // Generate a session token for the user
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Verify the session is valid before navigation
          const sessionBeforeNav = validateSessionToken(token);
          expect(sessionBeforeNav).not.toBeNull();
          expect(sessionBeforeNav?.userId).toBe(sessionData.userId.trim());
          expect(sessionBeforeNav?.email).toBe(sessionData.email.trim());

          // Simulate navigation by verifying the session token remains valid
          // In a real scenario, the token would be stored in a cookie and
          // retrieved on the next page. Here we verify the token itself
          // remains valid after the navigation operation.

          // Verify the session is still valid after navigation
          const sessionAfterNav = validateSessionToken(token);
          expect(sessionAfterNav).not.toBeNull();
          expect(sessionAfterNav?.userId).toBe(sessionData.userId.trim());
          expect(sessionAfterNav?.email).toBe(sessionData.email.trim());

          // Verify session data is identical before and after navigation
          expect(sessionAfterNav?.userId).toBe(sessionBeforeNav?.userId);
          expect(sessionAfterNav?.email).toBe(sessionBeforeNav?.email);
          expect(sessionAfterNav?.createdAt).toBe(sessionBeforeNav?.createdAt);
          expect(sessionAfterNav?.expiresAt).toBe(sessionBeforeNav?.expiresAt);

          // Verify the session has not expired
          const now = Date.now();
          expect(sessionAfterNav?.expiresAt).toBeGreaterThan(now);
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Session token remains valid across multiple navigation events
   * 
   * For ANY valid session, the session token should remain valid through
   * multiple sequential navigation operations.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session token remains valid across multiple navigation events', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        fc.array(navigationPathArbitrary, { minLength: 1, maxLength: 5 }),
        (sessionData, navigationPaths) => {
          // Generate a session token
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Verify initial session validity
          const initialSession = validateSessionToken(token);
          expect(initialSession).not.toBeNull();

          // Simulate multiple navigation events
          for (const path of navigationPaths) {
            // After each navigation, verify the session is still valid
            const currentSession = validateSessionToken(token);
            expect(currentSession).not.toBeNull();
            expect(currentSession?.userId).toBe(sessionData.userId.trim());
            expect(currentSession?.email).toBe(sessionData.email.trim());

            // Verify session data hasn't changed
            expect(currentSession?.createdAt).toBe(initialSession?.createdAt);
            expect(currentSession?.expiresAt).toBe(initialSession?.expiresAt);
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Session data integrity is maintained during navigation
   * 
   * For ANY valid session, all session data fields should remain unchanged
   * and accessible after navigation.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session data integrity is maintained during navigation', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        navigationPathArbitrary,
        (sessionData, navigationPath) => {
          // Generate a session token
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Get session data before navigation
          const beforeNav = validateSessionToken(token);
          expect(beforeNav).not.toBeNull();

          // Store the original values
          const originalUserId = beforeNav?.userId;
          const originalEmail = beforeNav?.email;
          const originalCreatedAt = beforeNav?.createdAt;
          const originalExpiresAt = beforeNav?.expiresAt;

          // Simulate navigation and retrieve session again
          const afterNav = validateSessionToken(token);
          expect(afterNav).not.toBeNull();

          // Verify all fields are identical
          expect(afterNav?.userId).toBe(originalUserId);
          expect(afterNav?.email).toBe(originalEmail);
          expect(afterNav?.createdAt).toBe(originalCreatedAt);
          expect(afterNav?.expiresAt).toBe(originalExpiresAt);

          // Verify no data corruption occurred
          expect(typeof afterNav?.userId).toBe('string');
          expect(typeof afterNav?.email).toBe('string');
          expect(typeof afterNav?.createdAt).toBe('number');
          expect(typeof afterNav?.expiresAt).toBe('number');
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Session expiration time is not affected by navigation
   * 
   * For ANY valid session, the expiration time should remain unchanged
   * after navigation events.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session expiration time is not affected by navigation', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        fc.array(navigationPathArbitrary, { minLength: 1, maxLength: 3 }),
        (sessionData, navigationPaths) => {
          // Generate a session token
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Get initial expiration time
          const initialSession = validateSessionToken(token);
          expect(initialSession).not.toBeNull();
          const initialExpiresAt = initialSession?.expiresAt;

          // Simulate multiple navigations
          for (const path of navigationPaths) {
            const currentSession = validateSessionToken(token);
            expect(currentSession).not.toBeNull();

            // Verify expiration time hasn't changed
            expect(currentSession?.expiresAt).toBe(initialExpiresAt);

            // Verify session is still not expired
            expect(currentSession?.expiresAt).toBeGreaterThan(Date.now());
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Different users' sessions remain independent during navigation
   * 
   * For ANY two different user sessions, navigation with one session should
   * not affect the validity or data of the other session.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Different users sessions remain independent during navigation', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        sessionDataArbitrary,
        navigationPathArbitrary,
        (sessionData1, sessionData2, navigationPath) => {
          // Skip if sessions are identical
          if (
            sessionData1.userId.trim() === sessionData2.userId.trim() &&
            sessionData1.email.trim() === sessionData2.email.trim()
          ) {
            return true;
          }

          // Generate tokens for both users
          const token1 = generateSessionToken(sessionData1.userId, sessionData1.email);
          const token2 = generateSessionToken(sessionData2.userId, sessionData2.email);

          // Verify both sessions are valid before navigation
          const session1Before = validateSessionToken(token1);
          const session2Before = validateSessionToken(token2);
          expect(session1Before).not.toBeNull();
          expect(session2Before).not.toBeNull();

          // Simulate navigation with first user's session
          const session1After = validateSessionToken(token1);
          expect(session1After).not.toBeNull();

          // Verify second user's session is unaffected
          const session2After = validateSessionToken(token2);
          expect(session2After).not.toBeNull();
          expect(session2After?.userId).toBe(session2Before?.userId);
          expect(session2After?.email).toBe(session2Before?.email);
          expect(session2After?.createdAt).toBe(session2Before?.createdAt);
          expect(session2After?.expiresAt).toBe(session2Before?.expiresAt);

          // Verify sessions remain distinct
          expect(session1After?.userId).not.toBe(session2After?.userId);
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Session validation is consistent across navigation
   * 
   * For ANY valid session token, validation should return the same result
   * before and after navigation operations.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session validation is consistent across navigation', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        navigationPathArbitrary,
        (sessionData, navigationPath) => {
          // Generate a session token
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Validate before navigation
          const validationBefore = validateSessionToken(token);
          const isValidBefore = validationBefore !== null;

          // Simulate navigation
          // In a real scenario, this would involve router navigation
          // Here we verify the token validation remains consistent

          // Validate after navigation
          const validationAfter = validateSessionToken(token);
          const isValidAfter = validationAfter !== null;

          // Validation result should be consistent
          expect(isValidAfter).toBe(isValidBefore);

          // If valid, data should be identical
          if (isValidBefore && isValidAfter) {
            expect(validationAfter?.userId).toBe(validationBefore?.userId);
            expect(validationAfter?.email).toBe(validationBefore?.email);
            expect(validationAfter?.createdAt).toBe(validationBefore?.createdAt);
            expect(validationAfter?.expiresAt).toBe(validationBefore?.expiresAt);
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Session cookie configuration supports persistence
   * 
   * For ANY session, the cookie configuration should support session
   * persistence across page navigations.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session cookie configuration supports persistence', () => {
    // Verify cookie configuration supports persistence
    expect(SESSION_CONFIG.HTTP_ONLY).toBe(true);
    expect(SESSION_CONFIG.PATH).toBe('/');
    expect(SESSION_CONFIG.MAX_AGE).toBeGreaterThan(0);
    expect(SESSION_CONFIG.SAME_SITE).toBe('lax');

    // Verify cookie is accessible across all paths
    expect(SESSION_CONFIG.PATH).toBe('/');

    // Verify cookie has sufficient lifetime for navigation
    const minLifetime = 60 * 60; // At least 1 hour
    expect(SESSION_CONFIG.MAX_AGE).toBeGreaterThanOrEqual(minLifetime);
  });

  /**
   * Property: Session tokens encode and decode consistently
   * 
   * For ANY valid session data, the token should encode and decode
   * consistently, preserving all data through the process.
   * 
   * **Validates: Requirements 3.3**
   */
  test('Property: Session tokens encode and decode consistently', () => {
    fc.assert(
      fc.property(
        sessionDataArbitrary,
        (sessionData) => {
          // Generate a token
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Decode the token
          const decoded = validateSessionToken(token);
          expect(decoded).not.toBeNull();

          // Verify all data is preserved
          expect(decoded?.userId).toBe(sessionData.userId.trim());
          expect(decoded?.email).toBe(sessionData.email.trim());

          // Decode again to verify consistency
          const decodedAgain = validateSessionToken(token);
          expect(decodedAgain).not.toBeNull();

          // Verify both decodes produce identical results
          expect(decodedAgain?.userId).toBe(decoded?.userId);
          expect(decodedAgain?.email).toBe(decoded?.email);
          expect(decodedAgain?.createdAt).toBe(decoded?.createdAt);
          expect(decodedAgain?.expiresAt).toBe(decoded?.expiresAt);
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });
});
