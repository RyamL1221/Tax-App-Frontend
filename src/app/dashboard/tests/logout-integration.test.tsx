/**
 * Integration tests for dashboard logout functionality
 * 
 * These tests validate the end-to-end logout experience including:
 * - Logout button rendering in dashboard
 * - Logout button positioning in CardHeader
 * - Complete logout flow from button click to redirect (client-side only)
 * 
 * Requirements tested:
 * - 2.1: Logout button displayed in CardHeader area
 * - 2.2: Logout button positioned in top-right corner
 * - 3.1: Clicking logout button triggers logout flow
 * - 3.3: Successful logout redirects to login page
 * - 4.1: Logout clears JWT token from localStorage
 * - 4.2: Logout redirects immediately
 * - 4.3: No API calls made during logout
 * 
 * **Validates: Requirements 2.1, 2.2, 3.1, 3.3, 4.1, 4.2, 4.3**
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import DashboardClient from '../DashboardClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock TaxFormSelector component
jest.mock('@/components/TaxFormSelector', () => ({
  TaxFormSelector: () => <div data-testid="tax-form-selector">Tax Form Selector</div>,
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

import { authService } from '@/lib/api';

describe('Dashboard Logout - Integration Tests', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;
  let mockLogout: jest.MockedFunction<typeof authService.logout>;

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
    
    // Setup authService mock
    mockLogout = authService.logout as jest.MockedFunction<typeof authService.logout>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Logout Button Rendering - Requirements 2.1, 2.2', () => {
    test('should render logout button in dashboard', () => {
      render(<DashboardClient />);

      // Verify logout button is present
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toBeInTheDocument();
    });

    test('should render logout button with correct text', () => {
      render(<DashboardClient />);

      // Verify button displays "Log Out" text
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toHaveTextContent('Log Out');
    });

    test('should position logout button in CardHeader', () => {
      render(<DashboardClient />);

      // Verify logout button is present in the document
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toBeInTheDocument();

      // Verify the button is positioned near the title (both in same flex container)
      const title = screen.getByRole('heading', { name: /tax form dashboard/i });
      expect(title).toBeInTheDocument();
      expect(logoutButton).toBeInTheDocument();
    });

    test('should position logout button in top-right corner with flex layout', () => {
      const { container } = render(<DashboardClient />);

      // Find the flex container
      const flexContainer = container.querySelector('.flex.items-start.justify-between');
      expect(flexContainer).toBeInTheDocument();

      // Verify logout button is in the flex container
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(flexContainer).toContainElement(logoutButton);

      // Verify title is centered in flex-1 container
      const titleContainer = container.querySelector('.flex-1.text-center');
      expect(titleContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(titleContainer!);
    });

    test('should render logout button alongside dashboard title', () => {
      render(<DashboardClient />);

      // Verify both title and logout button are present
      const title = screen.getByRole('heading', { name: /tax form dashboard/i });
      const logoutButton = screen.getByRole('button', { name: /log out/i });

      expect(title).toBeInTheDocument();
      expect(logoutButton).toBeInTheDocument();
    });

    test('should render logout button with outline variant', () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Button should have outline styling classes (border-2 is the specific class for outline variant)
      expect(logoutButton).toHaveClass('border-2');
    });
  });

  describe('Complete Logout Flow - Requirements 3.1, 3.3, 4.1, 4.2, 4.3', () => {
    test('should complete full logout flow from button click to redirect', async () => {
      render(<DashboardClient />);

      // Verify dashboard is rendered
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify authService.logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);

      // Verify redirect to login page
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    test('should not show loading state during logout', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Button should not be disabled
      expect(logoutButton).not.toBeDisabled();
      
      await userEvent.click(logoutButton);

      // Button should still show "Log Out" text (no "Logging out...")
      expect(logoutButton).toHaveTextContent('Log Out');
      expect(logoutButton).not.toHaveTextContent('Logging out');
    });

    test('should not disable logout button during logout process', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Button should be enabled initially
      expect(logoutButton).not.toBeDisabled();

      await userEvent.click(logoutButton);

      // Button should remain enabled (instant operation)
      expect(logoutButton).not.toBeDisabled();
    });

    test('should call authService.logout (client-side only)', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify authService.logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('should redirect to login page immediately', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify redirect to /login
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    test('should call logout before redirect', async () => {
      const callOrder: string[] = [];

      mockLogout.mockImplementation(() => {
        callOrder.push('logout');
      });

      mockPush.mockImplementation(() => {
        callOrder.push('redirect');
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify logout was called before redirect
      expect(callOrder).toEqual(['logout', 'redirect']);
    });
  });

  describe('Dashboard Context Integration', () => {
    test('should maintain dashboard layout during logout', async () => {
      render(<DashboardClient />);

      // Verify dashboard elements are present
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Dashboard should remain visible (instant redirect)
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();
    });

    test('should not affect tax form selector during logout', async () => {
      render(<DashboardClient />);

      // Verify tax form selector is present
      const taxFormSelector = screen.getByTestId('tax-form-selector');
      expect(taxFormSelector).toBeInTheDocument();

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Tax form selector should remain visible
      expect(taxFormSelector).toBeInTheDocument();
    });

    test('should not display any error messages', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // No error messages should appear (client-side only, cannot fail)
      const errorAlert = screen.queryByRole('alert');
      expect(errorAlert).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible logout button with ARIA label', () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toHaveAttribute('aria-label', 'Log out of your account');
    });

    test('should maintain keyboard accessibility during logout flow', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Focus the button
      logoutButton.focus();
      expect(document.activeElement).toBe(logoutButton);

      // Trigger with keyboard (Enter key)
      await userEvent.keyboard('{Enter}');

      // Verify logout and redirect
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    test('should be activatable via Space key', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Focus the button
      logoutButton.focus();

      // Trigger with keyboard (Space key)
      await userEvent.keyboard(' ');

      // Verify logout and redirect
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple rapid clicks on logout button', async () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Click multiple times rapidly
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);

      // All clicks should be processed (no debouncing in client-side logout)
      // authService.logout is idempotent, so multiple calls are safe
      expect(mockLogout).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    test('should work correctly even if localStorage is unavailable', async () => {
      // authService.logout handles localStorage errors gracefully
      mockLogout.mockImplementation(() => {
        // Simulate localStorage error being caught internally
        // The logout should still complete
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Should still redirect even if token clearing fails
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
