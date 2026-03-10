/**
 * Unit tests for NavbarClient component
 * 
 * Tests verify:
 * - Component rendering with no JWT token (unauthenticated)
 * - Component rendering with JWT token (authenticated)
 * - Home link present in both states
 * - Link href attributes are correct
 * - Login and Register links only shown when unauthenticated
 * - Dashboard link only shown when authenticated
 * - Keyboard accessibility
 * - AuthCoordinator integration
 */

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import NavbarClient from '../NavbarClient';
import * as AuthCoordinator from '@/lib/auth/AuthCoordinator';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthCoordinator
jest.mock('@/lib/auth/AuthCoordinator');

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

import { useRouter } from 'next/navigation';

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('NavbarClient', () => {
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

  afterEach(() => {
    cleanup();
  });

  describe('Unauthenticated State (no JWT token)', () => {
    beforeEach(() => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });
    });

    it('should render Home link', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });

    it('should render Login link with correct href', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /login/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });

    it('should render Register link with correct href', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const registerLink = screen.getByRole('link', { name: /register/i });
        expect(registerLink).toBeInTheDocument();
        expect(registerLink).toHaveAttribute('href', '/register');
      });
    });

    it('should NOT render Dashboard link', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const dashboardLink = screen.queryByRole('link', { name: /dashboard/i });
        expect(dashboardLink).not.toBeInTheDocument();
      });
    });

    it('should NOT render LogoutButton', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const logoutButton = screen.queryByRole('button', { name: /log out/i });
        expect(logoutButton).not.toBeInTheDocument();
      });
    });

    it('should render exactly 3 links (Home, Login, Register)', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const allLinks = screen.getAllByRole('link');
        expect(allLinks).toHaveLength(3);
      });
    });
  });

  describe('Authenticated State (JWT token present)', () => {
    beforeEach(() => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });
    });

    it('should render Home link', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });

    it('should render Dashboard link with correct href', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });

    it('should render LogoutButton when authenticated', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: /log out/i });
        expect(logoutButton).toBeInTheDocument();
      });
    });

    it('should NOT render Login link', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const loginLink = screen.queryByRole('link', { name: /^login$/i });
        expect(loginLink).not.toBeInTheDocument();
      });
    });

    it('should NOT render Register link', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const registerLink = screen.queryByRole('link', { name: /^register$/i });
        expect(registerLink).not.toBeInTheDocument();
      });
    });

    it('should render exactly 2 links (Home, Dashboard) and LogoutButton', async () => {
      render(<NavbarClient />);

      await waitFor(() => {
        const allLinks = screen.getAllByRole('link');
        expect(allLinks).toHaveLength(2);
        
        // Verify LogoutButton is present
        const logoutButton = screen.getByRole('button', { name: /log out/i });
        expect(logoutButton).toBeInTheDocument();
      });
    });
  });

  describe('Link Attributes', () => {
    it('should have correct href for Home link', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });

    it('should have correct href for Login link when unauthenticated', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /login/i });
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });

    it('should have correct href for Register link when unauthenticated', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const registerLink = screen.getByRole('link', { name: /register/i });
        expect(registerLink).toHaveAttribute('href', '/register');
      });
    });

    it('should have correct href for Dashboard link when authenticated', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should render all links as anchor elements (unauthenticated)', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const allLinks = screen.getAllByRole('link');
        allLinks.forEach(link => {
          expect(link.tagName).toBe('A');
          expect(link).toHaveAttribute('href');
        });
      });
    });

    it('should render all links as anchor elements (authenticated)', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const allLinks = screen.getAllByRole('link');
        allLinks.forEach(link => {
          expect(link.tagName).toBe('A');
          expect(link).toHaveAttribute('href');
        });
      });
    });

    it('should have proper link role for accessibility', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        const homeLink = screen.getByRole('link', { name: /home/i });
        const loginLink = screen.getByRole('link', { name: /login/i });
        const registerLink = screen.getByRole('link', { name: /register/i });

        expect(homeLink).toBeInTheDocument();
        expect(loginLink).toBeInTheDocument();
        expect(registerLink).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('should render a nav element', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<NavbarClient />);

      await waitFor(() => {
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
      });
    });

    it('should have consistent structure for unauthenticated state', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { container } = render(<NavbarClient />);

      await waitFor(() => {
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();

        // Should have Home, Login, and Register links
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(3);
      });
    });

    it('should have consistent structure for authenticated state', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { container } = render(<NavbarClient />);

      await waitFor(() => {
        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();

        // Should have Home and Dashboard links
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        
        // Should have LogoutButton
        const logoutButton = screen.getByRole('button', { name: /log out/i });
        expect(logoutButton).toBeInTheDocument();
      });
    });
  });

  describe('Authentication State Transitions', () => {
    it('should update from unauthenticated to authenticated', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { unmount } = render(<NavbarClient />);

      // Initial unauthenticated state
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      });

      // Unmount and update mock for authenticated state
      unmount();
      
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      // Remount with new auth state
      render(<NavbarClient />);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
      });
    });

    it('should update from authenticated to unauthenticated', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { unmount } = render(<NavbarClient />);

      // Initial authenticated state
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
      });

      // Unmount and update mock for unauthenticated state
      unmount();
      
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      // Remount with new auth state
      render(<NavbarClient />);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      });
    });

    it('should maintain Home link across state transitions', async () => {
      // Test unauthenticated state
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      const { unmount: unmount1 } = render(<NavbarClient />);

      // Home link in unauthenticated state
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      });

      unmount1();

      // Test authenticated state
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      const { unmount: unmount2 } = render(<NavbarClient />);
      
      await waitFor(() => {
        const homeLinks = screen.getAllByRole('link', { name: /home/i });
        expect(homeLinks.length).toBeGreaterThanOrEqual(1);
        expect(homeLinks[0]).toBeInTheDocument();
      });

      unmount2();

      // Test back to unauthenticated state
      mockGetAuthState.mockResolvedValue({
        hasSession: false,
        hasJWT: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        inFallbackMode: false,
        authMethod: 'none',
      });

      render(<NavbarClient />);
      
      await waitFor(() => {
        const homeLinks = screen.getAllByRole('link', { name: /home/i });
        expect(homeLinks.length).toBeGreaterThanOrEqual(1);
        expect(homeLinks[0]).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle AuthCoordinator error gracefully', async () => {
      mockGetAuthState.mockRejectedValue(new Error('Auth check failed'));

      render(<NavbarClient />);

      // Should default to unauthenticated state on error
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      });
    });

    it('should handle JWT present with session', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: true,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: false,
        authMethod: 'jwt',
      });

      render(<NavbarClient />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      });
    });

    it('should handle fallback mode (no JWT, only session)', async () => {
      mockGetAuthState.mockResolvedValue({
        hasSession: true,
        hasJWT: false,
        isAuthenticated: true,
        userId: 'test-user-123',
        email: 'test@example.com',
        inFallbackMode: true,
        authMethod: 'session',
      });

      render(<NavbarClient />);

      // Should show unauthenticated state when no JWT (JWT priority)
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      });
    });
  });
});
