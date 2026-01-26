/**
 * Integration tests for Navbar component in application layout
 * 
 * These tests verify that the navbar integrates correctly with the application
 * layout and appears consistently across different pages with proper session handling.
 * 
 * Requirements:
 * - 1.2: Navbar is visible across all pages of the application
 * - 4.1: Session state changes update navbar display (authenticated to unauthenticated)
 * - 4.2: Session state changes update navbar display (unauthenticated to authenticated)
 */

import { render, screen } from '@testing-library/react';
import { getSession } from '@/lib/session';
import Navbar from './Navbar';

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Navbar Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navbar renders on multiple pages', () => {
    it('should render navbar with unauthenticated state', async () => {
      // Mock no session (unauthenticated)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      // Render the Navbar component (as it would appear in layout)
      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

      // Verify navbar is rendered
      expect(container.querySelector('nav')).toBeInTheDocument();

      // Verify unauthenticated links are present
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should render navbar with authenticated state', async () => {
      // Mock valid session (authenticated)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'test-user-123',
        email: 'test@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      });

      // Render the Navbar component
      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

      // Verify navbar is rendered
      expect(container.querySelector('nav')).toBeInTheDocument();

      // Verify authenticated links are present
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Verify unauthenticated links are NOT present
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should render navbar consistently across different page contexts', async () => {
      // Mock authenticated session
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'user-456',
        email: 'user@test.com',
        createdAt: Date.now() - 5000,
        expiresAt: Date.now() + 7200000,
      });

      // Render navbar multiple times (simulating different pages)
      const NavbarComponent1 = await Navbar();
      const { container: container1 } = render(NavbarComponent1);

      const NavbarComponent2 = await Navbar();
      const { container: container2 } = render(NavbarComponent2);

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

  describe('Navigation between pages works correctly', () => {
    it('should have correct href attributes for navigation links (unauthenticated)', async () => {
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

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

    it('should have correct href attributes for navigation links (authenticated)', async () => {
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'user-789',
        email: 'authenticated@example.com',
        createdAt: Date.now() - 2000,
        expiresAt: Date.now() + 5400000,
      });

      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

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

    it('should render all navigation links as anchor elements for proper routing', async () => {
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

      // All navigation items should be anchor elements
      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);

      // Each link should have an href attribute
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Session state changes update navbar display', () => {
    it('should update navbar when session changes from unauthenticated to authenticated', async () => {
      // First render: unauthenticated
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);
      const NavbarComponent1 = await Navbar();
      const { unmount: unmount1 } = render(NavbarComponent1);

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

      unmount1();

      // Second render: authenticated (simulating session state change)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'new-user',
        email: 'newuser@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      const NavbarComponent2 = await Navbar();
      render(NavbarComponent2);

      // Should now show authenticated state
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should update navbar when session changes from authenticated to unauthenticated', async () => {
      // First render: authenticated
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'existing-user',
        email: 'existing@example.com',
        createdAt: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      });
      const NavbarComponent1 = await Navbar();
      const { unmount: unmount1 } = render(NavbarComponent1);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();

      unmount1();

      // Second render: unauthenticated (simulating logout)
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);
      const NavbarComponent2 = await Navbar();
      render(NavbarComponent2);

      // Should now show unauthenticated state
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('should maintain Home link across session state changes', async () => {
      // Render with unauthenticated state
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);
      const NavbarComponent1 = await Navbar();
      const { unmount: unmount1 } = render(NavbarComponent1);

      expect(screen.getByText('Home')).toBeInTheDocument();
      unmount1();

      // Render with authenticated state
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'user-123',
        email: 'user@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      const NavbarComponent2 = await Navbar();
      render(NavbarComponent2);

      // Home link should still be present
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle session errors gracefully and show unauthenticated state', async () => {
      // Mock getSession to throw an error
      (getSession as jest.MockedFunction<typeof getSession>).mockRejectedValue(
        new Error('Session retrieval failed')
      );

      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const NavbarComponent = await Navbar();
      render(NavbarComponent);

      // Should show unauthenticated state (error handling)
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to retrieve session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Navbar positioning and structure', () => {
    it('should render navbar as a nav element at the top level', async () => {
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

      // Should have a nav element
      const navElement = container.querySelector('nav');
      expect(navElement).toBeInTheDocument();
      expect(navElement?.tagName).toBe('NAV');
    });

    it('should have proper semantic structure for accessibility', async () => {
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

      const NavbarComponent = await Navbar();
      const { container } = render(NavbarComponent);

      // Nav element should contain links
      const navElement = container.querySelector('nav');
      const links = navElement?.querySelectorAll('a');
      
      expect(links).toBeDefined();
      expect(links!.length).toBeGreaterThan(0);
    });

    it('should maintain consistent structure across different session states', async () => {
      // Test unauthenticated structure
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);
      const NavbarComponent1 = await Navbar();
      const { container: container1, unmount: unmount1 } = render(NavbarComponent1);

      const nav1 = container1.querySelector('nav');
      expect(nav1).toBeInTheDocument();

      unmount1();

      // Test authenticated structure
      (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue({
        userId: 'user-abc',
        email: 'user@test.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      const NavbarComponent2 = await Navbar();
      const { container: container2 } = render(NavbarComponent2);

      const nav2 = container2.querySelector('nav');
      expect(nav2).toBeInTheDocument();

      // Both should have the same nav element structure
      expect(nav1?.tagName).toBe(nav2?.tagName);
    });
  });
});
