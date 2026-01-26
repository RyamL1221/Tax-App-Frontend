/**
 * Property-Based Tests for Dashboard Authentication Flow
 * 
 * Feature: tax-form-dashboard
 * Property 1: Authenticated Users See Form Selector
 * 
 * **Validates: Requirements 1.1**
 * 
 * This test file uses property-based testing to verify that authenticated users
 * can access the dashboard and see the tax form selector interface, for ANY valid
 * session data.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import DashboardClient from './DashboardClient';
import type { SessionData } from '@/lib/session';

// Mock TaxFormSelector component
jest.mock('@/components/TaxFormSelector', () => ({
  TaxFormSelector: () => <div data-testid="tax-form-selector">Tax Form Selector</div>,
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className, variant }: any) => (
    <div data-testid="card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

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

describe('Property-Based Tests: Dashboard Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: tax-form-dashboard, Property 1: Authenticated Users See Form Selector
   * 
   * For ANY authenticated user session, when navigating to the dashboard,
   * the rendered output should contain the tax form selector interface.
   * 
   * **Validates: Requirements 1.1**
   * 
   * This property test validates that the DashboardClient component correctly
   * displays the form selector for any valid session. The server component
   * (page.tsx) handles authentication verification, so this test focuses on
   * the client component rendering behavior.
   */
  test('Property 1: Authenticated Users See Form Selector', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (sessionData) => {
        // Render the DashboardClient component
        // Note: The server component (page.tsx) would have already verified
        // the session before rendering this client component
        const { unmount } = render(<DashboardClient />);

        try {
          // Verify the tax form selector is rendered
          const formSelector = screen.getByTestId('tax-form-selector');
          expect(formSelector).toBeInTheDocument();
          expect(formSelector).toHaveTextContent('Tax Form Selector');

          // Verify the dashboard title is displayed
          const title = screen.getByRole('heading', { level: 1 });
          expect(title).toBeInTheDocument();
          expect(title).toHaveTextContent('Tax Form Dashboard');

          // Verify the dashboard description is displayed
          const description = screen.getByText(/Select a tax form to begin filling out your information/i);
          expect(description).toBeInTheDocument();

          // Verify the card structure is present
          const card = screen.getByTestId('card');
          expect(card).toBeInTheDocument();

          // Verify the form selector is within the card content
          const cardContent = screen.getByTestId('card-content');
          expect(cardContent).toContainElement(formSelector);
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
   * Property: Dashboard displays consistent UI structure for all sessions
   * 
   * For ANY valid session data, the dashboard should display the same
   * UI structure with all required elements present.
   * 
   * **Validates: Requirements 1.1**
   */
  test('Property: Dashboard displays consistent UI structure for all sessions', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (sessionData) => {
        const { unmount } = render(<DashboardClient />);

        try {
          // Verify all key UI elements are present
          expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
          expect(screen.getByTestId('card')).toBeInTheDocument();
          expect(screen.getByTestId('card-header')).toBeInTheDocument();
          expect(screen.getByTestId('card-content')).toBeInTheDocument();
          expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();
          expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
          expect(screen.getByRole('link', { name: /Visit our help center/i })).toBeInTheDocument();

          // Verify the help link has correct href
          const helpLink = screen.getByRole('link', { name: /Visit our help center/i });
          expect(helpLink).toHaveAttribute('href', '/help');
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
   * Property: Form selector is always accessible within dashboard
   * 
   * For ANY valid session, the form selector should be accessible
   * and properly integrated within the dashboard layout.
   * 
   * **Validates: Requirements 1.1**
   */
  test('Property: Form selector is always accessible within dashboard', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (sessionData) => {
        const { unmount } = render(<DashboardClient />);

        try {
          // Verify form selector is accessible
          const formSelector = screen.getByTestId('tax-form-selector');
          expect(formSelector).toBeInTheDocument();
          expect(formSelector).toBeVisible();

          // Verify it's within the card content (proper hierarchy)
          const cardContent = screen.getByTestId('card-content');
          expect(cardContent).toContainElement(formSelector);

          // Verify the card is within the error boundary
          const errorBoundary = screen.getByTestId('error-boundary');
          const card = screen.getByTestId('card');
          expect(errorBoundary).toContainElement(card);
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
   * Property: Dashboard title and description are always present
   * 
   * For ANY valid session, the dashboard should display the title
   * and description text to guide users.
   * 
   * **Validates: Requirements 1.1**
   */
  test('Property: Dashboard title and description are always present', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (sessionData) => {
        const { unmount } = render(<DashboardClient />);

        try {
          // Verify title
          const title = screen.getByRole('heading', { level: 1 });
          expect(title).toBeInTheDocument();
          expect(title).toHaveTextContent('Tax Form Dashboard');

          // Verify description
          const description = screen.getByText(/Select a tax form to begin filling out your information/i);
          expect(description).toBeInTheDocument();

          // Verify both are within the card header
          const cardHeader = screen.getByTestId('card-header');
          expect(cardHeader).toContainElement(title);
          expect(cardHeader).toContainElement(description);
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
   * Property: Dashboard renders without errors for any valid session
   * 
   * For ANY valid session data, the dashboard should render successfully
   * without throwing errors or displaying error states.
   * 
   * **Validates: Requirements 1.1**
   */
  test('Property: Dashboard renders without errors for any valid session', () => {
    fc.assert(
      fc.property(sessionDataArbitrary, (sessionData) => {
        // This test verifies that rendering doesn't throw
        let renderError: Error | null = null;
        let unmount: (() => void) | null = null;

        try {
          const result = render(<DashboardClient />);
          unmount = result.unmount;

          // Verify basic rendering succeeded
          expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();
        } catch (error) {
          renderError = error as Error;
        } finally {
          if (unmount) {
            unmount();
          }
        }

        // Assert no errors occurred
        expect(renderError).toBeNull();
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });
});
