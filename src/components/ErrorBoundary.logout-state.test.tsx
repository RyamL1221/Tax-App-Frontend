/**
 * ErrorBoundary Logout State Integration Tests
 * 
 * Tests the ErrorBoundary's integration with LogoutStateManager
 * and its ability to react to logout state changes via custom events.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

describe('ErrorBoundary Logout State Integration', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Clear any existing logout state
    logoutStateManager.clearLogoutState();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Logout UI Display', () => {
    it('should display logout UI when logout state is in-progress on mount', () => {
      // Set logout state before mounting
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Should show logout UI
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    });

    it('should display children when logout state is idle on mount', () => {
      // Ensure logout state is idle
      logoutStateManager.clearLogoutState();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Should show children
      expect(screen.getByText('Child Content')).toBeInTheDocument();
      expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
    });
  });

  describe('Event-Based State Updates', () => {
    it('should update UI when logout state changes from idle to in-progress', async () => {
      // Start with idle state
      logoutStateManager.clearLogoutState();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Initially shows children
      expect(screen.getByText('Child Content')).toBeInTheDocument();

      // Set logout state (dispatches event)
      logoutStateManager.setLogoutInProgress();

      // Should update to show logout UI
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });
      expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    });

    it('should update UI when logout state changes from in-progress to idle', async () => {
      // Start with in-progress state
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Initially shows logout UI
      expect(screen.getByText('Logging out...')).toBeInTheDocument();

      // Clear logout state (dispatches event)
      logoutStateManager.clearLogoutState();

      // Should update to show children
      await waitFor(() => {
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
      expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
    });

    it('should handle multiple rapid state changes', async () => {
      logoutStateManager.clearLogoutState();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Rapid state changes
      logoutStateManager.setLogoutInProgress();
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      logoutStateManager.clearLogoutState();
      await waitFor(() => {
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });

      logoutStateManager.setLogoutInProgress();
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      logoutStateManager.clearLogoutState();
      await waitFor(() => {
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Should have added listener
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'logoutStateChange',
        expect.any(Function)
      );

      unmount();

      // Should have removed listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'logoutStateChange',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not throw error when event is dispatched after unmount', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      unmount();

      // Should not throw error
      expect(() => {
        logoutStateManager.setLogoutInProgress();
        logoutStateManager.clearLogoutState();
      }).not.toThrow();
    });
  });

  describe('Logout UI Rendering', () => {
    it('should render spinner when logout is in progress', () => {
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Check for spinner (has animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
    });

    it('should render full-screen logout UI', () => {
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Check for full-screen container
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling During Logout', () => {
    it('should prioritize logout UI over error UI when logout is in progress', async () => {
      logoutStateManager.setLogoutInProgress();

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should show logout UI, not error UI
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should show error UI after logout completes', async () => {
      logoutStateManager.setLogoutInProgress();

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Initially shows logout UI
      expect(screen.getByText('Logging out...')).toBeInTheDocument();

      // Clear logout state
      logoutStateManager.clearLogoutState();

      // Should now show error UI
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
      expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy requirement 2.1: ErrorBoundary re-renders when logout state changes', async () => {
      logoutStateManager.clearLogoutState();

      render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      // Set logout state
      logoutStateManager.setLogoutInProgress();

      // Should re-render and show logout UI
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      // Clear logout state
      logoutStateManager.clearLogoutState();

      // Should re-render and show children
      await waitFor(() => {
        expect(screen.getByText('Child Content')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 2.2: LoginPageClient clearing state updates ErrorBoundary', async () => {
      // Simulate logout flow: logout state is set, then cleared by LoginPageClient
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Login Page Content</div>
        </ErrorBoundary>
      );

      // Initially shows logout UI
      expect(screen.getByText('Logging out...')).toBeInTheDocument();

      // Simulate LoginPageClient clearing state
      logoutStateManager.clearLogoutState();

      // ErrorBoundary should detect change and update UI
      await waitFor(() => {
        expect(screen.getByText('Login Page Content')).toBeInTheDocument();
      });
    });

    it('should satisfy requirement 2.3: React triggers re-render on logout state change', async () => {
      logoutStateManager.clearLogoutState();

      const { container } = render(
        <ErrorBoundary>
          <div>Child Content</div>
        </ErrorBoundary>
      );

      const initialHTML = container.innerHTML;

      // Change logout state
      logoutStateManager.setLogoutInProgress();

      // Wait for re-render
      await waitFor(() => {
        expect(container.innerHTML).not.toBe(initialHTML);
      });

      // Verify UI changed
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
    });

    it('should satisfy requirement 2.4: ErrorBoundary displays normal content when logout state is cleared', async () => {
      logoutStateManager.setLogoutInProgress();

      render(
        <ErrorBoundary>
          <div>Normal Content</div>
        </ErrorBoundary>
      );

      // Clear logout state
      logoutStateManager.clearLogoutState();

      // Should display normal content
      await waitFor(() => {
        expect(screen.getByText('Normal Content')).toBeInTheDocument();
      });
      expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
    });
  });
});
