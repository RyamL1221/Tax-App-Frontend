/**
 * Property-Based Test: Refresh Route Error Integrity
 *
 * Feature: fix-auth-token-redirect
 * Property 3: Refresh route error integrity
 *
 * **Validates: Requirements 4.2, 4.3**
 *
 * The backend has no /auth/refresh endpoint, so the refresh route always
 * fails. This test generates random session states (null, missing fields,
 * expired, valid, getSession throws) and verifies that:
 *   1. The response status is never 200 (always an error).
 *   2. The response body always contains a non-empty `error` string field.
 *
 * @jest-environment node
 */

import * as fc from 'fast-check';
import { NextRequest } from 'next/server';
import * as session from '@/lib/session';
import type { SessionData } from '@/lib/session';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  logTokenOperation: jest.fn(),
  createAuthState: jest.fn(() => ({
    hasSession: false,
    hasJWT: false,
    isAuthenticated: false,
    userId: null,
    email: null,
  })),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Import the route handler *after* mocks are in place
import { POST } from './route';

// Typed reference to the mock for convenience
const mockGetSession = session.getSession as jest.Mock;

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generates a realistic email address */
const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom('example.com', 'test.org', 'mail.net'),
  )
  .map(([user, domain]) => `${user}@${domain}`);

/** Generates a non-empty user ID */
const userIdArb = fc
  .stringMatching(/^[a-z0-9][a-z0-9-]{0,19}$/)
  .filter((id) => id.length > 0);

/** Generates a valid, non-expired session with all required fields */
const validSessionArb: fc.Arbitrary<SessionData> = fc.record({
  userId: userIdArb,
  email: emailArb,
  createdAt: fc.integer({ min: Date.now() - 7 * 86_400_000, max: Date.now() }),
  expiresAt: fc.integer({ min: Date.now() + 1_000, max: Date.now() + 7 * 86_400_000 }),
});

/** Generates an expired session (expiresAt in the past) */
const expiredSessionArb: fc.Arbitrary<SessionData> = fc.record({
  userId: userIdArb,
  email: emailArb,
  createdAt: fc.integer({ min: Date.now() - 30 * 86_400_000, max: Date.now() - 8 * 86_400_000 }),
  expiresAt: fc.integer({ min: Date.now() - 7 * 86_400_000, max: Date.now() - 1_000 }),
});

/**
 * Generates a session with one or more required fields missing/empty.
 * The route checks `!session.userId || !session.email`, so we randomly
 * knock out one or both.
 */
const missingFieldSessionArb: fc.Arbitrary<Partial<SessionData>> = fc
  .record({
    userId: fc.oneof(fc.constant(''), fc.constant(undefined as unknown as string)),
    email: fc.oneof(fc.constant(''), fc.constant(undefined as unknown as string)),
    createdAt: fc.integer({ min: 1, max: Date.now() }),
    expiresAt: fc.integer({ min: Date.now() + 1_000, max: Date.now() + 86_400_000 }),
  })
  // Ensure at least one of userId/email is actually falsy
  .filter((s) => !s.userId || !s.email);

/** Generates a random Error message for the getSession-throws scenario */
const errorMessageArb = fc.stringMatching(/^[A-Za-z ]{1,40}$/);

/**
 * Discriminated union of all session scenarios the route can encounter.
 * Each variant maps to a different code path in the handler.
 */
type SessionScenario =
  | { kind: 'null' }
  | { kind: 'missingFields'; session: Partial<SessionData> }
  | { kind: 'expired'; session: SessionData }
  | { kind: 'valid'; session: SessionData }
  | { kind: 'throws'; message: string };

const sessionScenarioArb: fc.Arbitrary<SessionScenario> = fc.oneof(
  // 1. No session cookie at all
  fc.constant<SessionScenario>({ kind: 'null' }),
  // 2. Session with missing userId or email
  missingFieldSessionArb.map<SessionScenario>((s) => ({ kind: 'missingFields', session: s })),
  // 3. Expired session
  expiredSessionArb.map<SessionScenario>((s) => ({ kind: 'expired', session: s })),
  // 4. Valid session (all fields present, not expired) — route returns 501
  validSessionArb.map<SessionScenario>((s) => ({ kind: 'valid', session: s })),
  // 5. getSession throws an unexpected error — route returns 500
  errorMessageArb.map<SessionScenario>((m) => ({ kind: 'throws', message: m })),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal NextRequest for POST /api/auth/refresh */
function buildRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
  });
}

/** Configure mockGetSession for the given scenario */
function applyScenario(scenario: SessionScenario): void {
  switch (scenario.kind) {
    case 'null':
      mockGetSession.mockResolvedValue(null);
      break;
    case 'missingFields':
      mockGetSession.mockResolvedValue(scenario.session as SessionData);
      break;
    case 'expired':
      mockGetSession.mockResolvedValue(scenario.session);
      break;
    case 'valid':
      mockGetSession.mockResolvedValue(scenario.session);
      break;
    case 'throws':
      mockGetSession.mockRejectedValue(new Error(scenario.message));
      break;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 3: Refresh route error integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.warn / console.error noise during tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For ANY session scenario the refresh route can encounter, the response
   * MUST have a non-200 status code and MUST include a non-empty `error`
   * string in the JSON body.
   *
   * This guarantees that callers (e.g. AuthCoordinator) will never
   * mistakenly treat a refresh response as successful.
   */
  test('response is always non-200 with a descriptive error field', async () => {
    await fc.assert(
      fc.asyncProperty(sessionScenarioArb, async (scenario) => {
        // Reset mock before each iteration to avoid stale state
        mockGetSession.mockReset();

        // Arrange
        applyScenario(scenario);

        // Act
        const response = await POST(buildRequest());
        const body = await response.json();

        // Assert — status is never 200
        expect(response.status).not.toBe(200);
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThanOrEqual(599);

        // Assert — body contains a non-empty error string
        expect(body).toHaveProperty('error');
        expect(typeof body.error).toBe('string');
        expect(body.error.length).toBeGreaterThan(0);
      }),
      {
        numRuns: 100,
        timeout: 15_000,
        endOnFailure: true,
      },
    );
  });

  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * Verify the specific status codes returned for each scenario category:
   *   - null / missing fields → 401
   *   - expired → 401
   *   - valid session → 501 (refresh not supported)
   *   - getSession throws → 500
   */
  test('status codes match expected error categories', async () => {
    await fc.assert(
      fc.asyncProperty(sessionScenarioArb, async (scenario) => {
        // Reset mock before each iteration to avoid stale state
        mockGetSession.mockReset();
        applyScenario(scenario);

        const response = await POST(buildRequest());
        const body = await response.json();

        // Every response must have an error field regardless of category
        expect(body).toHaveProperty('error');
        expect(typeof body.error).toBe('string');
        expect(body.error.length).toBeGreaterThan(0);

        switch (scenario.kind) {
          case 'null':
          case 'missingFields':
            expect(response.status).toBe(401);
            break;
          case 'expired':
            expect(response.status).toBe(401);
            break;
          case 'valid':
            // Backend has no refresh endpoint → 501 Not Implemented
            expect(response.status).toBe(501);
            break;
          case 'throws':
            expect(response.status).toBe(500);
            break;
        }
      }),
      {
        numRuns: 100,
        timeout: 15_000,
        endOnFailure: true,
      },
    );
  });
});
