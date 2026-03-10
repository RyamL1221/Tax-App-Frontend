/**
 * Tests for logout state clearing in LoginPageClient
 * 
 * Verifies that the logout state is properly cleared when the login page mounts,
 * ensuring the state is reset after logout redirect completes.
 * 
 * Requirements: 2.4, 4.3
 */

import React from 'react';
import { render } from '@testing-library/react';
import LoginPageClient from '../LoginPageClient';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

jest.mock('@/components/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/auth/FormDataPreserver', () => ({
  hasSavedFormData: jest.fn(() => false),
  getFormDataMetadata: jest.fn(() => null),
  restoreFormData: jest.fn(() => null),
  clearFormData: jest.fn(),
}));

describe('LoginPageClient - Logout State Clearing', () => {
  beforeEach(() => {
    // Clear any existing logout state before each test
    logoutStateManager.clearLogoutState();
  });

  afterEach(() => {
    // Clean up after each test
    logoutStateManager.clearLogoutState();
  });

  describe('Requirement 2.4: Clear logout state on mount', () => {
    it('should clear logout state when component mounts', () => {
      // Set logout state to in-progress (simulating a logout that just completed)
      logoutStateManager.setLogoutInProgress();
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);

      // Render the login page
      render(<LoginPageClient />);

      // Verify logout state was cleared
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });

    it('should clear logout state even if it was already idle', () => {
      // Ensure logout state is idle
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);

      // Render the login page
      render(<LoginPageClient />);

      // Verify logout state is still idle (no errors)
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });

    it('should clear logout state on every mount', () => {
      // First mount
      const { unmount } = render(<LoginPageClient />);
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);

      // Set logout state again
      logoutStateManager.setLogoutInProgress();
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);

      // Unmount
      unmount();

      // Second mount
      render(<LoginPageClient />);
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });
  });

  describe('Requirement 4.3: Logout state cleanup after redirect', () => {
    it('should reset logout state for next logout operation', () => {
      // Simulate logout in progress
      logoutStateManager.setLogoutInProgress();
      
      // Render login page (simulating redirect completion)
      render(<LoginPageClient />);
      
      // Verify state is cleared and ready for next logout
      expect(logoutStateManager.getLogoutState()).toBe('idle');
    });

    it('should not interfere with other login page functionality', () => {
      // Set logout state
      logoutStateManager.setLogoutInProgress();

      // Render login page with props
      const { getByTestId } = render(
        <LoginPageClient 
          callbackUrl="/dashboard" 
          expired={true} 
        />
      );

      // Verify login form is rendered (normal functionality works)
      expect(getByTestId('login-form')).toBeInTheDocument();
      
      // Verify logout state was still cleared
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
    });
  });

  describe('Integration with logout flow', () => {
    it('should complete the logout sequence correctly', () => {
      // Step 1: User clicks logout (simulated by setting state)
      logoutStateManager.setLogoutInProgress();
      expect(logoutStateManager.isLogoutInProgress()).toBe(true);

      // Step 2: Token is cleared (happens in useLogout hook)
      // Step 3: Redirect to login page (simulated by rendering LoginPageClient)
      render(<LoginPageClient />);

      // Step 4: Logout state is cleared on login page mount
      expect(logoutStateManager.isLogoutInProgress()).toBe(false);
      expect(logoutStateManager.getLogoutState()).toBe('idle');
    });
  });
});
