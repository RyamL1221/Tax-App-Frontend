/**
 * Unit tests for Register Page Server Component
 * 
 * Tests that the register page:
 * - Renders RegisterPageClient when no session exists
 * - Is accessible at /register route
 * - Redirects authenticated users to dashboard
 * 
 * **Validates: Requirements 10.3, 10.4**
 */

import * as fc from 'fast-check';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock the RegisterPageClient component
jest.mock('./RegisterPageClient', () => {
  return function MockRegisterPageClient() {
    return <div data-testid="register-page-client">Register Page Client</div>;
  };
});

// Import the page component after mocks are set up
import RegisterPage from '../page';

describe('Register Page Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    test('renders RegisterPageClient when no session token exists', async () => {
      // Arrange: Mock cookies to return no session token
      const mockCookieStore = {
        get: jest.fn((name: string) => {
          if (name === 'session_token') {
            return undefined; // No session token
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Mock redirect to track if it was called
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

      // Act: Call the page component
      const result = await RegisterPage({ searchParams: {} });

      // Assert: Redirect should NOT have been called
      expect(mockRedirect).not.toHaveBeenCalled();
      
      // Should render the register page client
      expect(result).toBeDefined();
      expect(result.type.name).toBe('MockRegisterPageClient');
      
      // Verify session token was checked
      expect(mockCookieStore.get).toHaveBeenCalledWith('session_token');
    });

    test('redirects authenticated users to dashboard', async () => {
      // Arrange: Mock cookies to return a valid session token
      const mockCookieStore = {
        get: jest.fn((name: string) => {
          if (name === 'session_token') {
            return { value: 'valid-session-token' };
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Mock redirect to track if it was called
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT'); // Next.js redirect throws
      });

      // Act & Assert: Calling the page should trigger redirect
      try {
        await RegisterPage({ searchParams: {} });
        // If we reach here, redirect was not called - test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        // Redirect should have been called
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
        expect(error.message).toBe('NEXT_REDIRECT');
      }

      // Verify session token was checked
      expect(mockCookieStore.get).toHaveBeenCalledWith('session_token');
    });

    test('uses callbackUrl when provided for authenticated users', async () => {
      const callbackUrl = '/profile';
      
      // Arrange: Mock cookies to return a valid session token
      const mockCookieStore = {
        get: jest.fn((name: string) => {
          if (name === 'session_token') {
            return { value: 'valid-session-token' };
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT');
      });

      // Act & Assert
      try {
        await RegisterPage({ searchParams: { callbackUrl } });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(mockRedirect).toHaveBeenCalledWith(callbackUrl);
        expect(error.message).toBe('NEXT_REDIRECT');
      }
    });

    test('does not redirect users with empty session token', async () => {
      // Arrange: Mock cookies to return empty session token
      const mockCookieStore = {
        get: jest.fn((name: string) => {
          if (name === 'session_token') {
            return { value: '' }; // Empty session token
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

      // Act: Call the page component
      const result = await RegisterPage({ searchParams: {} });

      // Assert: Redirect should NOT have been called (empty string is falsy)
      expect(mockRedirect).not.toHaveBeenCalled();
      
      // Should render the register page client
      expect(result).toBeDefined();
      
      // Verify session token was checked
      expect(mockCookieStore.get).toHaveBeenCalledWith('session_token');
    });

    test('passes callbackUrl to RegisterPageClient', async () => {
      const callbackUrl = '/custom-redirect';
      
      // Arrange: Mock cookies to return no session token
      const mockCookieStore = {
        get: jest.fn(() => undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Act: Call the page component with callbackUrl
      const result = await RegisterPage({ searchParams: { callbackUrl } });

      // Assert: RegisterPageClient should receive the callbackUrl
      expect(result).toBeDefined();
      expect(result.props.callbackUrl).toBe(callbackUrl);
    });
  });

  describe('Property-Based Tests', () => {
    test('property: any user with a valid session token is redirected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary session tokens (non-empty strings)
          fc.string({ minLength: 1, maxLength: 100 }),
          // Generate optional callback URLs
          fc.option(fc.webUrl(), { nil: undefined }),
          async (sessionToken, callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock cookies to return a valid session token
            const mockCookieStore = {
              get: jest.fn((name: string) => {
                if (name === 'session_token') {
                  return { value: sessionToken };
                }
                return undefined;
              }),
            };
            (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

            // Mock redirect
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
            mockRedirect.mockImplementation(() => {
              throw new Error('NEXT_REDIRECT');
            });

            // Prepare search params
            const searchParams = callbackUrl ? { callbackUrl } : {};

            // Act & Assert: Calling the page should trigger redirect
            try {
              await RegisterPage({ searchParams });
              expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
              // Redirect should have been called
              expect(mockRedirect).toHaveBeenCalledTimes(1);
              
              // Verify redirect URL is correct
              const expectedUrl = callbackUrl || '/dashboard';
              expect(mockRedirect).toHaveBeenCalledWith(expectedUrl);
              
              // Verify error is from redirect
              expect(error.message).toBe('NEXT_REDIRECT');
            }

            // Verify session token was checked
            expect(mockCookieStore.get).toHaveBeenCalledWith('session_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: users without session tokens are not redirected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate optional callback URLs
          fc.option(fc.webUrl(), { nil: undefined }),
          async (callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock cookies to return no session token
            const mockCookieStore = {
              get: jest.fn(() => undefined),
            };
            (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

            // Mock redirect
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

            // Prepare search params
            const searchParams = callbackUrl ? { callbackUrl } : {};

            // Act: Call the page component
            const result = await RegisterPage({ searchParams });

            // Assert: Redirect should NOT have been called
            expect(mockRedirect).not.toHaveBeenCalled();
            
            // Should render the register page client
            expect(result).toBeDefined();
            
            // Verify session token was checked
            expect(mockCookieStore.get).toHaveBeenCalledWith('session_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
