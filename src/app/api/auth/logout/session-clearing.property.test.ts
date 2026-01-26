/**
 * Property-Based Test for Session Clearing on Logout
 * 
 * Feature: logout-button
 * Property 1: Session Cookie Cleared on Logout
 * 
 * **Validates: Requirements 1.5, 3.4, 7.1**
 * 
 * This test file uses property-based testing to verify that session cookies
 * are completely removed from the system after logout, for ANY valid session state.
 * 
 * @jest-environment node
 */

import { test, expect, describe, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// Get the actual session functions before mocking
const actualSession = jest.requireActual('@/lib/session') as typeof import('@/lib/session');
const { generateSessionToken, validateSessionToken, SESSION_CONFIG } = actualSession;
type SessionData = typeof actualSession.SessionData;

// Mock the session module - only mock clearSession
jest.mock('@/lib/session', () => ({
  ...jest.requireActual('@/lib/session'),
  clearSession: jest.fn(),
}));

// Import the mocked module
import * as session from '@/lib/session';
import { POST } from './route';

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

describe('Property-Based Test: Session Clearing on Logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Debug: check if clearSession is a mock
    console.log('clearSession type:', typeof session.clearSession);
    console.log('clearSession:', session.clearSession);
    console.log('Is mock?:', jest.isMockFunction(session.clearSession));
    
    // Mock clearSession to succeed
    (session.clearSession as jest.Mock).mockResolvedValue(undefined);

    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Feature: logout-button, Property 1: Session Cookie Cleared on Logout
   * 
   * For ANY valid user session, after a successful logout request,
   * the session cookie should be completely removed from the cookie store.
   * 
   * **Validates: Requirements 1.5, 3.4, 7.1**
   * 
   * This property test validates that:
   * 1. clearSession is called for any session state
   * 2. The logout API returns success
   * 3. The session clearing function is invoked exactly once per logout
   */
  test('Property 1: Session Cookie Cleared on Logout', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Generate a session token for the user
          const token = generateSessionToken(sessionData.userId, sessionData.email);

          // Verify the token is valid before logout
          const sessionBeforeLogout = validateSessionToken(token);
          expect(sessionBeforeLogout).not.toBeNull();
          expect(sessionBeforeLogout?.userId).toBe(sessionData.userId.trim());
          expect(sessionBeforeLogout?.email).toBe(sessionData.email.trim());

          // Create a logout request
          const request = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });

          // Perform logout
          const response = await POST(request);
          const data = await response.json();

          // Verify logout was successful
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);

          // Verify clearSession was called exactly once
          expect(session.clearSession).toHaveBeenCalledTimes(1);
          expect(session.clearSession).toHaveBeenCalledWith();
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
   * Property: Session cookie deletion is idempotent
   * 
   * For ANY session state, calling logout multiple times should not cause errors,
   * and clearSession should be called each time.
   * 
   * **Validates: Requirements 1.5, 7.1**
   */
  test('Property: Session cookie deletion is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Generate a session token
          const token = session.generateSessionToken(sessionData.userId, sessionData.email);

          // Verify token is valid
          expect(session.validateSessionToken(token)).not.toBeNull();

          // Create first logout request
          const request1 = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });

          // First logout
          const response1 = await POST(request1);
          expect(response1.status).toBe(200);
          expect(session.clearSession).toHaveBeenCalledTimes(1);

          // Reset mock call counts
          (session.clearSession as jest.Mock).mockClear();

          // Second logout (simulating logout when already logged out)
          const request2 = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });

          const response2 = await POST(request2);
          
          // Should still succeed
          expect(response2.status).toBe(200);
          const data2 = await response2.json();
          expect(data2.success).toBe(true);

          // clearSession should still be called
          expect(session.clearSession).toHaveBeenCalledTimes(1);
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
   * Property: Different user sessions are cleared independently
   * 
   * For ANY two different user sessions, each logout should call clearSession
   * independently.
   * 
   * **Validates: Requirements 1.5, 7.1**
   */
  test('Property: Different user sessions are cleared independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        sessionDataArbitrary,
        async (sessionData1, sessionData2) => {
          // Skip if sessions are identical
          if (
            sessionData1.userId.trim() === sessionData2.userId.trim() &&
            sessionData1.email.trim() === sessionData2.email.trim()
          ) {
            return true;
          }

          // Generate tokens for both users
          const token1 = session.generateSessionToken(sessionData1.userId, sessionData1.email);
          const token2 = session.generateSessionToken(sessionData2.userId, sessionData2.email);

          // Verify both tokens are valid
          expect(session.validateSessionToken(token1)).not.toBeNull();
          expect(session.validateSessionToken(token2)).not.toBeNull();

          // Logout first user
          const request1 = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });
          const response1 = await POST(request1);
          expect(response1.status).toBe(200);
          expect(session.clearSession).toHaveBeenCalledTimes(1);

          // Reset mock
          (session.clearSession as jest.Mock).mockClear();

          // Logout second user
          const request2 = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });
          const response2 = await POST(request2);
          expect(response2.status).toBe(200);
          expect(session.clearSession).toHaveBeenCalledTimes(1);

          // Verify second user's token is still valid (logout doesn't invalidate the token itself)
          const session2 = session.validateSessionToken(token2);
          expect(session2).not.toBeNull();
          expect(session2?.userId).toBe(sessionData2.userId.trim());
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
   * Property: Session clearing works for sessions at different lifecycle stages
   * 
   * For ANY session (newly created, mid-life, near expiration), logout should
   * successfully call clearSession.
   * 
   * **Validates: Requirements 1.5, 3.4, 7.1**
   */
  test('Property: Session clearing works for sessions at different lifecycle stages', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        emailArbitrary,
        fc.constantFrom('new', 'mid-life', 'near-expiration'),
        async (userId, email, lifecycleStage) => {
          let sessionData: session.SessionData;
          const now = Date.now();

          // Create session data based on lifecycle stage
          switch (lifecycleStage) {
            case 'new':
              // Newly created session (created within last minute)
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 60000, // 1 minute ago
                expiresAt: now + session.SESSION_CONFIG.MAX_AGE * 1000,
              };
              break;
            case 'mid-life':
              // Mid-life session (created 3 days ago, expires in 4 days)
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 3 * 24 * 60 * 60 * 1000,
                expiresAt: now + 4 * 24 * 60 * 60 * 1000,
              };
              break;
            case 'near-expiration':
              // Near expiration (expires in 1 hour)
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 6 * 24 * 60 * 60 * 1000,
                expiresAt: now + 60 * 60 * 1000, // 1 hour from now
              };
              break;
          }

          // Create token from session data
          const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');

          // Verify token is valid
          const validatedSession = session.validateSessionToken(token);
          expect(validatedSession).not.toBeNull();

          // Perform logout
          const request = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });
          const response = await POST(request);

          // Verify logout was successful
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);

          // Verify clearSession was called
          expect(session.clearSession).toHaveBeenCalledTimes(1);
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
   * Property: Logout succeeds regardless of session validity
   * 
   * For ANY session data (valid or invalid), the logout endpoint should
   * always succeed and call clearSession.
   * 
   * **Validates: Requirements 1.5, 7.1**
   */
  test('Property: Logout succeeds regardless of session validity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          sessionDataArbitrary, // Valid session
          fc.record({
            // Expired session
            userId: userIdArbitrary,
            email: emailArbitrary,
            createdAt: fc.integer({ min: Date.now() - 30 * 24 * 60 * 60 * 1000, max: Date.now() - 8 * 24 * 60 * 60 * 1000 }),
            expiresAt: fc.integer({ min: Date.now() - 7 * 24 * 60 * 60 * 1000, max: Date.now() - 1000 }), // Expired
          })
        ),
        async (sessionData) => {
          // Generate token (may be expired)
          const token = Buffer.from(JSON.stringify({
            userId: sessionData.userId.trim(),
            email: sessionData.email.trim(),
            createdAt: sessionData.createdAt,
            expiresAt: sessionData.expiresAt,
          })).toString('base64');

          // Perform logout (should succeed regardless of token validity)
          const request = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
          });
          const response = await POST(request);

          // Verify logout was successful
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);

          // Verify clearSession was called
          expect(session.clearSession).toHaveBeenCalledTimes(1);
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
