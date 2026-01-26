/**
 * Property-Based Tests for NavbarClient Component
 * 
 * Feature: navbar
 * 
 * This test file uses property-based testing to verify that the navbar
 * displays correct navigation options based on authentication state,
 * for ANY possible session data.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import NavbarClient from './NavbarClient';
import type { SessionData } from '@/lib/session';

/**
 * Arbitrary generator for SessionData objects
 * Generates valid session data structures
 */
const sessionDataArbitrary = fc.record({
  userId: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  createdAt: fc.integer({ min: Date.now() - 1000000, max: Date.now() }),
  expiresAt: fc.integer({ min: Date.now() + 1000, max: Date.now() + 10000000 }),
});

/**
 * Arbitrary generator for session state (null or valid SessionData)
 * Generates both authenticated and unauthenticated states
 */
const sessionStateArbitrary = fc.oneof(
  fc.constant(null),
  sessionDataArbitrary
);

describe('Property-Based Tests: NavbarClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: navbar, Property 1: Home Link Always Present
   * 
   * For ANY session state (authenticated or unauthenticated), the navbar
   * should always display a Home navigation link.
   * 
   * **Validates: Requirements 1.1, 2.3, 3.3**
   */
  test('Property 1: Home link always present', () => {
    fc.assert(
      fc.property(sessionStateArbitrary, (session) => {
        const { unmount } = render(<NavbarClient session={session} />);

        try {
          // Home link should always be present
          const homeLink = screen.getByRole('link', { name: /home/i });
          expect(homeLink).toBeInTheDocument();
          expect(homeLink).toHaveAttribute('href', '/');
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
   * For ANY unauthenticated state (session=null), the navbar should display
   * Login and Register links with correct href attributes.
   * 
   * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
   */
  test('Property 2: Unauthenticated navigation links', () => {
    fc.assert(
      fc.property(fc.constant(null), (session) => {
        const { unmount } = render(<NavbarClient session={session} />);

        try {
          // Login link should be present
          const loginLink = screen.getByRole('link', { name: /login/i });
          expect(loginLink).toBeInTheDocument();
          expect(loginLink).toHaveAttribute('href', '/login');

          // Register link should be present
          const registerLink = screen.getByRole('link', { name: /register/i });
          expect(registerLink).toBeInTheDocument();
          expect(registerLink).toHaveAttribute('href', '/register');
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
   * For ANY valid session object (authenticated state), the navbar should
   * NOT display Login or Register links.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property 3: Authenticated users exclude auth links', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (session) => {
        const { unmount } = render(<NavbarClient session={session} />);

        try {
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
   * For ANY valid session object (authenticated state), the navbar should
   * display account access options such as a Dashboard link.
   * 
   * **Validates: Requirements 3.4, 3.5**
   */
  test('Property 4: Authenticated user account access', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (session) => {
        const { unmount } = render(<NavbarClient session={session} />);

        try {
          // Dashboard link should be present for authenticated users
          const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
          expect(dashboardLink).toBeInTheDocument();
          expect(dashboardLink).toHaveAttribute('href', '/dashboard');
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
  test('Property 5: Keyboard accessibility', () => {
    fc.assert(
      fc.property(sessionStateArbitrary, (session) => {
        const { unmount } = render(<NavbarClient session={session} />);

        try {
          // Get all links in the navbar
          const allLinks = screen.getAllByRole('link');

          // All links should be anchor elements (accessible via keyboard)
          allLinks.forEach(link => {
            expect(link.tagName).toBe('A');
            expect(link).toHaveAttribute('href');
          });

          // Should have at least the Home link
          expect(allLinks.length).toBeGreaterThanOrEqual(1);

          // If unauthenticated, should have Home + Login + Register = 3 links
          if (session === null) {
            expect(allLinks.length).toBe(3);
          }

          // If authenticated, should have Home + Dashboard = 2 links
          if (session !== null) {
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
