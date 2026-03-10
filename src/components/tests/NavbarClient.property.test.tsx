/**
 * Property-Based Tests for NavbarClient Component
 * 
 * Feature: navbar
 * 
 * This test file uses property-based testing to verify that the navbar
 * displays correct navigation options based on authentication state,
 * for ANY possible authentication state from AuthCoordinator.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import NavbarClient from '../NavbarClient';
import * as AuthCoordinator from '@/lib/auth/AuthCoordinator';
import type { ExtendedAuthState } from '@/lib/auth/AuthCoordinator';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthCoordinator
jest.mock('@/lib/auth/AuthCoordinator', () => ({
  getAuthState: jest.fn(),
}));

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

import { useRouter } from 'next/navigation';

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

/**
 * Arbitrary generator for ExtendedAuthState objects
 * Generates valid authentication state structures
 */
const authStateArbitrary = fc.record({
  hasJWT: fc.boolean(),
  hasSession: fc.boolean(),
  isAuthenticated: fc.boolean(),
  userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  inFallbackMode: fc.boolean(),
  authMethod: fc.constantFrom('jwt' as const, 'session' as const, 'none' as const),
  reason: fc.option(fc.string(), { nil: undefined }),
});

/**
 * Arbitrary generator for authenticated state (hasJWT = true)
 */
const authenticatedStateArbitrary = authStateArbitrary.map(state => ({
  ...state,
  hasJWT: true,
  isAuthenticated: true,
  authMethod: 'jwt' as const,
}));

/**
 * Arbitrary generator for unauthenticated state (hasJWT = false)
 */
const unauthenticatedStateArbitrary = authStateArbitrary.map(state => ({
  ...state,
  hasJWT: false,
  isAuthenticated: false,
  authMethod: 'none' as const,
}));

describe('Property-Based Tests: NavbarClient', () => {
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

  /**
   * Feature: navbar, Property 1: Home Link Always Present
   * 
   * For ANY authentication state (authenticated or unauthenticated), the navbar
   * should always display a Home navigation link.
   * 
   * **Validates: Requirements 1.1, 2.3, 3.3**
   */
  test('Property 1: Home link always present', async () => {
    await fc.assert(
      fc.asyncProperty(authStateArbitrary, async (authState) => {
        mockGetAuthState.mockResolvedValue(authState);
        
        const { unmount } = render(<NavbarClient />);

        try {
          // Wait for component to load
          await waitFor(() => {
            const homeLink = screen.getByRole('link', { name: /home/i });
            expect(homeLink).toBeInTheDocument();
            expect(homeLink).toHaveAttribute('href', '/');
          });
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Feature: navbar, Property 2: Unauthenticated Navigation Links
   * 
   * For ANY unauthenticated state (hasJWT=false), the navbar should display
   * Login and Register links with correct href attributes.
   * 
   * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
   */
  test('Property 2: Unauthenticated navigation links', async () => {
    await fc.assert(
      fc.asyncProperty(unauthenticatedStateArbitrary, async (authState) => {
        mockGetAuthState.mockResolvedValue(authState);
        
        const { unmount } = render(<NavbarClient />);

        try {
          // Wait for component to load and check links
          await waitFor(() => {
            // Login link should be present
            const loginLink = screen.getByRole('link', { name: /login/i });
            expect(loginLink).toBeInTheDocument();
            expect(loginLink).toHaveAttribute('href', '/login');

            // Register link should be present
            const registerLink = screen.getByRole('link', { name: /register/i });
            expect(registerLink).toBeInTheDocument();
            expect(registerLink).toHaveAttribute('href', '/register');
          });
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Feature: navbar, Property 3: Authenticated Users Exclude Auth Links
   * 
   * For ANY authenticated state (hasJWT=true), the navbar should
   * NOT display Login or Register links.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property 3: Authenticated users exclude auth links', async () => {
    await fc.assert(
      fc.asyncProperty(authenticatedStateArbitrary, async (authState) => {
        mockGetAuthState.mockResolvedValue(authState);
        
        const { unmount } = render(<NavbarClient />);

        try {
          // Wait for component to load
          await waitFor(() => {
            // Dashboard link should be present (confirms loaded state)
            const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
            expect(dashboardLink).toBeInTheDocument();
          });

          // Login link should NOT be present
          const loginLink = screen.queryByRole('link', { name: /^login$/i });
          expect(loginLink).not.toBeInTheDocument();

          // Register link should NOT be present
          const registerLink = screen.queryByRole('link', { name: /^register$/i });
          expect(registerLink).not.toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Feature: navbar, Property 4: Authenticated User Account Access
   * 
   * For ANY authenticated state (hasJWT=true), the navbar should
   * display account access options such as a Dashboard link.
   * 
   * **Validates: Requirements 3.4, 3.5**
   */
  test('Property 4: Authenticated user account access', async () => {
    await fc.assert(
      fc.asyncProperty(authenticatedStateArbitrary, async (authState) => {
        mockGetAuthState.mockResolvedValue(authState);
        
        const { unmount } = render(<NavbarClient />);

        try {
          // Wait for component to load and check dashboard link
          await waitFor(() => {
            // Dashboard link should be present for authenticated users
            const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
            expect(dashboardLink).toBeInTheDocument();
            expect(dashboardLink).toHaveAttribute('href', '/dashboard');
          });
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Feature: navbar, Property 5: Keyboard Accessibility
   * 
   * For ALL navigation links in the navbar (regardless of authentication state),
   * they should be rendered as proper anchor elements to ensure keyboard accessibility.
   * 
   * **Validates: Requirements 5.4**
   */
  test('Property 5: Keyboard accessibility', async () => {
    await fc.assert(
      fc.asyncProperty(authStateArbitrary, async (authState) => {
        mockGetAuthState.mockResolvedValue(authState);
        
        const { unmount } = render(<NavbarClient />);

        try {
          // Wait for component to load
          await waitFor(() => {
            const allLinks = screen.getAllByRole('link');
            expect(allLinks.length).toBeGreaterThanOrEqual(1);
          });

          // Get all links in the navbar
          const allLinks = screen.getAllByRole('link');

          // All links should be anchor elements (accessible via keyboard)
          allLinks.forEach(link => {
            expect(link.tagName).toBe('A');
            expect(link).toHaveAttribute('href');
          });

          // Should have at least the Home link
          expect(allLinks.length).toBeGreaterThanOrEqual(1);

          // If unauthenticated (no JWT), should have Home + Login + Register = 3 links
          if (!authState.hasJWT) {
            expect(allLinks.length).toBe(3);
          }

          // If authenticated (has JWT), should have Home + Dashboard = 2 links
          // Note: LogoutButton is a button, not a link, so it's not counted
          if (authState.hasJWT) {
            expect(allLinks.length).toBe(2);
          }
        } finally {
          unmount();
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
