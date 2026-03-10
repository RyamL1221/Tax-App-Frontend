/**
 * Unit tests for responsive layout and touch-friendly sizes
 * 
 * This test file validates:
 * - Requirements 8.1: Mobile layout (stacked fields)
 * - Requirements 8.2: Desktop layout (proper spacing)
 * - Requirements 8.3: Proper spacing on larger screens
 * - Requirements 8.4: Touch-friendly tap targets (minimum 44x44px)
 * 
 * Note: The responsive styles are already implemented in the components.
 * These tests verify that the styles are correctly applied.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPageClient from '../RegisterPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useRegistrationForm hook
jest.mock('@/hooks/useRegistrationForm', () => ({
  useRegistrationForm: jest.fn(() => ({
    formData: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    errors: {},
    isLoading: false,
    isRateLimited: false,
    rateLimitMessage: '',
    passwordStrength: 'weak',
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    }),
  })),
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

describe('Responsive Layout Tests', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock fetch for auth check to fail (not authenticated)
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Not authenticated'))
    ) as jest.Mock;
  });

  describe('Requirement 8.1 & 8.2: Mobile and Desktop Layout', () => {
    test('should render responsive container with proper width constraints', async () => {
      const { container } = render(<RegisterPageClient />);

      // Wait for component to render after auth check
      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      // Should have full width with max-width constraint
      const responsiveContainer = container.querySelector('.w-full.max-w-md');
      expect(responsiveContainer).toBeInTheDocument();
    });

    test('should have responsive padding on main container', async () => {
      const { container } = render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4', 'py-12', 'sm:px-6', 'lg:px-8');
    });

    test('should center content with flexbox', async () => {
      const { container } = render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Requirement 8.3: Proper Spacing', () => {
    test('should have proper spacing between form elements', async () => {
      const { container } = render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-6');
    });

    test('should have proper card header spacing', async () => {
      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const cardHeader = screen.getByTestId('card-header');
      expect(cardHeader).toHaveClass('space-y-2', 'pb-6', 'text-center');
    });

    test('should have proper card content padding', async () => {
      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('pb-8');
    });
  });

  describe('Requirement 8.4: Touch-Friendly Tap Targets', () => {
    test('should have minimum 44px height for submit button on mobile', async () => {
      render(<RegisterPageClient />);

      const submitButton = await screen.findByRole('button', { name: /create account/i });
      expect(submitButton).toHaveClass('min-h-[44px]');
    });

    test('should have minimum 44px height for all input fields on mobile', async () => {
      render(<RegisterPageClient />);

      const fullNameInput = await screen.findByLabelText(/full name/i);
      const emailInput = await screen.findByLabelText(/email address/i);
      const passwordInput = await screen.findByLabelText(/^password$/i);
      const confirmPasswordInput = await screen.findByLabelText(/confirm password/i);
      
      expect(fullNameInput).toHaveClass('min-h-[44px]');
      expect(emailInput).toHaveClass('min-h-[44px]');
      expect(passwordInput).toHaveClass('min-h-[44px]');
      expect(confirmPasswordInput).toHaveClass('min-h-[44px]');
    });

    test('should have responsive sizing for desktop', async () => {
      render(<RegisterPageClient />);

      const submitButton = await screen.findByRole('button', { name: /create account/i });
      const fullNameInput = await screen.findByLabelText(/full name/i);
      
      // Desktop sizes
      expect(submitButton).toHaveClass('md:min-h-[48px]');
      expect(fullNameInput).toHaveClass('md:min-h-[40px]');
    });
  });

  describe('Responsive Typography', () => {
    test('should have responsive title sizing', async () => {
      render(<RegisterPageClient />);

      const title = await screen.findByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    test('should have responsive description sizing', async () => {
      render(<RegisterPageClient />);

      const description = await screen.findByText(/Sign up to get started/i);
      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });

    test('should have responsive input text sizing', async () => {
      render(<RegisterPageClient />);

      const fullNameInput = await screen.findByLabelText(/full name/i);
      expect(fullNameInput).toHaveClass('text-base', 'md:text-sm');
    });
  });

  describe('Visual Design', () => {
    test('should have proper background color', async () => {
      const { container } = render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gray-50');
    });

    test('should use elevated card variant with shadow', async () => {
      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-variant', 'elevated');
      expect(card).toHaveClass('shadow-xl');
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', async () => {
      render(<RegisterPageClient />);

      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Create your account');
    });

    test('should have descriptive text', async () => {
      render(<RegisterPageClient />);

      const description = await screen.findByText(/Sign up to get started with your tax preparation/i);
      expect(description).toBeInTheDocument();
    });

    test('should provide login link for existing users', async () => {
      render(<RegisterPageClient />);

      const loginLink = await screen.findByRole('link', { name: /log in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });
});
