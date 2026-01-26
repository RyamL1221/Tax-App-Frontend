/**
 * Property-Based Tests for Dashboard Unauthenticated Redirect
 * 
 * Feature: tax-form-dashboard
 * Property 2: Unauthenticated Users Are Redirected
 * 
 * **Validates: Requirements 1.2**
 * 
 * This test file uses property-based testing to verify that unauthenticated users
 * are redirected to the login page when attempting to access the dashboard, for ANY
 * invalid or missing session state.
 */

import * as fc from 'fast-check';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardPage from './page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock session management
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Mock DashboardClient component
jest.mock('./DashboardClient', () => ({
  __esModule: true,
  default: () => null,
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

/**
 * Arbitrary generator for invalid session states
 * Generates various ways a session can be invalid or missing
 */
const invalidSessionArbitrary = fc.constantFrom(
  null,           // No session
  undefined,      // Undefined session
);

/**
 * Arbitrary generator for expired session data
 * Generates session data with expiration in the past
 */
const expiredSessionArbitrary = fc.record({
  userId: fc.stringMatching(/^[a-z0-9-]+$/).filter(id => id.length > 0 && id.length <= 50),
  email: fc.tuple(
    fc.stringMatching(/^[a-z0-9]+$/),
    fc.constantFrom('example.com', 'test.com', 'mail.com')
  ).map(([username, domain]) => `${username}@${domain}`),
  createdAt: fc.integer({ min: Date.now() - 14 * 24 * 60 * 60 * 1000, max: Date.now() - 8 * 24 * 60 * 60 * 1000 }), // 8-14 days ago
  expiresAt: fc.integer({ min: Date.now() - 7 * 24 * 60 * 60 * 1000, max: Date.now() - 1000 }), // Expired (1s to 7 days ago)
});

/**
 * Arbitrary generator for malformed session data
 * Generates session objects with missing or invalid required fields
 */
const malformedSessionArbitrary = fc.oneof(
  // Missing userId
  fc.record({
    email: fc.string(),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
  // Missing email
  fc.record({
    userId: fc.string(),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
  // Empty userId
  fc.record({
    userId: fc.constant(''),
    email: fc.string(),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
  // Empty email
  fc.record({
    userId: fc.string(),
    email: fc.constant(''),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
  // Invalid types
  fc.record({
    userId: fc.integer(),
    email: fc.string(),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
  fc.record({
    userId: fc.string(),
    email: fc.integer(),
    createdAt: fc.integer(),
    expiresAt: fc.integer(),
  }),
);

/**
 * Combined arbitrary for all types of invalid/missing sessions
 */
const noValidSessionArbitrary = fc.oneof(
  invalidSessionArbitrary,
  expiredSessionArbitrary.map(() => null), // Expired sessions return null from getSession
  malformedSessionArbitrary.map(() => null), // Malformed sessions return null from getSession
);

describe('Property-Based Tests: Dashboard Unauthenticated Redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset redirect mock to throw an error (simulating Next.js redirect behavior)
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT: ${url}`);
    });
  });

  /**
   * Feature: tax-form-dashboard, Property 2: Unauthenticated Users Are Redirected
   * 
   * For ANY request to the dashboard without a valid session, the system should
   * redirect to the login page.
   * 
   * **Validates: Requirements 1.2**
   * 
   * This property test validates that the dashboard page correctly redirects
   * unauthenticated users to the login page for any invalid or missing session state.
   */
  test('Property 2: Unauthenticated Users Are Redirected', async () => {
    await fc.assert(
      fc.asyncProperty(noValidSessionArbitrary, async (sessionState) => {
        // Clear mocks before each property test iteration
        jest.clearAllMocks();
        mockRedirect.mockImplementation((url: string) => {
          throw new Error(`NEXT_REDIRECT: ${url}`);
        });

        // Mock getSession to return the invalid session state
        mockGetSession.mockResolvedValue(sessionState);

        // Attempt to render the dashboard page
        // The redirect should be called, which throws an error in Next.js
        let redirectCalled = false;
        let redirectUrl = '';

        try {
          await DashboardPage();
        } catch (error) {
          if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
            redirectCalled = true;
            redirectUrl = error.message.replace('NEXT_REDIRECT: ', '');
          }
        }

        // Verify redirect was called
        expect(redirectCalled).toBe(true);
        expect(redirectUrl).toBe('/login');
        expect(mockRedirect).toHaveBeenCalledWith('/login');
        expect(mockRedirect).toHaveBeenCalledTimes(1);
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Null session always redirects to login
   * 
   * For ANY null session (no session cookie), the dashboard should
   * redirect to the login page.
   * 
   * **Validates: Requirements 1.2**
   */
  test('Property: Null session always redirects to login', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async (sessionState) => {
        jest.clearAllMocks();
        mockRedirect.mockImplementation((url: string) => {
          throw new Error(`NEXT_REDIRECT: ${url}`);
        });
        mockGetSession.mockResolvedValue(sessionState);

        let redirectCalled = false;
        let redirectUrl = '';

        try {
          await DashboardPage();
        } catch (error) {
          if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
            redirectCalled = true;
            redirectUrl = error.message.replace('NEXT_REDIRECT: ', '');
          }
        }

        expect(redirectCalled).toBe(true);
        expect(redirectUrl).toBe('/login');
        expect(mockRedirect).toHaveBeenCalledWith('/login');
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Undefined session always redirects to login
   * 
   * For ANY undefined session, the dashboard should redirect to the login page.
   * 
   * **Validates: Requirements 1.2**
   */
  test('Property: Undefined session always redirects to login', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(undefined), async (sessionState) => {
        jest.clearAllMocks();
        mockRedirect.mockImplementation((url: string) => {
          throw new Error(`NEXT_REDIRECT: ${url}`);
        });
        mockGetSession.mockResolvedValue(sessionState);

        let redirectCalled = false;
        let redirectUrl = '';

        try {
          await DashboardPage();
        } catch (error) {
          if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
            redirectCalled = true;
            redirectUrl = error.message.replace('NEXT_REDIRECT: ', '');
          }
        }

        expect(redirectCalled).toBe(true);
        expect(redirectUrl).toBe('/login');
        expect(mockRedirect).toHaveBeenCalledWith('/login');
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Dashboard never renders for unauthenticated users
   * 
   * For ANY invalid session state, the dashboard should redirect before
   * rendering the DashboardClient component.
   * 
   * **Validates: Requirements 1.2**
   */
  test('Property: Dashboard never renders for unauthenticated users', async () => {
    await fc.assert(
      fc.asyncProperty(noValidSessionArbitrary, async (sessionState) => {
        jest.clearAllMocks();
        mockRedirect.mockImplementation((url: string) => {
          throw new Error(`NEXT_REDIRECT: ${url}`);
        });
        mockGetSession.mockResolvedValue(sessionState);

        let dashboardRendered = false;

        try {
          const result = await DashboardPage();
          // If we get here without redirect, check if result is null (mocked component)
          dashboardRendered = result !== null;
        } catch (error) {
          // Redirect was called (expected behavior)
          if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
            dashboardRendered = false;
          }
        }

        // Dashboard should never render for unauthenticated users
        expect(dashboardRendered).toBe(false);
        expect(mockRedirect).toHaveBeenCalled();
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Redirect always targets login page
   * 
   * For ANY invalid session state, when redirect is called, it should
   * always target the /login path (not any other path).
   * 
   * **Validates: Requirements 1.2**
   */
  test('Property: Redirect always targets login page', async () => {
    await fc.assert(
      fc.asyncProperty(noValidSessionArbitrary, async (sessionState) => {
        jest.clearAllMocks();
        mockRedirect.mockImplementation((url: string) => {
          throw new Error(`NEXT_REDIRECT: ${url}`);
        });
        mockGetSession.mockResolvedValue(sessionState);

        try {
          await DashboardPage();
        } catch (error) {
          // Expected redirect error
        }

        // Verify redirect was called with exactly '/login'
        expect(mockRedirect).toHaveBeenCalledWith('/login');
        
        // Verify no other paths were used
        const calls = mockRedirect.mock.calls;
        for (const call of calls) {
          expect(call[0]).toBe('/login');
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });
});
