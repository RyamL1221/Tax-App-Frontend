/**
 * Integration tests for Navbar component in application layout
 * 
 * These tests verify that the navbar integrates correctly with the application
 * layout and appears consistently across different pages with proper JWT authentication handling.
 * 
 * Requirements:
 * - 1.2: Navbar is visible across all pages of the application
 * - 4.1: Auth state changes update navbar display (authenticated to unauthenticated)
 * - 4.2: Auth state changes update navbar display (unauthenticated to authenticated)
 */

import { render, screen, waitFor } from '@testing-library/react';
import * as AuthCoordinator from '@/lib/auth/AuthCoordinator';
import Navbar from './Navbar';

// Mock AuthCoordinator
jest.mock('@/lib/auth/AuthCoordinator');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

import { useRouter } from 'next/navigation';

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Navbar Integration Tests', () => {
  const mockGetAuthState = AuthCoordinator.getAuthState as jest.MockedFunction<typeof AuthCoordinator.getAuthState>;
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useRouter
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  describe('Navbar renders on multiple pages', () => {
    it('should render navbar with unauthenticated state', async () => {
      // Mock no JWT token (unauthenticated)
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      // Render the Navbar component (as it would appear in layout)
      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Verify navbar is rendered
        expect(container.querySelector('nav')).toBeInTheDocument();

        // Verify unauthenticated links are present
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
      });
    });

    it('should render navbar with authenticated state', async () => {
      // Mock valid JWT token (authenticated)
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      // Render the Navbar component
      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Verify navbar is rendered
        expect(container.querySelector('nav')).toBeInTheDocument();

        // Verify authenticated links are present
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();

        // Verify unauthenticated links are NOT present
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
        expect(screen.queryByText('Register')).not.toBeInTheDocument();
      });
    });

    it('should render navbar consistently across different page contexts', async () => {
      // Mock authenticated JWT token
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'user-456',
        email: 'user@test.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      // Render navbar multiple times (simulating different pages)
      const { container: container1 } = render(<Navbar />);
      const { container: container2 } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Both should have the same structure
        expect(container1.querySelector('nav')).toBeInTheDocument();
        expect(container2.querySelector('nav')).toBeInTheDocument();

        // Both should show authenticated state
        const allHomeLinks = screen.getAllByText('Home');
        const allDashboardLinks = screen.getAllByText('Dashboard');
        
        expect(allHomeLinks).toHaveLength(2); // One for each render
        expect(allDashboardLinks).toHaveLength(2); // One for each render
      });
    });
  });

  describe('Navigation between pages works correctly', () => {
    it('should have correct href attributes for navigation links (unauthenticated)', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Get all links
        const links = container.querySelectorAll('a');
        const linkArray = Array.from(links);

        // Find specific links by their text content
        const homeLink = linkArray.find(link => link.textContent === 'Home');
        const loginLink = linkArray.find(link => link.textContent === 'Login');
        const registerLink = linkArray.find(link => link.textContent === 'Register');

        // Verify href attributes
        expect(homeLink).toHaveAttribute('href', '/');
        expect(loginLink).toHaveAttribute('href', '/login');
        expect(registerLink).toHaveAttribute('href', '/register');
      });
    });

    it('should have correct href attributes for navigation links (authenticated)', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'user-789',
        email: 'authenticated@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Get all links
        const links = container.querySelectorAll('a');
        const linkArray = Array.from(links);

        // Find specific links by their text content
        const homeLink = linkArray.find(link => link.textContent === 'Home');
        const dashboardLink = linkArray.find(link => link.textContent === 'Dashboard');

        // Verify href attributes
        expect(homeLink).toHaveAttribute('href', '/');
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });

    it('should render all navigation links as anchor elements for proper routing', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // All navigation items should be anchor elements
        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(0);

        // Each link should have an href attribute
        links.forEach(link => {
          expect(link).toHaveAttribute('href');
        });
      });
    });
  });

  describe('Auth state changes update navbar display', () => {
    it('should update navbar when auth state changes from unauthenticated to authenticated', async () => {
      // First render: unauthenticated
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { unmount: unmount1 } = render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });

      unmount1();

      // Second render: authenticated (simulating auth state change)
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'new-user',
        email: 'newuser@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      render(<Navbar />);

      // Wait for async auth state loading and verify authenticated state
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
        expect(screen.queryByText('Register')).not.toBeInTheDocument();
      });
    });

    it('should update navbar when auth state changes from authenticated to unauthenticated', async () => {
      // First render: authenticated
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'existing-user',
        email: 'existing@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { unmount: unmount1 } = render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
        expect(screen.queryByText('Register')).not.toBeInTheDocument();
      });

      unmount1();

      // Second render: unauthenticated (simulating logout)
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<Navbar />);

      // Wait for async auth state loading and verify unauthenticated state
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });

    it('should maintain Home link across auth state changes', async () => {
      // Render with unauthenticated state
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { unmount: unmount1 } = render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      unmount1();

      // Render with authenticated state
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'user-123',
        email: 'user@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      render(<Navbar />);

      // Wait for async auth state loading and verify Home link still present
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });
    });

    it('should handle auth state errors gracefully and show unauthenticated state', async () => {
      // Mock getAuthState to throw an error
      mockGetAuthState.mockRejectedValue(
        new Error('Auth state retrieval failed')
      );

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Navbar />);

      // Wait for async auth state loading and verify unauthenticated state (error handling)
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[NavbarClient] Error checking auth state:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Navbar positioning and structure', () => {
    it('should render navbar as a nav element at the top level', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Should have a nav element
        const navElement = container.querySelector('nav');
        expect(navElement).toBeInTheDocument();
        expect(navElement?.tagName).toBe('NAV');
      });
    });

    it('should have proper semantic structure for accessibility', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<Navbar />);

      // Wait for async auth state loading
      await waitFor(() => {
        // Nav element should contain links
        const navElement = container.querySelector('nav');
        const links = navElement?.querySelectorAll('a');
        
        expect(links).toBeDefined();
        expect(links!.length).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent structure across different auth states', async () => {
      // Test unauthenticated structure
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container: container1, unmount: unmount1 } = render(<Navbar />);

      await waitFor(() => {
        const nav1 = container1.querySelector('nav');
        expect(nav1).toBeInTheDocument();
      });

      const nav1 = container1.querySelector('nav');
      unmount1();

      // Test authenticated structure
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'user-abc',
        email: 'user@test.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { container: container2 } = render(<Navbar />);

      await waitFor(() => {
        const nav2 = container2.querySelector('nav');
        expect(nav2).toBeInTheDocument();

        // Both should have the same nav element structure
        expect(nav1?.tagName).toBe(nav2?.tagName);
      });
    });
  });
});
