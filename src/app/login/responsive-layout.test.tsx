/**
 * Comprehensive unit tests for responsive layout and touch-friendly sizes
 * 
 * This test file specifically validates:
 * - Requirements 6.1: Mobile layout (width < 768px)
 * - Requirements 6.2: Desktop layout (width >= 768px)
 * - Requirements 6.4: Touch-friendly button sizes (minimum 44x44px)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPageClient from './LoginPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useLoginForm hook
jest.mock('@/hooks/useLoginForm', () => ({
  useLoginForm: jest.fn(() => ({
    register: jest.fn((name) => ({
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    handleSubmit: jest.fn((callback) => (e: React.FormEvent) => {
      e.preventDefault();
      callback({ email: 'test@example.com', password: 'password123' });
    }),
    errors: {},
    isSubmitting: false,
    showPassword: false,
    togglePasswordVisibility: jest.fn(),
    onSubmit: jest.fn(),
    authError: null,
    isRateLimited: false,
    rateLimitRemainingTime: 0,
    clearFieldError: jest.fn(),
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

describe('Responsive Layout - Comprehensive Tests', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Requirement 6.1: Mobile Layout (width < 768px)', () => {
    test('should use full width container on mobile', () => {
      const { container } = render(<LoginPageClient />);

      const responsiveContainer = container.querySelector('.w-full');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('w-full');
    });

    test('should constrain maximum width to md (28rem/448px)', () => {
      const { container } = render(<LoginPageClient />);

      const responsiveContainer = container.querySelector('.max-w-md');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('max-w-md');
    });

    test('should have mobile-appropriate horizontal padding (px-4)', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4');
    });

    test('should have mobile-appropriate vertical padding (py-12)', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('py-12');
    });

    test('should display single-column layout with centered content', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    test('should use smaller text size on mobile for title (text-2xl)', () => {
      render(<LoginPageClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-2xl');
    });

    test('should use smaller text size on mobile for description (text-sm)', () => {
      render(<LoginPageClient />);

      const description = screen.getByText(/Enter your credentials/i);
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('Requirement 6.2: Desktop Layout (width >= 768px)', () => {
    test('should increase padding on tablet screens (sm:px-6)', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('sm:px-6');
    });

    test('should increase padding on large screens (lg:px-8)', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('lg:px-8');
    });

    test('should use elevated card variant for desktop', () => {
      render(<LoginPageClient />);

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-variant', 'elevated');
    });

    test('should apply shadow-xl for elevated card appearance', () => {
      render(<LoginPageClient />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-xl');
    });

    test('should increase title text size on desktop (sm:text-3xl)', () => {
      render(<LoginPageClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('sm:text-3xl');
    });

    test('should increase description text size on desktop (sm:text-base)', () => {
      render(<LoginPageClient />);

      const description = screen.getByText(/Enter your credentials/i);
      expect(description).toHaveClass('sm:text-base');
    });

    test('should maintain centered card layout on desktop', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Requirement 6.4: Touch-Friendly Button Sizes (minimum 44x44px)', () => {
    test('should render submit button with minimum height of 44px on mobile', () => {
      render(<LoginPageClient />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      
      // The button should have min-h-[44px] class for mobile
      expect(submitButton).toHaveClass('min-h-[44px]');
    });

    test('should render password visibility toggle with minimum 44x44px touch target', () => {
      render(<LoginPageClient />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
      
      // The toggle button should have min-w-[44px] and min-h-[44px] classes
      expect(toggleButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    });

    test('should render email input with minimum height of 44px on mobile', () => {
      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      
      // The input should have min-h-[44px] class for mobile
      expect(emailInput).toHaveClass('min-h-[44px]');
    });

    test('should render password input with minimum height of 44px on mobile', () => {
      render(<LoginPageClient />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      
      // The input should have min-h-[44px] class for mobile
      expect(passwordInput).toHaveClass('min-h-[44px]');
    });

    test('should use larger button size on desktop (md:min-h-[48px])', () => {
      render(<LoginPageClient />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // The button should have md:min-h-[48px] class for desktop
      expect(submitButton).toHaveClass('md:min-h-[48px]');
    });

    test('should use smaller toggle button on desktop (md:min-w-[36px] md:min-h-[36px])', () => {
      render(<LoginPageClient />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      
      // The toggle button can be smaller on desktop where precision is easier
      expect(toggleButton).toHaveClass('md:min-w-[36px]', 'md:min-h-[36px]');
    });

    test('should use smaller input height on desktop (md:min-h-[40px])', () => {
      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Inputs can be slightly smaller on desktop
      expect(emailInput).toHaveClass('md:min-h-[40px]');
      expect(passwordInput).toHaveClass('md:min-h-[40px]');
    });

    test('should have proper spacing between form elements for touch targets', () => {
      const { container } = render(<LoginPageClient />);

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      // Form should have space-y-6 for proper spacing between elements
      expect(form).toHaveClass('space-y-6');
    });

    test('should have proper padding in card content for touch targets', () => {
      render(<LoginPageClient />);

      const cardContent = screen.getByTestId('card-content');
      
      // Card content should have pb-8 for proper bottom padding
      expect(cardContent).toHaveClass('pb-8');
    });

    test('should have proper spacing in card header', () => {
      render(<LoginPageClient />);

      const cardHeader = screen.getByTestId('card-header');
      
      // Card header should have space-y-2 and pb-6
      expect(cardHeader).toHaveClass('space-y-2', 'pb-6');
    });
  });

  describe('Responsive Text Sizing', () => {
    test('should use responsive font sizes for title', () => {
      render(<LoginPageClient />);

      const title = screen.getByRole('heading', { level: 1 });
      
      // Title should scale from text-2xl to sm:text-3xl
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    test('should use responsive font sizes for description', () => {
      render(<LoginPageClient />);

      const description = screen.getByText(/Enter your credentials/i);
      
      // Description should scale from text-sm to sm:text-base
      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });

    test('should use base text size for inputs', () => {
      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Inputs should use text-base for readability
      expect(emailInput).toHaveClass('text-base');
      expect(passwordInput).toHaveClass('text-base');
    });

    test('should use smaller text on desktop for inputs (md:text-sm)', () => {
      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Inputs can use smaller text on desktop
      expect(emailInput).toHaveClass('md:text-sm');
      expect(passwordInput).toHaveClass('md:text-sm');
    });
  });

  describe('Background and Container Styling', () => {
    test('should have light gray background', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gray-50');
    });

    test('should take full viewport height', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('min-h-screen');
    });

    test('should use flexbox for centering', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Accessibility and Semantic Structure', () => {
    test('should have proper heading hierarchy', () => {
      render(<LoginPageClient />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Sign in to your account');
    });

    test('should have descriptive text for users', () => {
      render(<LoginPageClient />);

      const description = screen.getByText(/Enter your credentials to access your tax preparation dashboard/i);
      expect(description).toBeInTheDocument();
    });

    test('should wrap content in error boundary for error handling', () => {
      render(<LoginPageClient />);

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
    });

    test('should provide signup link for new users', () => {
      render(<LoginPageClient />);

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });
});
