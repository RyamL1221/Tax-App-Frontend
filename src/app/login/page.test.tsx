/**
 * Tests for Login Page Server Component
 *
 * Validates that the login page never redirects based on session cookies alone,
 * always renders the login form, and clears stale session cookies.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.4, 3.1, 3.3, 5.2, 5.3**
 */

import * as fc from 'fast-check';
import { redirect } from 'next/navigation';
import type { SessionData } from '@/lib/session';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

// Mock the LoginPageClient component
jest.mock('./LoginPageClient', () => {
  return function MockLoginPageClient(props: { callbackUrl?: string; expired?: boolean }) {
    return (
      <div data-testid="login-page-client" data-callback-url={props.callbackUrl || ''} data-expired={String(props.expired)}>
        Login Page Client
      </div>
    );
  };
});

// Import the page component after mocks are set up
import LoginPage from './page';
import { getSession, clearSession } from '@/lib/session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('Login Page Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClearSession.mockResolvedValue(undefined);
  });

  describe('Unit Tests', () => {
    test('renders login form when no session exists', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await LoginPage({ searchParams: {} });

      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockClearSession).not.toHaveBeenCalled();
    });

    test('renders login form and clears session when valid session exists', async () => {
      const mockSession: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      mockGetSession.mockResolvedValue(mockSession);

      const result = await LoginPage({ searchParams: {} });

      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    test('passes returnUrl as callbackUrl to LoginPageClient', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await LoginPage({
        searchParams: { returnUrl: '/dashboard' },
      });

      expect(result).toBeDefined();
      // The component should receive returnUrl as callbackUrl
      expect(result.props.callbackUrl).toBe('/dashboard');
    });

    test('passes callbackUrl to LoginPageClient when both callbackUrl and returnUrl exist', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await LoginPage({
        searchParams: { callbackUrl: '/forms', returnUrl: '/dashboard' },
      });

      expect(result).toBeDefined();
      // callbackUrl takes precedence over returnUrl
      expect(result.props.callbackUrl).toBe('/forms');
    });

    test('passes expired=true to LoginPageClient', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await LoginPage({
        searchParams: { expired: 'true' },
      });

      expect(result).toBeDefined();
      expect(result.props.expired).toBe(true);
    });

    test('passes expired=false when expired param is not "true"', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await LoginPage({
        searchParams: { expired: 'false' },
      });

      expect(result).toBeDefined();
      expect(result.props.expired).toBe(false);
    });

    test('renders login form when clearSession throws an error', async () => {
      const mockSession: SessionData = {
        userId: 'user-456',
        email: 'fail@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      mockGetSession.mockResolvedValue(mockSession);
      mockClearSession.mockRejectedValue(new Error('Cookie deletion failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await LoginPage({ searchParams: {} });

      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
      // clearSession was attempted
      expect(mockClearSession).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    test('renders login form when getSession throws an error', async () => {
      mockGetSession.mockRejectedValue(new Error('Cookie read failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await LoginPage({ searchParams: {} });

      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('logs stale session clearing with userId and reason', async () => {
      const mockSession: SessionData = {
        userId: 'user-789',
        email: 'stale@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      mockGetSession.mockResolvedValue(mockSession);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await LoginPage({ searchParams: {} });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[LoginPage] Clearing stale session cookie',
        expect.objectContaining({
          userId: 'user-789',
          reason: expect.stringContaining('no backend refresh endpoint'),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Property-Based Tests', () => {
    // **Validates: Requirements 1.1, 1.3, 2.1, 2.4**
    test('property: login page never redirects regardless of session state', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random session states: valid session or null
          fc.option(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              email: fc.emailAddress(),
              createdAt: fc.integer({ min: 0, max: Date.now() }),
              expiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 86400000 }),
            }),
            { nil: null }
          ),
          fc.option(fc.webUrl(), { nil: undefined }),
          async (sessionData, callbackUrl) => {
            jest.clearAllMocks();
            mockClearSession.mockResolvedValue(undefined);
            mockGetSession.mockResolvedValue(sessionData as SessionData | null);

            const searchParams = callbackUrl ? { callbackUrl } : {};
            const result = await LoginPage({ searchParams });

            // The login page should NEVER call redirect
            expect(mockRedirect).not.toHaveBeenCalled();
            // Should always render something
            expect(result).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Validates: Requirements 3.1**
    test('property: clearSession is called exactly once when session exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            email: fc.emailAddress(),
            createdAt: fc.integer({ min: 0, max: Date.now() }),
            expiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 86400000 }),
          }),
          async (sessionData) => {
            jest.clearAllMocks();
            mockClearSession.mockResolvedValue(undefined);
            mockGetSession.mockResolvedValue(sessionData as SessionData);

            await LoginPage({ searchParams: {} });

            expect(mockClearSession).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Validates: Requirements 1.2**
    test('property: clearSession is not called when no session exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.webUrl(), { nil: undefined }),
          async (callbackUrl) => {
            jest.clearAllMocks();
            mockClearSession.mockResolvedValue(undefined);
            mockGetSession.mockResolvedValue(null);

            const searchParams = callbackUrl ? { callbackUrl } : {};
            await LoginPage({ searchParams });

            expect(mockClearSession).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
