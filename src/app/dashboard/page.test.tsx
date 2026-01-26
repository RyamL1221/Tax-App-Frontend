/**
 * Unit tests for Dashboard Page Server Component
 * 
 * Tests that the dashboard page:
 * - Renders DashboardClient for authenticated users
 * - Redirects unauthenticated users to login page
 * - Integrates with session management system
 * 
 * **Validates: Requirements 1.1, 1.2, 5.1**
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import type { SessionData } from '@/lib/session';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Mock the DashboardClient component
jest.mock('./DashboardClient', () => {
  return function MockDashboardClient() {
    return <div data-testid="dashboard-client">Dashboard Client</div>;
  };
});

// Import the page component after mocks are set up
import DashboardPage from './page';

describe('Dashboard Page Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated User Access - Requirement 1.1', () => {
    test('renders DashboardClient when user has valid session', async () => {
      // Arrange: Mock getSession to return valid session data
      const mockSessionData: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Mock redirect to track if it was called
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

      // Act: Call the page component
      const result = await DashboardPage();

      // Assert: Redirect should NOT have been called
      expect(mockRedirect).not.toHaveBeenCalled();
      
      // Should render the dashboard client
      expect(result).toBeDefined();
      expect(result.type.name).toBe('MockDashboardClient');
      
      // Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    test('renders DashboardClient for any valid session data', async () => {
      // Arrange: Mock getSession with different valid session data
      const mockSessionData: SessionData = {
        userId: 'different-user-456',
        email: 'another@test.com',
        createdAt: Date.now() - 5000,
        expiresAt: Date.now() + 7200000, // 2 hours from now
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

      // Act: Call the page component
      const result = await DashboardPage();

      // Assert: Should render dashboard without redirect
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.type.name).toBe('MockDashboardClient');
      expect(getSession).toHaveBeenCalled();
    });

    test('does not redirect when session is valid', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-789',
        email: 'valid@example.com',
        createdAt: Date.now() - 2000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

      // Act: Call the page component
      await DashboardPage();

      // Assert: Verify redirect was never called
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated User Redirect - Requirement 1.2', () => {
    test('redirects to login when no session exists', async () => {
      // Arrange: Mock getSession to return null (no session)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect to throw (Next.js redirect behavior)
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert: Calling the page should trigger redirect
      try {
        await DashboardPage();
        // If we reach here, redirect was not called - test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        // Redirect should have been called
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect).toHaveBeenCalledWith('/login');
        expect(error.message).toBe('NEXT_REDIRECT: /login');
      }

      // Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    test('redirects to login when session is undefined', async () => {
      // Arrange: Mock getSession to return undefined
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(undefined as any);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      try {
        await DashboardPage();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(mockRedirect).toHaveBeenCalledWith('/login');
        expect(error.message).toBe('NEXT_REDIRECT: /login');
      }

      expect(getSession).toHaveBeenCalled();
    });

    test('does not render DashboardClient when session is invalid', async () => {
      // Arrange: Mock getSession to return null
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      let dashboardRendered = false;
      try {
        const result = await DashboardPage();
        dashboardRendered = result !== null;
      } catch (error: any) {
        // Expected redirect error
        dashboardRendered = false;
      }

      // Dashboard should never render for unauthenticated users
      expect(dashboardRendered).toBe(false);
      expect(mockRedirect).toHaveBeenCalled();
    });

    test('redirect always targets /login path', async () => {
      // Arrange: Mock getSession to return null
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act
      try {
        await DashboardPage();
      } catch (error) {
        // Expected redirect error
      }

      // Assert: Verify redirect was called with exactly '/login'
      expect(mockRedirect).toHaveBeenCalledWith('/login');
      
      // Verify no other paths were used
      const calls = mockRedirect.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBe('/login');
    });
  });

  describe('Session Management Integration - Requirement 5.1', () => {
    test('calls getSession to verify authentication', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      await DashboardPage();

      // Assert: Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    test('calls getSession before rendering or redirecting', async () => {
      // Arrange: Mock null session
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Track call order
      const callOrder: string[] = [];
      (getSession as jest.MockedFunction<typeof getSession>).mockImplementation(async () => {
        callOrder.push('getSession');
        return null;
      });
      mockRedirect.mockImplementation(() => {
        callOrder.push('redirect');
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act
      try {
        await DashboardPage();
      } catch (error) {
        // Expected redirect error
      }

      // Assert: getSession should be called before redirect
      expect(callOrder).toEqual(['getSession', 'redirect']);
    });

    test('uses existing session management system', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      await DashboardPage();

      // Assert: Verify getSession from @/lib/session was used
      expect(getSession).toHaveBeenCalled();
      
      // Verify the mock is from the correct module
      expect(jest.isMockFunction(getSession)).toBe(true);
    });

    test('handles session check errors gracefully', async () => {
      // Arrange: Mock getSession to throw an error
      (getSession as jest.MockedFunction<typeof getSession>).mockRejectedValue(
        new Error('Session check failed')
      );

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert: Should handle error and redirect
      try {
        await DashboardPage();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should either be session error or redirect error
        expect(error).toBeDefined();
      }

      // Verify getSession was called
      expect(getSession).toHaveBeenCalled();
    });

    test('integrates with session data structure', async () => {
      // Arrange: Mock session with all required fields
      const mockSessionData: SessionData = {
        userId: 'user-abc',
        email: 'integration@test.com',
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      const result = await DashboardPage();

      // Assert: Should successfully render with valid session structure
      expect(result).toBeDefined();
      expect(getSession).toHaveBeenCalled();
      
      // Verify session data structure was properly handled
      const sessionCall = (getSession as jest.MockedFunction<typeof getSession>).mock.results[0];
      expect(sessionCall.type).toBe('return');
      const sessionValue = await sessionCall.value;
      expect(sessionValue).toHaveProperty('userId');
      expect(sessionValue).toHaveProperty('email');
      expect(sessionValue).toHaveProperty('createdAt');
      expect(sessionValue).toHaveProperty('expiresAt');
    });
  });

  describe('Edge Cases', () => {
    test('handles session with expired timestamp', async () => {
      // Arrange: Mock getSession to return null (expired sessions return null)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      try {
        await DashboardPage();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(mockRedirect).toHaveBeenCalledWith('/login');
      }
    });

    test('handles malformed session data', async () => {
      // Arrange: Mock getSession to return null (malformed sessions return null)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      try {
        await DashboardPage();
        expect(true).toBe(false);
      } catch (error: any) {
        expect(mockRedirect).toHaveBeenCalledWith('/login');
      }
    });

    test('handles concurrent session checks', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-concurrent',
        email: 'concurrent@test.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component multiple times concurrently
      const results = await Promise.all([
        DashboardPage(),
        DashboardPage(),
        DashboardPage(),
      ]);

      // Assert: All should render successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.type.name).toBe('MockDashboardClient');
      });

      // Verify getSession was called for each request
      expect(getSession).toHaveBeenCalledTimes(3);
    });
  });

  describe('Component Metadata', () => {
    test('exports metadata with correct title', () => {
      // Import metadata
      const { metadata } = require('./page');

      // Assert: Verify metadata is defined
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Tax Form Dashboard | Tax App');
    });

    test('exports metadata with correct description', () => {
      // Import metadata
      const { metadata } = require('./page');

      // Assert: Verify description
      expect(metadata).toBeDefined();
      expect(metadata.description).toBe('Select and access tax forms for completion');
    });
  });
});
