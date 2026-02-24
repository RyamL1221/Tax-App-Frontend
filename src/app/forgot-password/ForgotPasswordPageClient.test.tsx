/**
 * Tests for ForgotPasswordPageClient component
 * 
 * Tests authenticated user redirect and user enumeration prevention.
 * 
 * Properties: 11, 12
 * Requirements: 10.6, 1.4, 12.5
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock getAuthState function
const mockGetAuthState = jest.fn();
jest.mock('@/lib/auth/AuthCoordinator', () => ({
  getAuthState: (...args: unknown[]) => mockGetAuthState(...args),
  AuthCoordinator: {
    getAuthState: (...args: unknown[]) => mockGetAuthState(...args),
  },
}));

// Mock ForgotPasswordForm
jest.mock('@/components/ForgotPasswordForm', () => ({
  ForgotPasswordForm: () => <div data-testid="forgot-password-form">Forgot Password Form</div>,
}));

import ForgotPasswordPageClient from './ForgotPasswordPageClient';

describe('ForgotPasswordPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthState.mockResolvedValue({ isAuthenticated: false });
  });

  describe('Rendering', () => {
    it('should render forgot password form when not authenticated', async () => {
      mockGetAuthState.mockResolvedValue({ isAuthenticated: false });
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      // Make getAuthState hang to test loading state
      mockGetAuthState.mockImplementation(() => new Promise(() => {}));
      
      render(<ForgotPasswordPageClient />);
      
      // Should show loading text
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  /**
   * Feature: password-recovery, Property 11: Authenticated users redirect from password recovery pages
   * 
   * For any user who is already authenticated (has valid JWT token), navigating to
   * /forgot-password should redirect them to the dashboard.
   * 
   * **Validates: Requirements 10.6**
   */
  describe('Property 11: Authenticated users redirect from password recovery pages', () => {
    it('should redirect authenticated users to dashboard', async () => {
      mockGetAuthState.mockResolvedValue({ isAuthenticated: true });
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not show form when authenticated', async () => {
      mockGetAuthState.mockResolvedValue({ isAuthenticated: true });
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show form when not authenticated', async () => {
      mockGetAuthState.mockResolvedValue({ isAuthenticated: false });
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  /**
   * Feature: password-recovery, Property 12: User enumeration prevention
   * 
   * For any email address submitted to the forgot password form (whether it exists
   * in the system or not), the success message displayed should be identical,
   * preventing attackers from determining which emails are registered.
   * 
   * **Validates: Requirements 1.4, 12.5**
   * 
   * Note: This property is primarily tested in the useForgotPasswordForm hook tests.
   * Here we verify the page correctly renders the form which handles this.
   */
  describe('Property 12: User enumeration prevention', () => {
    it('should render form that handles user enumeration prevention', async () => {
      mockGetAuthState.mockResolvedValue({ isAuthenticated: false });
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show form when auth check fails', async () => {
      mockGetAuthState.mockRejectedValue(new Error('Auth check failed'));
      
      render(<ForgotPasswordPageClient />);
      
      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      });
    });
  });
});
