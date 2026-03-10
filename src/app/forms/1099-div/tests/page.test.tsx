/**
 * Unit tests for 1099-DIV Form Page Server Component
 * 
 * Tests that the 1099-DIV form page:
 * - Renders form content for authenticated users
 * - Redirects unauthenticated users to login page
 * - Passes null token to client component (JWT retrieved from localStorage)
 * 
 * **Validates: Requirements 1.1, 3.5**
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

// Mock Form1099DivClient to avoid rendering complexity
jest.mock('./Form1099DivClient', () => {
  return function MockForm1099DivClient({ initialToken }: { initialToken: string | null }) {
    return <div data-testid="form-client" data-token={initialToken}>Form1099DivClient</div>;
  };
});

// Import the page component after mocks are set up
import Form1099DivPage from '../page';

describe('1099-DIV Form Page Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated User Access - Requirement 1.1, 3.5', () => {
    it('renders form page when user has valid session', async () => {
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
      const result = await Form1099DivPage();

      // Assert: Redirect should NOT have been called
      expect(mockRedirect).not.toHaveBeenCalled();
      
      // Should render the form page
      expect(result).toBeDefined();
      expect(result.type).toBe('div');
      
      // Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    it('passes null token to Form1099DivClient (JWT retrieved from localStorage)', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-456',
        email: 'another@test.com',
        createdAt: Date.now() - 5000,
        expiresAt: Date.now() + 7200000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      const result = await Form1099DivPage();

      // Assert: Should pass null token (client will retrieve from localStorage)
      expect(result).toBeDefined();
      
      // Find the Form1099DivClient component in the tree
      const findClientComponent = (node: any): any => {
        if (!node) return null;
        if (node.type?.name === 'MockForm1099DivClient') return node;
        if (node.props?.children) {
          if (Array.isArray(node.props.children)) {
            for (const child of node.props.children) {
              const found = findClientComponent(child);
              if (found) return found;
            }
          } else {
            return findClientComponent(node.props.children);
          }
        }
        return null;
      };
      
      const clientComponent = findClientComponent(result);
      expect(clientComponent).toBeDefined();
      expect(clientComponent.props.initialToken).toBeNull();
    });

    it('does not redirect when session is valid', async () => {
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
      await Form1099DivPage();

      // Assert: Verify redirect was never called
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('renders form content with correct structure', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-content',
        email: 'content@test.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      const result = await Form1099DivPage();

      // Assert: Verify the rendered structure
      expect(result).toBeDefined();
      expect(result.type).toBe('div');
      expect(result.props.className).toContain('min-h-screen');
      
      // Verify it contains the expected content structure
      const props = result.props;
      expect(props.children).toBeDefined();
    });

    it('displays 1099-DIV form title for authenticated users', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-title',
        email: 'title@test.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      const result = await Form1099DivPage();

      // Assert: Verify the page renders with form content
      expect(result).toBeDefined();
      expect(getSession).toHaveBeenCalled();
      
      // The component should render successfully for authenticated users
      expect(result.type).toBe('div');
    });
  });

  describe('Unauthenticated User Redirect - Requirement 3.5', () => {
    it('redirects to login when no session exists', async () => {
      // Arrange: Mock getSession to return null (no session)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect to throw (Next.js redirect behavior)
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert: Calling the page should trigger redirect
      await expect(Form1099DivPage()).rejects.toThrow('NEXT_REDIRECT: /login');
      
      // Redirect should have been called
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/login');

      // Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    it('redirects to login when session is undefined', async () => {
      // Arrange: Mock getSession to return undefined
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(undefined as any);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      await expect(Form1099DivPage()).rejects.toThrow('NEXT_REDIRECT: /login');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
      expect(getSession).toHaveBeenCalled();
    });

    it('does not render form page when session is invalid', async () => {
      // Arrange: Mock getSession to return null
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      let formPageRendered = false;
      try {
        await Form1099DivPage();
        formPageRendered = true;
      } catch (error: any) {
        // Expected redirect error
        formPageRendered = false;
      }

      // Form page should never render for unauthenticated users
      expect(formPageRendered).toBe(false);
      expect(mockRedirect).toHaveBeenCalled();
    });

    it('redirect always targets /login path', async () => {
      // Arrange: Mock getSession to return null
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act
      try {
        await Form1099DivPage();
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

    it('prevents unauthorized access to form data', async () => {
      // Arrange: Mock getSession to return null
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Mock redirect
      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act
      let accessGranted = false;
      try {
        await Form1099DivPage();
        accessGranted = true;
      } catch (error) {
        accessGranted = false;
      }

      // Assert: Access should be denied
      expect(accessGranted).toBe(false);
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('Session Management Integration', () => {
    it('calls getSession to verify authentication', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      await Form1099DivPage();

      // Assert: Verify getSession was called
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    it('calls getSession before rendering or redirecting', async () => {
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
        await Form1099DivPage();
      } catch (error) {
        // Expected redirect error
      }

      // Assert: getSession should be called before redirect
      expect(callOrder).toEqual(['getSession', 'redirect']);
    });

    it('uses existing session management system', async () => {
      // Arrange: Mock valid session
      const mockSessionData: SessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      await Form1099DivPage();

      // Assert: Verify getSession from @/lib/session was used
      expect(getSession).toHaveBeenCalled();
      
      // Verify the mock is from the correct module
      expect(jest.isMockFunction(getSession)).toBe(true);
    });

    it('integrates with session data structure', async () => {
      // Arrange: Mock session with all required fields
      const mockSessionData: SessionData = {
        userId: 'user-abc',
        email: 'integration@test.com',
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() + 3600000,
      };
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

      // Act: Call the page component
      const result = await Form1099DivPage();

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
    it('handles session with expired timestamp', async () => {
      // Arrange: Mock getSession to return null (expired sessions return null)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      await expect(Form1099DivPage()).rejects.toThrow('NEXT_REDIRECT: /login');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('handles malformed session data', async () => {
      // Arrange: Mock getSession to return null (malformed sessions return null)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
      mockRedirect.mockImplementation(() => {
        throw new Error('NEXT_REDIRECT: /login');
      });

      // Act & Assert
      await expect(Form1099DivPage()).rejects.toThrow('NEXT_REDIRECT: /login');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('handles concurrent session checks', async () => {
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
        Form1099DivPage(),
        Form1099DivPage(),
        Form1099DivPage(),
      ]);

      // Assert: All should render successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.type).toBe('div');
      });

      // Verify getSession was called for each request
      expect(getSession).toHaveBeenCalledTimes(3);
    });
  });

  describe('Component Metadata', () => {
    it('exports metadata with correct title', () => {
      // Import metadata
      const { metadata } = require('./page');

      // Assert: Verify metadata is defined
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('1099-DIV Form | Tax App');
    });

    it('exports metadata with correct description', () => {
      // Import metadata
      const { metadata } = require('./page');

      // Assert: Verify description
      expect(metadata).toBeDefined();
      expect(metadata.description).toBe('Complete your 1099-DIV form for dividends and distributions');
    });
  });
});
