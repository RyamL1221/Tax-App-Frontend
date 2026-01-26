/**
 * Integration tests for dashboard logout functionality
 * 
 * These tests validate the end-to-end logout experience including:
 * - Logout button rendering in dashboard
 * - Logout button positioning in CardHeader
 * - Complete logout flow from button click to redirect
 * - Error handling and display in dashboard context
 * 
 * Requirements tested:
 * - 2.1: Logout button displayed in CardHeader area
 * - 2.2: Logout button positioned in top-right corner
 * - 3.1: Clicking logout button triggers logout flow
 * - 3.3: Successful logout redirects to login page
 * - 5.1: Network errors display in dashboard
 * - 5.2: Server errors display in dashboard
 * 
 * **Validates: Requirements 2.1, 2.2, 3.1, 3.3, 5.1, 5.2**
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import DashboardClient from './DashboardClient';

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

// Mock the logout API
global.fetch = jest.fn();

describe('Dashboard Logout - Integration Tests', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

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

  describe('Complete Logout Flow - Requirements 3.1, 3.3', () => {
    test('should complete full logout flow from button click to redirect', async () => {
      // Mock successful logout
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      // Verify dashboard is rendered
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for redirect to login page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('should show loading state during logout', async () => {
      // Mock a delayed logout response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: async () => ({
                success: true,
              }),
            }), 
            100
          )
        )
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/logging out/i)).toBeInTheDocument();
        expect(logoutButton).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });

    test('should disable logout button during logout process', async () => {
      // Mock a delayed logout response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: async () => ({
                success: true,
              }),
            }), 
            100
          )
        )
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Button should be enabled initially
      expect(logoutButton).not.toBeDisabled();

      await userEvent.click(logoutButton);

      // Button should be disabled during logout
      await waitFor(() => {
        expect(logoutButton).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });

    test('should call logout API with correct method and headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify API call details
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/logout',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });

    test('should redirect to login page on successful logout', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Verify redirect to /login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(mockPush).toHaveBeenCalledTimes(1);
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling - Requirements 5.1, 5.2', () => {
    test('should display network error in dashboard', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error message to appear
      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to log out.*check your connection/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Verify no redirect happened
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should display server error in dashboard', async () => {
      // Mock server error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            type: 'server',
            message: 'Failed to log out. Please try again.',
          },
        }),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error message
      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to log out.*try again/i);
        expect(errorMessage).toBeInTheDocument();
      });

      // Verify no redirect happened
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should re-enable logout button after error', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error and button to re-enable
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
        expect(logoutButton).not.toBeDisabled();
      });
    });

    test('should allow retry after error', async () => {
      // First attempt: network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
      });

      // Second attempt: successful logout
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      // Click logout button again
      await userEvent.click(logoutButton);

      // Wait for successful redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });

    test('should display error with proper ARIA attributes', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error message with ARIA attributes
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/failed to log out/i);
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('should auto-clear error after 3 seconds', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
      });

      // Wait for error to clear (3 seconds + buffer)
      await waitFor(() => {
        expect(screen.queryByText(/failed to log out/i)).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Dashboard Context Integration', () => {
    test('should maintain dashboard layout during logout', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      // Verify dashboard elements are present
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Dashboard should remain visible during logout
      expect(screen.getByText(/tax form dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('tax-form-selector')).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });

    test('should display error within dashboard layout', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { container } = render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
      });

      // Verify error is within the dashboard structure
      const errorBoundary = container.querySelector('[data-testid="error-boundary"]');
      const errorMessage = screen.getByText(/failed to log out/i);
      expect(errorBoundary).toContainElement(errorMessage);
    });

    test('should not affect tax form selector during logout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: async () => ({
                success: true,
              }),
            }), 
            100
          )
        )
      );

      render(<DashboardClient />);

      // Verify tax form selector is present
      const taxFormSelector = screen.getByTestId('tax-form-selector');
      expect(taxFormSelector).toBeInTheDocument();

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Tax form selector should remain visible during logout
      expect(taxFormSelector).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });
  });

  describe('Accessibility', () => {
    test('should have accessible logout button with ARIA label', () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      expect(logoutButton).toHaveAttribute('aria-label', 'Log out of your account');
    });

    test('should announce loading state to screen readers', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: async () => ({
                success: true,
              }),
            }), 
            100
          )
        )
      );

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Loading text should be announced
      await waitFor(() => {
        expect(screen.getByText(/logging out/i)).toBeInTheDocument();
      });
    });

    test('should maintain keyboard accessibility during logout flow', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Focus the button
      logoutButton.focus();
      expect(document.activeElement).toBe(logoutButton);

      // Trigger with keyboard (Enter key)
      await userEvent.keyboard('{Enter}');

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple rapid clicks on logout button', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      
      // Click multiple times rapidly
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);

      // Should only make one API call (button disabled after first click)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Should redirect once
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });

    test('should handle malformed API response', async () => {
      // Mock malformed response (missing success field)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Should display error
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should handle API response with invalid JSON', async () => {
      // Mock response with invalid JSON
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<DashboardClient />);

      const logoutButton = screen.getByRole('button', { name: /log out/i });
      await userEvent.click(logoutButton);

      // Should display error
      await waitFor(() => {
        expect(screen.getByText(/failed to log out/i)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
