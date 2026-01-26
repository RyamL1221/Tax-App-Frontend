/**
 * Property-Based Test for Logout-Login Round Trip
 * 
 * Feature: logout-button
 * Property 2: Logout-Login Round Trip
 * 
 * **Validates: Requirements 3.3, 3.5, 7.5**
 * 
 * This test file uses property-based testing to verify that after logging out,
 * users cannot access the dashboard and are redirected to the login page,
 * for ANY valid authenticated user state.
 * 
 * The test validates the complete round trip:
 * 1. User is authenticated with a valid session
 * 2. User performs logout
 * 3. User attempts to access dashboard
 * 4. System redirects to login page
 * 5. User remains unauthenticated until they log in again
 */

import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import DashboardPage from './page';
import { getSession } from '@/lib/session';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

// Mock session management
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  SESSION_CONFIG: {
    COOKIE_NAME: 'session_token',
    MAX_AGE: 60 * 60 * 24 * 7,
    SECURE: false,
    HTTP_ONLY: true,
    SAME_SITE: 'lax',
    PATH: '/',
  },
}));

// Mock TaxFormSelector component
jest.mock('@/components/TaxFormSelector', () => ({
  TaxFormSelector: () => <div data-testid="tax-form-selector">Tax Form Selector</div>,
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock the logout API
global.fetch = jest.fn();

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

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

describe('Property-Based Test: Logout-Login Round Trip', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    mockPush = jest.fn();
    mockRouter = {
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Reset redirect mock to throw an error (simulating Next.js redirect behavior)
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT: ${url}`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Feature: logout-button, Property 2: Logout-Login Round Trip
   * 
   * For ANY authenticated user who logs out, attempting to access the dashboard
   * should redirect to the login page, and the user should remain unauthenticated
   * until they log in again.
   * 
   * **Validates: Requirements 3.3, 3.5, 7.5**
   * 
   * This property test validates that:
   * 1. Logout successfully redirects to login page (Requirement 3.3)
   * 2. After logout, dashboard access is denied (Requirement 3.5)
   * 3. User remains unauthenticated after logout (Requirement 7.5)
   */
  test('Property 2: Logout-Login Round Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          mockPush.mockClear();
          mockRedirect.mockImplementation((url: string) => {
            throw new Error(`NEXT_REDIRECT: ${url}`);
          });

          // STEP 1: User is authenticated with a valid session
          mockGetSession.mockResolvedValue(sessionData);

          // Mock successful logout response
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
            }),
          });

          // Render the dashboard (user is authenticated)
          const { unmount } = render(<DashboardClient />);

          // Verify dashboard is accessible
          expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
          expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

          // STEP 2: User performs logout
          const logoutButton = screen.getByRole('button', { name: /log out/i });
          expect(logoutButton).toBeInTheDocument();
          
          await userEvent.click(logoutButton);

          // STEP 3: Verify logout redirects to login page (Requirement 3.3)
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          }, { timeout: 5000 });

          // Clean up the first render
          unmount();

          // STEP 4: Simulate user attempting to access dashboard after logout
          // Session should now be null (cleared by logout)
          mockGetSession.mockResolvedValue(null);

          // Attempt to access dashboard page (server component)
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

          // STEP 5: Verify redirect to login page (Requirements 3.5, 7.5)
          expect(redirectCalled).toBe(true);
          expect(redirectUrl).toBe('/login');
          expect(mockRedirect).toHaveBeenCalledWith('/login');

          // Verify user remains unauthenticated (session is null)
          expect(mockGetSession).toHaveBeenCalled();
          const finalSession = await mockGetSession.mock.results[mockGetSession.mock.results.length - 1].value;
          expect(finalSession).toBeNull();
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
   * Property: Logout clears authentication for all user types
   * 
   * For ANY authenticated user (different user IDs, emails, session ages),
   * logout should clear their authentication and prevent dashboard access.
   * 
   * **Validates: Requirements 3.3, 3.5, 7.5**
   */
  test('Property: Logout clears authentication for all user types', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        emailArbitrary,
        fc.constantFrom('new', 'mid-life', 'near-expiration'),
        async (userId, email, sessionAge) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          mockPush.mockClear();
          mockRedirect.mockImplementation((url: string) => {
            throw new Error(`NEXT_REDIRECT: ${url}`);
          });

          const now = Date.now();
          let sessionData;

          // Create session data based on age
          switch (sessionAge) {
            case 'new':
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 60000, // 1 minute ago
                expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
              };
              break;
            case 'mid-life':
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
                expiresAt: now + 4 * 24 * 60 * 60 * 1000, // 4 days from now
              };
              break;
            case 'near-expiration':
              sessionData = {
                userId: userId.trim(),
                email: email.trim(),
                createdAt: now - 6 * 24 * 60 * 60 * 1000, // 6 days ago
                expiresAt: now + 60 * 60 * 1000, // 1 hour from now
              };
              break;
          }

          // User is authenticated
          mockGetSession.mockResolvedValue(sessionData);

          // Mock successful logout
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          // Render dashboard and logout
          const { unmount } = render(<DashboardClient />);
          
          const logoutButton = screen.getByRole('button', { name: /log out/i });
          await userEvent.click(logoutButton);

          // Verify logout redirect
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          }, { timeout: 5000 });

          unmount();

          // Attempt dashboard access after logout
          mockGetSession.mockResolvedValue(null);

          let redirectCalled = false;
          try {
            await DashboardPage();
          } catch (error) {
            if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
              redirectCalled = true;
            }
          }

          // Verify redirect to login
          expect(redirectCalled).toBe(true);
          expect(mockRedirect).toHaveBeenCalledWith('/login');
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
   * Property: Multiple logout attempts maintain unauthenticated state
   * 
   * For ANY authenticated user, multiple logout attempts should maintain
   * the unauthenticated state and continue to redirect to login.
   * 
   * **Validates: Requirements 3.5, 7.5**
   */
  test('Property: Multiple logout attempts maintain unauthenticated state', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          mockPush.mockClear();
          mockRedirect.mockImplementation((url: string) => {
            throw new Error(`NEXT_REDIRECT: ${url}`);
          });

          // User is authenticated
          mockGetSession.mockResolvedValue(sessionData);

          // Mock successful logout (multiple times)
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
          });

          // First logout
          const { unmount: unmount1 } = render(<DashboardClient />);
          const logoutButton1 = screen.getByRole('button', { name: /log out/i });
          await userEvent.click(logoutButton1);

          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          }, { timeout: 5000 });

          unmount1();

          // Session is now cleared
          mockGetSession.mockResolvedValue(null);

          // Attempt dashboard access - should redirect
          let redirectCount = 0;
          
          for (let i = 0; i < 3; i++) {
            try {
              await DashboardPage();
            } catch (error) {
              if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
                redirectCount++;
              }
            }
          }

          // All attempts should redirect
          expect(redirectCount).toBe(3);
          expect(mockRedirect).toHaveBeenCalledTimes(3);
          
          // Verify all redirects went to login
          mockRedirect.mock.calls.forEach(call => {
            expect(call[0]).toBe('/login');
          });
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
   * Property: Logout-login-logout cycle works correctly
   * 
   * For ANY authenticated user, the cycle of logout -> login -> logout
   * should work correctly, with proper redirects at each step.
   * 
   * **Validates: Requirements 3.3, 3.5, 7.5**
   */
  test('Property: Logout-login-logout cycle works correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          mockPush.mockClear();
          mockRedirect.mockImplementation((url: string) => {
            throw new Error(`NEXT_REDIRECT: ${url}`);
          });

          // Mock successful logout
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
          });

          // CYCLE 1: First logout
          mockGetSession.mockResolvedValue(sessionData);
          const { unmount: unmount1 } = render(<DashboardClient />);
          const logoutButton1 = screen.getByRole('button', { name: /log out/i });
          await userEvent.click(logoutButton1);

          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          }, { timeout: 5000 });

          unmount1();

          // User is now logged out
          mockGetSession.mockResolvedValue(null);

          // Verify dashboard access is denied
          let redirect1Called = false;
          try {
            await DashboardPage();
          } catch (error) {
            if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
              redirect1Called = true;
            }
          }
          expect(redirect1Called).toBe(true);

          // CYCLE 2: User logs in again (simulate re-authentication)
          mockGetSession.mockResolvedValue(sessionData);

          // Verify dashboard is accessible again
          const { unmount: unmount2 } = render(<DashboardClient />);
          expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();

          // CYCLE 3: Second logout
          const logoutButton2 = screen.getByRole('button', { name: /log out/i });
          await userEvent.click(logoutButton2);

          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledTimes(2);
            expect(mockPush).toHaveBeenLastCalledWith('/login');
          }, { timeout: 5000 });

          unmount2();

          // User is logged out again
          mockGetSession.mockResolvedValue(null);

          // Verify dashboard access is denied again
          let redirect2Called = false;
          try {
            await DashboardPage();
          } catch (error) {
            if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
              redirect2Called = true;
            }
          }
          expect(redirect2Called).toBe(true);
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
   * Property: Dashboard never renders for logged-out users
   * 
   * For ANY user who has logged out, the dashboard should never render
   * and should always redirect to login.
   * 
   * **Validates: Requirements 3.5, 7.5**
   */
  test('Property: Dashboard never renders for logged-out users', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionDataArbitrary,
        async (sessionData) => {
          // Clear mocks for each iteration
          jest.clearAllMocks();
          mockPush.mockClear();
          mockRedirect.mockImplementation((url: string) => {
            throw new Error(`NEXT_REDIRECT: ${url}`);
          });

          // User is authenticated
          mockGetSession.mockResolvedValue(sessionData);

          // Mock successful logout
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          // Perform logout
          const { unmount } = render(<DashboardClient />);
          const logoutButton = screen.getByRole('button', { name: /log out/i });
          await userEvent.click(logoutButton);

          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
          }, { timeout: 5000 });

          unmount();

          // User is now logged out
          mockGetSession.mockResolvedValue(null);

          // Attempt to access dashboard
          let dashboardRendered = false;
          let redirectCalled = false;

          try {
            const result = await DashboardPage();
            // If we get here without redirect, check if result is null (mocked component)
            dashboardRendered = result !== null;
          } catch (error) {
            // Redirect was called (expected behavior)
            if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
              redirectCalled = true;
              dashboardRendered = false;
            }
          }

          // Dashboard should never render for logged-out users
          expect(dashboardRendered).toBe(false);
          expect(redirectCalled).toBe(true);
          expect(mockRedirect).toHaveBeenCalledWith('/login');
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
