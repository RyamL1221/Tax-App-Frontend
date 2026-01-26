/**
 * Unit tests for LogoutButton component
 * 
 * Tests verify:
 * - Component rendering with correct text and variant
 * - Loading state display during logout
 * - Error message display
 * - Button disabled state during loading
 * - Click handler invocation
 * - Keyboard accessibility
 * - ARIA attributes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from './LogoutButton';

// Mock the useLogout hook
jest.mock('@/hooks/useLogout');
import { useLogout } from '@/hooks/useLogout';

const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>;

describe('LogoutButton', () => {
  const mockHandleLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseLogout.mockReturnValue({
      isLoading: false,
      error: null,
      handleLogout: mockHandleLogout,
    });
  });

  describe('Component Rendering', () => {
    it('should render with "Log Out" text', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Log Out');
    });

    it('should use "outline" variant', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      // The outline variant adds border-2 and border-gray-600 classes
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-gray-600');
    });

    it('should accept optional className prop', () => {
      const { container } = render(<LogoutButton className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should have ARIA label for accessibility', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveAttribute('aria-label', 'Log out of your account');
    });
  });

  describe('Loading State', () => {
    it('should display "Logging out..." text during logout', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Logging out...');
    });

    it('should be disabled during loading', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toBeDisabled();
    });

    it('should show loading indicator during logout', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not be disabled when not loading', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to log out. Please try again.';
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: errorMessage,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    it('should have proper ARIA attributes on error message', () => {
      const errorMessage = 'Failed to log out. Please try again.';
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: errorMessage,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not display error message when error is null', () => {
      render(<LogoutButton />);

      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });

    it('should display network error message', () => {
      const errorMessage = 'Failed to log out. Please check your connection and try again.';
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: errorMessage,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call handleLogout when clicked', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      await user.click(button);

      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });

    it('should not call handleLogout when disabled', async () => {
      const user = userEvent.setup();
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      
      // Attempt to click disabled button
      await user.click(button);

      // handleLogout should not be called because button is disabled
      expect(mockHandleLogout).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be keyboard accessible via Tab navigation', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      // Tab to the button
      await user.tab();

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveFocus();
    });

    it('should be activatable via Enter key', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      button.focus();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });

    it('should be activatable via Space key', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      button.focus();

      // Press Space
      await user.keyboard(' ');

      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });

    it('should not be focusable when disabled', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      
      // Disabled buttons should not be focusable
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('Accessibility Attributes', () => {
    it('should have proper button role', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-label attribute', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveAttribute('aria-label', 'Log out of your account');
    });

    it('should have aria-busy attribute when loading', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy attribute when not loading', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      // aria-busy should be false or not present when not loading
      const ariaBusy = button.getAttribute('aria-busy');
      expect(ariaBusy === null || ariaBusy === 'false').toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should transition from normal to loading state', () => {
      const { rerender } = render(<LogoutButton />);

      // Initial state
      let button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveTextContent('Log Out');
      expect(button).not.toBeDisabled();

      // Update to loading state
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });
      rerender(<LogoutButton />);

      button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toHaveTextContent('Logging out...');
      expect(button).toBeDisabled();
    });

    it('should transition from loading to error state', () => {
      mockUseLogout.mockReturnValue({
        isLoading: true,
        error: null,
        handleLogout: mockHandleLogout,
      });

      const { rerender } = render(<LogoutButton />);

      // Loading state
      let button = screen.getByRole('button', { name: /log out of your account/i });
      expect(button).toBeDisabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Update to error state
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: 'Failed to log out. Please try again.',
        handleLogout: mockHandleLogout,
      });
      rerender(<LogoutButton />);

      button = screen.getByRole('button', { name: /log out/i });
      expect(button).not.toBeDisabled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should transition from error back to normal state', () => {
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: 'Failed to log out. Please try again.',
        handleLogout: mockHandleLogout,
      });

      const { rerender } = render(<LogoutButton />);

      // Error state
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Update to normal state (error cleared)
      mockUseLogout.mockReturnValue({
        isLoading: false,
        error: null,
        handleLogout: mockHandleLogout,
      });
      rerender(<LogoutButton />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
