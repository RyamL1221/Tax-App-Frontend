/**
 * Unit tests for LogoutButton component
 * 
 * Tests verify:
 * - Component rendering with correct text and variant
 * - Click handler invocation
 * - Keyboard accessibility
 * - ARIA attributes
 * - Client-side logout (no API calls)
 * - Immediate redirect to login page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from '../LogoutButton';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockLogout = authService.logout as jest.MockedFunction<typeof authService.logout>;

describe('LogoutButton', () => {
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
      render(<LogoutButton className="custom-class" />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveClass('custom-class');
    });

    it('should have ARIA label for accessibility', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveAttribute('aria-label', 'Log out of your account');
    });

    it('should not be disabled', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Logout Functionality', () => {
    it('should call authService.logout when clicked', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      await user.click(button);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should redirect to login page when clicked', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      await user.click(button);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should call logout before redirect', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockLogout.mockImplementation(() => {
        callOrder.push('logout');
      });

      mockPush.mockImplementation(() => {
        callOrder.push('redirect');
      });

      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      await user.click(button);

      expect(callOrder).toEqual(['logout', 'redirect']);
    });

    it('should not display any error messages', () => {
      render(<LogoutButton />);

      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });

    it('should not display any loading state', () => {
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      expect(button).toHaveTextContent('Log Out');
      expect(button).not.toHaveTextContent('Logging out');
      expect(button).not.toBeDisabled();
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

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should be activatable via Space key', async () => {
      const user = userEvent.setup();
      render(<LogoutButton />);

      const button = screen.getByRole('button', { name: /log out/i });
      button.focus();

      // Press Space
      await user.keyboard(' ');

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
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
  });
});
